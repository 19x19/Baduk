var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = 3001;

var io = require('socket.io')(http);
var favicon = require('serve-favicon');
var sha1 = require('sha1');
var Ddos = require('ddos')
var ddos = new Ddos;

app.use(express.static('public'));
app.use('/bower_components', express.static('bower_components'));
app.use('/src', express.static('src'));
app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(ddos.express)

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

// Generates a hash for a new game, and increments the
// internal count to prepare for the next call
function game_hash() {
    var count = 0;
    return function() {
        count++;
        return sha1(count);
    }
}
var current_hash = game_hash();
var current_games = [];

// TODO A function that maps a socket.id to a unique name

app.get('/go', function (req, res) {
    // If someone just goes to /go without a room ID, we generate a new one.
    // IDs are generated with SHA-1, which git uses too so I think its
    // a safe assumption that no collisions will occur
    var new_hash = current_hash();
    current_games.push(new_hash);
    res.redirect('/go/' + new_hash);
});

app.get('/go/:id', function (req, res) {
    // Check if the room id currently exists. If not, send them back
    // to the homepage.
    if(current_games.indexOf(req.params.id) >= 0) {
        res.sendFile(__dirname + '/src/views/go.html');
    } else {
        res.redirect('/');
    }
});

io.on('connection', function (socket) {
    // Recieves some information when a new user joins
    socket.on('post_new_connect', function(info) {
        socket.room = info.room;
        socket.join(info.room);
        io.to(info.room).emit('get_new_connect', {
            'socket_id' : socket.id,
        });
    });

    // Removes a user from the room
    socket.on('post_new_disconnect', function(info) {
        socket.leave(info.room);
        io.to(info.room).emit('get_new_disconnect', {
            'socket_id' : socket.id,
        });
    });

    // Posts a new message to the room
    socket.on('post_new_message', function(info) {
        io.to(info.room).emit('get_new_message', {
            message : info.message,
            author : socket.id,
        });
    });
});

http.listen(port, function () {
    console.log('Listening on *:' + port);
});

