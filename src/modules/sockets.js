// NPM libraries
const xss = require('node-xss').clean;
const emoji = require('node-emoji');

// Baduk libraries
const games = require('./games.js');
const go = require('./go.js');

// Sets up a logger for all socket stuff
const winston = require('winston');
const logger = new (winston.Logger)({
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
    const user_id = socket.handshake.session.id;
    if(games.current_users[user_id][info.room]['instances'] == 1) {
        io.to(info.room).emit('get_new_connect', {
            'username' : games.current_users[user_id].username,
            'roommates' : games.players_in_room(info.room),
        });
    }
    socket.emit('your_name', {
        'username': games.current_users[user_id].username,
        'roommates' : games.players_in_room(info.room),
    });
    socket.emit('new_game_state', go.currentGameState(info.room));
    socket.emit('new_game_status', go.currentGameStatus(info.room));
}

// Reacts to new disconnections
var post_new_disconnect = function(socket, info, io) {
    logger.verbose('post_new_disconnect', info);
    const user_id = socket.handshake.session.id;
    if(games.user_exists(user_id)) {
        games.remove_user(info, socket);
        if(games.current_users[user_id][info.room]['instances'] === 0) {
            io.to(info.room).emit('get_new_disconnect', {
                'username' : games.current_users[user_id]['username'],
                'roommates' : games.players_in_room(info.room),
            });
        }
    }
}

// Sends a new message to the room
var post_new_message = function(socket, info, io) {
    logger.verbose('post_new_message', info);
    const user_id = socket.handshake.session.id;
    io.to(info.room).emit('get_new_message', xss({
        'message' : emoji.emojify(info.message),
        'username' : games.current_users[user_id]['username'],
        'color' : games.current_users[user_id][info.room]['color'],
    }));
}


var handleMove = function (socket, info, io, move, move_name) {
    logger.verbose(move_name, info);
    const user_id = socket.handshake.session.id;
    const color = games.current_users[user_id][info.room]['color'];
    const newState = go.applyMove(info.room, Object.assign(move, {
        'player_color': color,
    }));
    if (newState.gameStatus === 'illegal_move') {
        socket.emit('move_is_illegal', {});
    } else {
        io.to(info.room).emit('new_game_state', newState.gameState);
        io.to(info.room).emit('new_game_status', newState.gameStatus);
    }

}

// Adds a new piece to the board
var post_new_piece = function(socket, info, io) {
    handleMove(socket, info, io, {
        'action': 'new_piece',
        'row': info.row,
        'col': info.col,
    }, 'post_new_piece');
}

// Adds a new pass from the given user
var post_pass = function(socket, info, io) {
    handleMove(socket, info, io, {
        'action': 'pass',
    }, 'post_pass');
}

// Adds a new resign from the given user
var post_resign = function(socket, info, io) {
    handleMove(socket, info, io, {
        'action': 'resign',
    }, 'post_resign');
}

exports.post_new_connect = post_new_connect;
exports.post_new_disconnect = post_new_disconnect;
exports.post_new_message = post_new_message;
exports.post_new_piece = post_new_piece;
exports.post_pass = post_pass;
exports.post_resign = post_resign;
