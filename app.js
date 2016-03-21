var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));
app.use('/bower_components', express.static('bower_components'));
app.use(express.static('source/views'));

// Global controller. Basically being used as middleware.
app.get('/*', function(req, res, next) {
    // General headers for security, ranging from clickjacking protection to
    // anti-crawler protection. Note that the XSS protection only applies to
    // IE8+ and Chrome, so still sanitize all input.
    res.header('X-Frame-Options', 'DENY');
    res.header('X-Robots-Tag', 'noindex');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('X-Content-Type-Options', 'nosniff');

    next();
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/src/views/index.html');
});

app.get('/go', function (req, res) {
    res.sendFile(__dirname + '/src/views/go.html');
});

app.get('/chat', function (req, res) {
    res.sendFile(__dirname + '/chat.html')
});

io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('userSentMessage', function (msg) {
        io.emit('messageBroadcast', msg);
    });
    socket.on('register', function (msg) {
        console.log('register', msg);
    });

});

http.listen(3001, function () {
    console.log('listening on *:3000');
});

