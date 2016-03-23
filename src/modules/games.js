var sha1 = require('sha1');
var moniker = require('moniker');

/*
    Javascript module for general games (NOT GO SPECIFIC!)
*/

var current_games = [];
var current_users = {};

var game_hash = function() {
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

var add_user = function(info, socket) {
    current_users[socket.id] = {};                                       
    current_users[socket.id]['username'] = moniker.choose();             
    socket.room = info.room;                                                   
    socket.join(info.room);                                                    
}

exports.current_hash = current_hash;
exports.game_exists = game_exists;
exports.add_user = add_user;

exports.current_games = current_games;
exports.current_users = current_users;
