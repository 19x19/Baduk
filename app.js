var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = 3001;

var io = require('socket.io')(http);
var favicon = require('serve-favicon');
var Ddos = require('ddos');
var xss = require('node-xss').clean;
var git = require('git-rev');
var csurf = require('csurf')

var games = require('./src/modules/games.js');
var go = require('./src/modules/go.js');

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

// The most recent commit hash
app.get('/hash', function(req, res) {
    git.long(function (str) {
        res.send(str);
    });
});

// No robots around here y'all
app.get('/robots.txt', function(req, res) {
    res.sendFile(__dirname + '/src/views/robots.txt');
});

app.get('/go', function (req, res) {
    // If someone just goes to /go without a room ID, we generate a new one.
    // IDs are generated with SHA-1, which git uses too so I think its
    // a safe assumption that no collisions will occur
    res.redirect('/go/' + games.current_hash());
});

app.get('/go/:id', function (req, res) {
    // Check if the room id games.currently exists. If not, send them back
    // to the homepage.
    if(games.game_exists(req.params.id)) {
        res.sendFile(__dirname + '/src/views/go.html');
    } else {
        res.redirect('/');
    }
});

var socketOfId = {};

io.on('connection', function (socket) {

    socketOfId[socket.id] = socket;

    // Receives some information when a new user joins
    socket.on('post_new_connect', function(info) {
        games.add_user(info, socket);
        io.to(info.room).emit('get_new_connect', {
            'username' : games.current_users[socket.id].username,
            'roommates' : games.players_in_room(info.room),
        });
        socket.emit('your_name', {
            'username': games.current_users[socket.id].username,
        });
        var current_state = go.currentState(info.room);
        if(current_state !== undefined) {
            socket.emit('new_game_state', go.currentState(info.room));
        }
    });

    // Removes a user from the room
    socket.on('post_new_disconnect', function(info) {
        io.to(info.room).emit('get_new_disconnect', {
            // TODO for some reason sometimes the user has no username on
            // disconnect...
            'username' : games.current_users[socket.id]['username'],
            'roommates' : games.players_in_room(info.room),
        });
        games.remove_user(info, socket);
    });

    // Posts a new message to the room
    socket.on('post_new_message', function (info) {
        io.to(info.room).emit('get_new_message', xss({
            'message' : info.message,
            'username' : games.current_users[socket.id]['username'],
            'color' : games.current_users[socket.id]['color'],
        }));
    });

    // Add a piece at the given position
    socket.on('post_new_piece', function (info) {
        var color = games.current_users[socket.id]['color'];
        var newState = go.applyMove(info.room, {
            'action': 'new_piece',
            'row': info.row,
            'col': info.col,
            'player_color': color
        });

        if (newState !== false) {
            newState.mostRecentMove = {
                'row': info.row,
                'col': info.col
            };
            io.to(info.room).emit('new_game_state', newState);
        } else {
            socket.emit('move_is_illegal', {}); // FIXME: this is a race condition
            console.log('illegal move');
        }

    });
});

http.listen(port, function () {
    console.log('Listening on *:' + port);
});
