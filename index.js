var express = require('express');
var socket = require('socket.io');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt'); // Importar bcrypt para el manejo de contraseñas
var app = express();

// Conexión a MongoDB Atlas
mongoose.connect('mongodb+srv://AlexanderMartinez:MABJ030923HMCRNNA5@ejercicio.32n5k.mongodb.net/', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
}).then(() => {
    console.log('Conexión a MongoDB establecida');
}).catch(err => {
    console.error('Error de conexión a MongoDB:', err);
});

// Definición de los esquemas y modelos
var userSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    contraseña: { type: String, required: true }
});

var User = mongoose.model('User', userSchema);

var messageSchema = new mongoose.Schema({
    usuario: { type: String, required: true },
    mensaje: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

var Message = mongoose.model('Message', messageSchema);

// Configuración del servidor
var PORT = process.env.PORT || 3000; // Cambiar a un puerto no privilegiado
var server = app.listen(PORT, function() {
    console.log(`Servidor activo en el puerto ${PORT}`);
});

app.use(express.static('public'));
var io = socket(server);

// Eventos de socket.io
io.on('connection', function(socket) {
    console.log('Hay una conexión:', socket.id);

    // Registro de nuevo usuario
    socket.on('register', function(data) {
        const { nombre, contraseña } = data;

        // Verificar si el usuario ya existe
        User.findOne({ nombre })
            .then(existingUser => {
                if (existingUser) {
                    socket.emit('registerError', { mensaje: 'El nombre de usuario ya está en uso.' });
                } else {
                    // Hashear la contraseña y guardar el nuevo usuario
                    const hashedPassword = bcrypt.hashSync(contraseña, 10);
                    const newUser = new User({ nombre, contraseña: hashedPassword });
                    newUser.save()
                        .then(() => {
                            socket.emit('registerSuccess', { mensaje: 'Registro exitoso. Puedes iniciar sesión ahora.' });
                        })
                        .catch(err => {
                            console.error("Error al registrar el usuario:", err);
                            socket.emit('registerError', { mensaje: 'Error al registrar el usuario.' });
                        });
                }
            })
            .catch(err => console.error("Error al buscar el usuario:", err));
    });

    // Iniciar sesión
    socket.on('login', function(data) {
        const { nombre, contraseña } = data;
        User.findOne({ nombre })
            .then(user => {
                if (user && bcrypt.compareSync(contraseña, user.contraseña)) { // Verificar la contraseña
                    console.log(`Usuario ${nombre} inició sesión`);

                    // Emitir todos los mensajes al usuario que inicia sesión
                    Message.find().then(messages => {
                        socket.emit('allMessages', messages);
                    });

                    // Emitir un mensaje de éxito de inicio de sesión
                    socket.emit('loginSuccess', { nombre }); // Enviar nombre de usuario
                } else {
                    socket.emit('loginError', { mensaje: 'Nombre de usuario o contraseña incorrectos.' });
                }
            })
            .catch(err => console.error("Error al iniciar sesión:", err));
    });

    // Manejo de mensajes del chat
    socket.on('chat', function(data) {
        console.log(data); // Verifica que contenga el usuario y el mensaje

        // Asegúrate de que 'data.usuario' no sea undefined
        if (!data.usuario) {
            console.error('El usuario es undefined');
            return; // Salir si no hay usuario
        }

        const nuevoMensaje = new Message({
            usuario: data.usuario, // Asegúrate de que aquí se utiliza el usuario
            mensaje: data.mensaje
        });
        
        // Guardar el mensaje en la base de datos
        nuevoMensaje.save()
            .then(() => {
                io.sockets.emit('chat', data); // Emitir mensaje a todos los clientes
            })
            .catch(err => console.error("Error al guardar el mensaje:", err));
    });

    // Manejo de eventos de escritura
    socket.on('typing', function(data) {
        socket.broadcast.emit('typing', data);
    });
});
