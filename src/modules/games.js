var sha1 = require('sha1');

// Generates a hash for a new game, and increments the
// internal count to prepare for the next call
var game_hash = function() {
    var count = 0;
    return function() {
        count++;
        return sha1(count);
    }
};

exports.current_hash = game_hash();
exports.current_games = [];
exports.current_users = {};
