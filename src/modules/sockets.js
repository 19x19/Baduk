var games = require('./games.js');
var go = require('./go.js');

// Sets up a logger for all socket stuff
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

// Reacts to a new connection
var post_new_connect = function(socket, info, io) {
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
}

// Reacts to new disconnections
var post_new_disconnect = function(socket, info, io) {
    logger.verbose('post_new_disconnect', info);
    if(games.user_exists(socket.handshake.session.id)) {
        games.remove_user(info, socket);
        if(games.current_users[socket.handshake.session.id][info.room]['instances'] === 0) {
            io.to(info.room).emit('get_new_disconnect', {
                'username' : games.current_users[socket.handshake.session.id]['username'],
                'roommates' : games.players_in_room(info.room),
            });
        }
    }
}

exports.post_new_connect = post_new_connect;
exports.post_new_disconnect = post_new_disconnect;
