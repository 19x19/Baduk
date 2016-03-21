var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Global controller. Currently used to add HTTP headers to all responses.
app.get('/*', function(req, res, next) {
    // HTTP headers to protect against general clickjacking
    res.header('X-Frame-Options', 'DENY');
    res.header('Content-Security-Policy', 'frame-ancestors: \'none\'');
    // No crawlers on this website, thanks
    res.header('X-Robots-Tag', 'noindex');
    next();
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected');
  socket.on('chat message', function (msg) {
    console.log('message: ' + msg);
  });
});

http.listen(3000, function () {
  console.log('listening on *:3000');
});
