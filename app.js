// Node.js and ExpressDB related
var config = require('./config.js');
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var session = require("express-session")({
    secret: config.session_key,
    resave: true,
    saveUninitialized: true
});
var sharedsession = require("express-socket.io-session");

// Setting up HTTPS variables
var http = require('http').Server(app);
var https = require('https');
if(config.HTTPS) {
    const options = {
        key: fs.readFileSync('../SSL/baduk_ca.key'),
        cert: fs.readFileSync('../SSL/baduk_ca.crt'),
        ca: fs.readFileSync('../SSL/baduk_ca.ca-bundle'),
    };
    var server = https.createServer(options, app);
}

// Third-party libraries
var fs = require('fs');
var io;
if(config.HTTPS) {
    io = require('socket.io')(server);
} else {
    io = require('socket.io')(http);
}
var favicon = require('serve-favicon');
var Ddos = require('ddos');
var xss = require('node-xss').clean;
var git = require('git-rev');
var csurf = require('csurf');
var ddos = new Ddos;
var emoji = require('node-emoji');

// Logging
var winston = require('winston');
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
        level: 'info',
    }),
    new winston.transports.File({
        filename: '/var/log/baduk.log',
        level: 'verbose',
    })
  ]
});

// Baduk modules
var games = require('./src/modules/games.js');
var go = require('./src/modules/go.js');

// What to use, what not to use, that is the question
app.use(express.static('public'));
app.use('/bower_components', express.static('bower_components'));
app.use('/src', express.static('src'));
app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(ddos.express);
app.use(session);
app.disable('X-Powered-By');

// Enable reverse proxy support in Express. This causes the
// the "X-Forwarded-Proto" header field to be trusted so its
// value can be used to determine the protocol. See
// http://expressjs.com/api#app-settings for more details.
app.enable('trust proxy');

// Add a handler to inspect the req.secure flag (see
// http://expressjs.com/api#req.secure). This allows us
// to know whether the request was via http or https.
if(config.HTTPS) {
    app.use(function (req, res, next) {
        if (req.secure) {
            // Request was via https, so do no special handling
            next();
        } else {
            // Request was via http, so redirect to https
            res.redirect('https://' + req.headers.host + req.url);
        }
    });
}

// Global controller. Basically being used as middleware.
app.get('/*', function(req, res, next) {
    // General headers for security, ranging from clickjacking protection to
    // anti-crawler protection. Note that the XSS protection only applies to
    // IE8+ and Chrome, so still sanitize all input.
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('X-Robots-Tag', 'noindex');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('X-Content-Type-Options', 'nosniff');
    if(config.HTTPS) {
        res.header('Strict-Tranport-Security', 'max-age=31536000');
    }

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

io.use(sharedsession(session));
io.on('connection', function (socket) {
    // If they don't already have a session, get one started
    if(socket.handshake.session.id === undefined) {
        socket.handshake.session.id = socket.id;
        socket.handshake.session.save();
    }

    // Receives some information when a new user joins
    socket.on('post_new_connect', function (info) {

        logger.verbose('post_new_connect', info);

        games.add_user(info, socket);
        if(games.current_users[socket.handshake.session.id][info.room]['instances'] == 1) {
            io.to(info.room).emit('get_new_connect', {
                'username' : games.current_users[socket.handshake.session.id].username,
                'roommates' : games.players_in_room(info.room),
            });
        }
        socket.emit('your_name', {
            'username': games.current_users[socket.handshake.session.id].username,
            'roommates' : games.players_in_room(info.room),
        });
        var current_state = go.currentState(info.room);
        if(current_state !== undefined) {
            socket.emit('new_game_state', go.currentState(info.room));
        }
    });

    // Removes a user from the room
    socket.on('post_new_disconnect', function (info) {

        logger.verbose('post_new_disconnect', info);

        games.remove_user(info, socket);
        if(games.current_users[socket.handshake.session.id][info.room]['instances'] === 0) {
            io.to(info.room).emit('get_new_disconnect', {
                'username' : games.current_users[socket.handshake.session.id]['username'],
                'roommates' : games.players_in_room(info.room),
            });
        }
    });

    // Posts a new message to the room
    socket.on('post_new_message', function (info) {

        logger.verbose('post_new_message', info);

        io.to(info.room).emit('get_new_message', xss({
            'message' : emoji.emojify(info.message),
            'username' : games.current_users[socket.handshake.session.id]['username'],
            'color' : games.current_users[socket.handshake.session.id][info.room]['color'],
        }));
    });

    // Add a piece at the given position
    socket.on('post_new_piece', function (info) {

        logger.verbose('post_new_piece', info);

        var color = games.current_users[socket.handshake.session.id][info.room]['color'];
        var newState = go.applyMove(info.room, {
            'action': 'new_piece',
            'row': info.row,
            'col': info.col,
            'player_color': color
        });

        if (newState !== false) {
            io.to(info.room).emit('new_game_state', newState);
        } else {
            socket.emit('move_is_illegal', {}); // FIXME: this is a race condition
        }

    });

    socket.on('post_pass', function (info) {

        logger.verbose('post_pass', info);

        var color = games.current_users[socket.handshake.session.id][info.room]['color'];
        var newState = go.applyMove(info.room, {
            'action': 'pass',
            'player_color': color
        });

        if (newState !== false) {
            io.to(info.room).emit('new_game_state', newState);
        } else {
            socket.emit('move_is_illegal', {});
            logger.info('illegal move');
        }
    });

    socket.on('post_resign', function (info) {

        logger.verbose('post_resign', info);

        var color = games.current_users[socket.handshake.session.id][info.room]['color'];
        var newState = go.applyMove(info.room, {
            'action': 'resign',
            'player_color': color
        });

        io.to(info.room).emit('new_game_state', newState);
    });
});

// Figure out if we want HTTPS or not
if(config.HTTPS) {
    server.listen(config.HTTPS_port, function(){
        logger.info('Listening on *:' + config.HTTPS_port);
    });
}

// Listen on the normal server too
http.listen(config.HTTP_port, function () {
    logger.info('Listening on *:' + config.HTTP_port);
});
