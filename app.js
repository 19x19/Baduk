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

app.get('/go', function (req, res) {
    // If someone just goes to /go without a room ID, we generate a new one.
    // IDs are generated with SHA-1, which git uses too so I think its
    // a safe assumption that no collisions will occur
    // TODO Rate limit so that people can't DDoS our server so easily
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
    socket.on('postNewMessage', function (new_message) {
        io.emit('getNewMessage', {
            message: new_message.message,
            authorId: new_message.clientId,
            roomId: new_message.roomId,
        });
    });
    socket.on('joinRoom', function (new_user) {
        io.emit('getNewMessage', {
            message: "joined the chat.",
            authorId: new_user.clientId,
            roomId: new_user.roomId,
        });
    });
    
    socket.on('leaveRoom', function (msg) {
        io.emit('leftRoom', msg);
    });
});

http.listen(port, function () {
    console.log('Listening on *:' + port);
});

