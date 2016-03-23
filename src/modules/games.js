var sha1 = require('sha1');

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

exports.current_hash = current_hash;
exports.current_games = current_games;
exports.current_users = current_users;
