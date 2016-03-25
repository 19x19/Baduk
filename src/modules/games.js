var sha1 = require('sha1');
var moniker = require('moniker');

/*
    Javascript module for general games (NOT GO SPECIFIC!)
*/

var current_games = [];
var current_users = {};

var game_hash = function() {
    // TODO Generate the count more randomly
    var count = 0;
    return function() {
        count++;
        var new_hash = sha1(count);
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
    current_users[socket.id] = {};                                       
    current_users[socket.id]['username'] = moniker.choose();             
    current_users[socket.id]['room'] = info.room;
    socket.room = info.room;                                                   
    socket.join(info.room);                                                    
}

// Removes the user from a given room
var remove_user = function(info, socket) {
    socket.leave(info.room);
    delete current_users[socket.id];
}

// Gets all socket ids of players in the given room
var players_in_room = function(room) {
    players = []
    for (var id in current_users) {
        if(current_users[id]['room'] == room) {
            players.push(current_users[id]['username']);
        }
    }
    return players;
}

exports.current_hash = current_hash;
exports.game_exists = game_exists;
exports.add_user = add_user;
exports.remove_user = remove_user;
exports.players_in_room = players_in_room;

exports.current_games = current_games;
exports.current_users = current_users;
