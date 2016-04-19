var sha1 = require('sha1');
var moniker = require('moniker');
var schedule = require('node-schedule');

/*
    Javascript module for general games (NOT GO SPECIFIC!)
*/

var current_games = [];
var current_users = {};

var game_hash = function() {
    return function() {
        do {
            var new_hash = sha1(Math.random());
        } while(current_games.indexOf(new_hash) > -1);
        current_games.push(new_hash);
        return new_hash;
    }
};
var current_hash = game_hash();

var game_exists = function(hash) {
    return current_games.indexOf(hash) >= 0;
};

// Adds a user to the given room
var add_user = function(info, socket) {
    if(current_users[socket.handshake.session.id] === undefined) {
        current_users[socket.handshake.session.id] = {};
        current_users[socket.handshake.session.id]['username'] = moniker.choose();
    }
    if(current_users[socket.handshake.session.id][info.room] === undefined) {
        current_users[socket.handshake.session.id][info.room] = {};
        current_users[socket.handshake.session.id][info.room]['instances'] = 0;

        // Determine the color randomly
        var current_sockets = sockets_in_room(info.room);
        if(current_sockets.length == 0) {
            // If there are no players, randomly assign a color
            current_users[socket.handshake.session.id][info.room].color = (Math.random() < 0.5 ? 'white' : 'black');
        } else if(current_sockets.length == 1) {
            // If there is one player, get the opposite of his color
            var other_color = current_users[current_sockets[0]][info.room]['color'];
            current_users[socket.handshake.session.id][info.room]['color'] = (other_color === 'white' ? 'black' : 'white');
        } else {
            // If there is already two players in the room, no color
            current_users[socket.handshake.session.id][info.room]['color'] = 'Spectator';
        }
    }

    current_users[socket.handshake.session.id][info.room]['instances'] += 1;
    socket.emit('your_color', {
        color: current_users[socket.handshake.session.id][info.room].color,
    });

    socket.room = info.room;
    socket.join(info.room);
}

// Removes the user from a given room
var remove_user = function(info, socket) {
    socket.leave(info.room);
    current_users[socket.handshake.session.id][info.room]['instances'] -= 1;
}

// Gets all ids of players in the given room
var sockets_in_room = function(room) {
    return Object.keys(current_users).filter(function(id) {
        return current_users[id][room] !== undefined && current_users[id][room]['instances'] > 0;
    });
}

// Gets all usernames of players in the given room
var players_in_room = function(room) {
    return sockets_in_room(room).map(function(id) {
        return {'name' : current_users[id].username,
                'color' : current_users[id][room].color};
    });
}

// Cleanse all rooms that are empty every 12 hours
var cleanse = schedule.scheduleJob('0 0 12 * * *', function() {
    for (var room in current_games) {
        if(players_in_room(room).length == 0) {
            var index = current_games.indexOf(room);
            delete players_in_room[index];
        }
    }
});

exports.current_hash = current_hash;
exports.game_exists = game_exists;
exports.add_user = add_user;
exports.remove_user = remove_user;
exports.players_in_room = players_in_room;
exports.cleanse = cleanse;

exports.current_games = current_games;
exports.current_users = current_users;
