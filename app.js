var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = 3002;

var io = require('socket.io')(http);
var favicon = require('serve-favicon');

app.use(express.static('public'));
app.use('/bower_components', express.static('bower_components'));
app.use(express.static('source/views'));
app.use(favicon(__dirname + '/public/img/favicon.ico'));

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
    var count = 100000000000;
    var hash_length = 36;
    return function() {
        count++;
        // TODO Global variables are bad, right?
        return ((count).toString(hash_length));
    }
}
var current_hash = game_hash();

app.get('/go', function (req, res) {
    res.redirect('/go/' + current_hash());
});

app.get('/go/:id', function(req, res) {
    res.sendFile(__dirname + '/src/views/go.html');
});

io.on('connection', function (socket) {
    socket.on('postNewMessage', function (message) {
        io.emit('getNewMessage', message);
    });
});

http.listen(port, function () {
    console.log('listening on *:' + port);
});

