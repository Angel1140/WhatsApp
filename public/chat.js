// var socket = io.connect('http://localhost:5000');
var socket = io.connect('http://18.191.242.247:3000');

var persona = document.getElementById('persona'),
    appChat = document.getElementById('app-chat'),
    panelBienvenida = document.getElementById('panel-bienvenida'),
    usuario = document.getElementById('usuario'),
    mensaje = document.getElementById('mensaje'),
    botonEnviar = document.getElementById('enviar'),
    escribiendoMensaje = document.getElementById('escribiendo-mensaje'),
    output = document.getElementById('output');

// Formulario de registro
var botonRegistrar = document.getElementById('registrar');
botonRegistrar.addEventListener('click', function() {
    var nombreDeUsuario = persona.value;
    var contraseña = document.getElementById('contraseña').value;

    if (nombreDeUsuario && contraseña) {
        socket.emit('register', {
            nombre: nombreDeUsuario,
            contraseña: contraseña
        });
    }
});

// Formulario de inicio de sesión
var botonIniciarSesion = document.getElementById('iniciarSesion');
botonIniciarSesion.addEventListener('click', function() {
    var nombreDeUsuario = document.getElementById('nombreInicio').value;
    var contraseña = document.getElementById('contraseñaInicio').value;

    if (nombreDeUsuario && contraseña) {
        socket.emit('login', {
            nombre: nombreDeUsuario,
            contraseña: contraseña
        });
    }
});

// Recibir confirmación de inicio de sesión exitoso
socket.on('loginSuccess', function(data) {
    panelBienvenida.style.display = "none";
    appChat.style.display = "block";
    usuario.value = data.nombre; // Guardar el nombre de usuario para el chat
    usuario.readOnly = true;

    // Cargar mensajes anteriores
    socket.emit('getMessages');
});

// Manejar el evento de enviar un mensaje
botonEnviar.addEventListener('click', function() {
    if (mensaje.value) {
        socket.emit('chat', {
            usuario: usuario.value, // Incluye el nombre de usuario en el mensaje
            mensaje: mensaje.value
        });
    }
    mensaje.value = '';
});

// Indicar que el usuario está escribiendo
mensaje.addEventListener('keyup', function() {
    if (usuario.value) {
        socket.emit('typing', {
            nombre: usuario.value
        });
    }
});

// Recibir y mostrar los mensajes en el chat
socket.on('chat', function(data) {
    escribiendoMensaje.innerHTML = ''; // Limpia el mensaje de "escribiendo"
    output.innerHTML += '<p><strong>' + data.usuario + ': </strong>' + data.mensaje + '<p>';
});

// Mostrar quién está escribiendo
socket.on('typing', function(data) {
    escribiendoMensaje.innerHTML = '<p><em>' + data.nombre + ' está escribiendo un mensaje...</em></p>';
});

// Cargar todos los mensajes al ingresar al chat
socket.on('allMessages', function(messages) {
    output.innerHTML = ''; // Limpiar mensajes previos
    messages.forEach(message => {
        output.innerHTML += `<p><strong>${message.usuario}: </strong>${message.mensaje}<p>`;
    });
});

// Manejar error de inicio de sesión
socket.on('loginError', function(data) {
    alert('Error: ' + data.mensaje);
});

// Manejar la respuesta de registro
socket.on('registerSuccess', function(data) {
    alert(data.mensaje);
    // Aquí puedes redirigir a la página de inicio de sesión si lo deseas
});

// Manejar el error de mensaje no autorizado
socket.on('error', function(data) {
    alert('Error: ' + data.mensaje);
});
