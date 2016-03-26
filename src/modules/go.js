/*
    Go game rules
*/

var current_games = {};

var valid_move = function(info, color) {
    // If its the first move, initialize the game
    if(current_games[info.room] === undefined) {
        current_games[info.room] = {};
        current_games[info.room]['turn'] = 'Black';
    }

    // If its not the player's turn, return false
    if(color !== current_games[info.room]['turn']) {
        return false;
    }

    // If the code reaches this point, the move is valid, so we proceed
    // Toggle the player's turn
    if(current_games[info.room]['turn'] == 'Black') {
        current_games[info.room]['turn'] = 'White';
    } else {
        current_games[info.room]['turn'] = 'Black';
    }
    return true;
}

exports.valid_move = valid_move;
