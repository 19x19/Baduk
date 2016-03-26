/*
    Go game rules
*/

var current_games = {};

// update current_games[roomId] with action
// return undefined if it is an illegal move
var applyMove = function (roomId, action) {

    // If its the first move, initialize the game
    if (current_games[roomId] === undefined) {
        current_games[roomId] = initialGameState();
    }

    if (action.player_color !== current_games[roomId].turn) {
        return false;
    }

    if (current_games[roomId]['turn'] == 'black') {
        current_games[roomId]['turn'] = 'white';
    } else {
        current_games[roomId]['turn'] = 'black';
    }

    current_games[roomId] = makeMove(current_games[roomId], action.player_color, action.row, action.col);

    return current_games[roomId];

}

var initialGameState = function () {
    return {
        'whiteStones': [],
        'blackStones': [],
        'turn': 'black'
    };
};

var copy = function (obj) {
    return JSON.parse(JSON.stringify(obj));
}

var makeMove = function (gameState, color, x, y) {
    if (['black', 'white'].indexOf(color) === -1) throw new Exception("color");
    gameState = copy(gameState);
    if (color === 'white') {
        gameState.whiteStones.push({
            'x': x,
            'y': y
        });
    } else {
        gameState.blackStones.push({
            'x': x,
            'y': y
        });
    }
    return gameState;
}

var isInBounds = function (x, y) {
    return 0 <= x && x < 19;
    return 0 <= y && y < 19;
}

var colorOf = function (gameState, x, y) {
    for (var i=0; i<gameState.whiteStones.length; i++) {
        var s = gameState.whiteStones[i];
        if (s.x === x && s.y === y) return 'white';
    }
    for (var i=0; i<gameState.whiteStones.length; i++) {
        var s = gameState.whiteStones[i];
        if (s.x === x && s.y === y) return 'black';
    }
    return 'empty';
}

var reprStone = function (x, y) {
    return x + ' ' + y;
}

var libertiesOf = function (gameState, x, y, blacklist) {

    blacklist = blacklist || [];

    if (blacklist.indexOf(reprStone(x, y)) !== -1) return [];

    var color = colorOf(gameState, x, y);
    if (color === 'empty') throw new 'libertiesOf called on empty square'

    var visitedStones = [];

    var isVisited = function (x, y) {
        return visitedStones.indexOf(x + ' ' + y) !== -1;
    }

    var ret = [];

    for (var dx=-1; dx <= 1; dx += 1) for (var dy=-1; dy <= 1; dy += 1) {

        if (dx === 0 && dy === 0) continue;
        if (dx * dy !== 0) continue;

        if (isInBounds(x+dx, y+dy)) {

            var otherColor = colorOf(gameState, x+dx, y+dy);

            if (otherColor === 'empty') {
                ret.push({'x': x+dx, 'y': y+dy});
            } else if (otherColor === color) {
                ret = ret.concat(libertiesOf(gameState, x+dx, y+dy, blacklist.concat([reprStone(x, y)])));
            }

        }
    }

    return ret;

}

exports.applyMove = applyMove;
