/*
    Javascript module for games.
*/
var moniker = require('moniker');
var schedule = require('node-schedule');
var cryptohat = require('cryptohat');

var go = require('../modules/go.js');

var current_games = {};
var current_users = {};

var registerGameRoom = function (options) {
    var hash = current_hash();
    go.registerGameRoom(hash, options);
    return hash;
}

// Generates the hash of the next game. Should probably increase the entropy
// here at some point as it's limited by Math.random().
var game_hash = function() {
    return function() {
        do {
            var new_hash = cryptohat();
        } while(game_exists(new_hash));
        current_games[new_hash] = {};
        current_games[new_hash]['conversation'] = [];
        return new_hash;
    }
};
var current_hash = game_hash();

// Returns true if the given hash is a current game
var game_exists = function(hash) {
    return current_games[hash] !== undefined;
};

// Returns true if the given user exists
var user_exists = function(id) {
    return current_users[id] !== undefined;
};

// Adds a user to the given room
var add_user = function(info, socket) {
    // If the user has no current session with sockets, create a new user
    if (!user_exists(socket.handshake.session.id)) {
        current_users[socket.handshake.session.id] = {};
        current_users[socket.handshake.session.id]['username'] = moniker.choose();
    }

    // If the user hasn't been to this room, increment his instances
    if (current_users[socket.handshake.session.id][info.room] === undefined) {
        current_users[socket.handshake.session.id][info.room] = {};
        current_users[socket.handshake.session.id][info.room]['instances'] = 0;

        // Assign the color of the player in this room
        var current_sockets = sockets_in_room(info.room);
        if (current_sockets.length == 0) {
            // If there are no players, randomly assign a color
            current_users[socket.handshake.session.id][info.room].color = (Math.random() < 0.5 ? 'white' : 'black');
        } else if (current_sockets.length == 1) {
            // If there is one player, get the opposite of his color
            var other_color = current_users[current_sockets[0]][info.room]['color'];
            current_users[socket.handshake.session.id][info.room]['color'] = (other_color === 'white' ? 'black' : 'white');
        } else {
            // If there are already two players in the room, no color
            current_users[socket.handshake.session.id][info.room]['color'] = 'Spectator';
        }
    }

    // Increment the number of instances in this room for this user
    current_users[socket.handshake.session.id][info.room]['instances'] += 1;

    // Tell the user their color
    socket.emit('your_color', {
        color: current_users[socket.handshake.session.id][info.room].color,
    });

    // Add the user to the given Socket.IO room
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

// Cleanse all rooms that are empty every 12 hours. Also cleanse the users who
// have zero instances.
var cleanse = schedule.scheduleJob('0 0 12 * * *', function() {
    // Cleanse the rooms
    for (var room in current_games) {
        if(players_in_room(room).length == 0) {
            delete current_games[room];
        }
    }

    // Cleanse the users
    for(var id in current_users) {
        var in_game = false;
        for(var room in current_users[i]) {
            if(current_users[id][room]['instances'] > 0) {
                in_game = true;
            }
        }
        if(!in_game) {
            delete current_users[id];
        }
    }
});

exports.current_hash = current_hash;
exports.game_exists = game_exists;
exports.user_exists = user_exists;
exports.add_user = add_user;
exports.remove_user = remove_user;
exports.players_in_room = players_in_room;
exports.cleanse = cleanse;
exports.registerGameRoom = registerGameRoom;
exports.sockets_in_room = sockets_in_room;

exports.current_games = current_games;
exports.current_users = current_users;
