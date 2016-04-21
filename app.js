// Node.js and ExpressDB related
const config = require('./config.js');
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const session = require("express-session")({
    secret: config.session_key,
    resave: true,
    saveUninitialized: true
});
const sharedsession = require("express-socket.io-session");

// Setting up HTTPS variables
const http = require('http').Server(app);
const https = require('https');
const fs = require('fs');
if(config.HTTPS) {
    const options = {
        key: fs.readFileSync('../SSL/baduk_ca.key'),
        cert: fs.readFileSync('../SSL/baduk_ca.crt'),
        ca: fs.readFileSync('../SSL/baduk_ca.ca-bundle'),
    };
    const server = https.createServer(options, app);
}

// Third-party NPM libraries
const io = (config.HTTPS) ? require('socket.io')(server) :require('socket.io')(http);
const favicon = require('serve-favicon');
const Ddos = require('ddos');
const git = require('git-rev');
const csurf = require('csurf');
const ddos = new Ddos;

// Baduk modules
const games = require('./src/modules/games.js');
const sockets = require('./src/modules/sockets.js');

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
    // Redirect www. -> non www.
    if (req.headers.host.match(/^www/) !== null) {
        res.redirect(req.headers.host.replace(/^www\./, '') + req.url);
    }

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

// 404 page will just redirect to homepage
app.get('*', function (req, res) {
    res.redirect('/');
});

io.use(sharedsession(session));
io.on('connection', function (socket) {
    // If they don't already have a session, get one started
    if(socket.handshake.session.id === undefined) {
        socket.handshake.session.id = socket.id;
        socket.handshake.session.save();
    }

    socket.on('post_new_connect', function (info) {
        sockets.post_new_connect(socket, info, io);
    });

    socket.on('post_new_disconnect', function (info) {
        sockets.post_new_disconnect(socket, info, io);
    });

    socket.on('post_new_message', function (info) {
        sockets.post_new_message(socket, info, io);
    });

    socket.on('post_new_piece', function (info) {
        sockets.post_new_piece(socket, info, io);
    });

    socket.on('post_pass', function (info) {
        sockets.post_pass(socket, info, io);
    });

    socket.on('post_resign', function (info) {
        sockets.post_resign(socket, info, io);
    });
});

// Figure out if we want HTTPS or not
if(config.HTTPS) {
    server.listen(config.HTTPS_port);
}

// Listen on the normal server too
http.listen(config.HTTP_port);
