/*
    Go game rules
*/

var current_games = {};

/* exported */
// update current_games[roomId] with action
// return false if it is an illegal move
var applyMove = function (roomId, action) {

    // If its the first move, initialize the game
    if (current_games[roomId] === undefined) {
        current_games[roomId] = initialGameState();
    }

    // If its not their turn, invalid move
    if (action.player_color !== current_games[roomId].turn) {
        console.log('illegal move: not your turn');
        return false;
    }

    var newState = makeMove(current_games[roomId], action.player_color, action.row, action.col);

    if (newState === false) return false;

    current_games[roomId] = newState;
    return newState;

}

// Return the current game state of the given room
var currentState = function(roomId) {
    return current_games[roomId];
}

var initialGameState = function () {
    return {
        'whiteStones': [],
        'blackStones': [],
        'turn': 'black',
        'size': 9
    };
};

var copy = function (obj) {
    return JSON.parse(JSON.stringify(obj));
}

var withStone = function (gameState, color, x, y) {
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

var isAnyNeighbourEmpty = function (gameState, x, y) {
    for (var dx=-1; dx <= 1; dx += 1) for (var dy=-1; dy <= 1; dy += 1) {

        if (dx === 0 && dy === 0) continue;
        if (dx * dy !== 0) continue;
        if (!isInBounds(gameState, x+dx, y+dy)) continue;

        if (colorOf(gameState, x+dx, y+dy) === 'empty') {
            return true;
        }
    }
    return false;
}

var isAnyNeighbourSameColorWithMoreThanOneLiberty = function (gameState, color, x, y) {
    for (var dx=-1; dx <= 1; dx += 1) for (var dy=-1; dy <= 1; dy += 1) {

        if (dx === 0 && dy === 0) continue;
        if (dx * dy !== 0) continue;
        if (!isInBounds(gameState, x+dx, y+dy)) continue;

        if (colorOf(gameState, x+dx, y+dy) === color && libertiesOf(gameState, x+dx, y+dy).length > 1) {
            return true;
        }
    }
    return false;
}

var isAnyNeighbourDiffColorWithOnlyOneLiberty = function (gameState, color, x, y) {
    for (var dx=-1; dx <= 1; dx += 1) for (var dy=-1; dy <= 1; dy += 1) {

        if (dx === 0 && dy === 0) continue;
        if (dx * dy !== 0) continue;
        if (!isInBounds(gameState, x+dx, y+dy)) continue;

        if (colorOf(gameState, x+dx, y+dy) === oppositeColor(color) && libertiesOf(gameState, x+dx, y+dy).length === 1) {
            return true;
        }
    }
    return false;
}

var oppositeColor = function (color) {
    if (color === 'white') return 'black';
    if (color === 'black') return 'white';
    throw new Exception('color');
}

// https://en.wikibooks.org/wiki/Computer_Go/Recognizing_Illegal_Moves

var isSuicide = function (gameState, color, x, y) {
    if (isAnyNeighbourEmpty(gameState, x, y) ||
        isAnyNeighbourSameColorWithMoreThanOneLiberty(gameState, color, x, y) ||
        isAnyNeighbourDiffColorWithOnlyOneLiberty(gameState, color, x, y)) {
        return false;
    }
    return true;
}

var makeMove = function (gameState, color, x, y) {
    if (['black', 'white'].indexOf(color) === -1) throw new Exception("color");

    if (colorOf(gameState, x, y) !== 'empty') {
        console.log('illegal move: not an empty intersection');
        return false;
    }

    if (isSuicide(gameState, color, x, y)) {
        return false;
    }

    var gs2 = copy(gameState);
    if (color === 'white') {
        gs2.whiteStones.push({'x': x, 'y': y});
    } else {
        gs2.blackStones.push({'x': x, 'y': y});
    }
    grp = groupOf(gs2, x, y);

    gameState = withStone(gameState, color, x, y);
    gameState = withoutDeadGroups(gameState);

    grp.forEach(function (stone) {
        if (color === 'white') {
            gameState.whiteStones.push(stone);
        } else {
            gameState.blackStones.push(stone);
        }
    });

    if (gameState.turn === 'white') {
        gameState.turn = 'black';
    } else {
        gameState.turn = 'white';
    }

    return gameState;
}

var withoutDeadGroups = function (gameState) {

    var blackStones = [];
    var whiteStones = [];

    gameState.blackStones.forEach(function (stone) {
        if (libertiesOf(gameState, stone.x, stone.y).length > 0) {
            blackStones.push(stone);
        }
    });
    gameState.whiteStones.forEach(function (stone) {
        if (libertiesOf(gameState, stone.x, stone.y).length > 0) {
            whiteStones.push(stone);
        }
    });

    return {
        'whiteStones': whiteStones,
        'blackStones': blackStones,
        'turn': gameState.turn,
        'size': gameState.size
    };

}

var isInBounds = function (gameState, x, y) {
    return 0 <= x && x < gameState.size && 0 <= y && y < gameState.size;
}

var colorOf = function (gameState, x, y) {
    for (var i=0; i<gameState.whiteStones.length; i++) {
        var s = gameState.whiteStones[i];
        if (s.x === x && s.y === y) return 'white';
    }
    for (var i=0; i<gameState.blackStones.length; i++) {
        var s = gameState.blackStones[i];
        if (s.x === x && s.y === y) return 'black';
    }
    return 'empty';
}

var reprStone = function (x, y) {
    return x + ' ' + y;
}

var groupOf = function (gameState, x, y, blacklist) {
    blacklist = blacklist || [];

    if (blacklist.indexOf(reprStone(x, y)) !== -1) return [];

    var color = colorOf(gameState, x, y);
    if (color === 'empty') return [];

    var ret = [{'x': x, 'y': y}];

    for (var dx=-1; dx <= 1; dx += 1) for (var dy=-1; dy <= 1; dy += 1) {

        if (dx === 0 && dy === 0) continue;
        if (dx * dy !== 0) continue;

        if (isInBounds(gameState, x+dx, y+dy)) {

            var otherColor = colorOf(gameState, x+dx, y+dy);

            if (otherColor === color) {
                ret.push({'x': x+dx, 'y': y+dy});
                ret = ret.concat(groupOf(gameState, x+dx, y+dy, blacklist.concat([reprStone(x, y)])));
            }

        }
    }
    return ret;

}

var libertiesOf = function (gameState, x, y, blacklist) {

    blacklist = blacklist || [];

    if (blacklist.indexOf(reprStone(x, y)) !== -1) return [];

    var color = colorOf(gameState, x, y);
    if (color === 'empty') return [];

    var ret = [];

    for (var dx=-1; dx <= 1; dx += 1) for (var dy=-1; dy <= 1; dy += 1) {

        if (dx === 0 && dy === 0) continue;
        if (dx * dy !== 0) continue;

        if (isInBounds(gameState, x+dx, y+dy)) {

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

// tests

var gs = {"whiteStones":[{"x":1,"y":0},{"x":0,"y":1}],"blackStones":[{"x": 0, "y": 0}, {"x":1,"y":1}],"turn":"black","size":9}

console.log(!isInBounds(gs, 0, -1));
console.log(libertiesOf(gs, 0, 0).length === 0);

var gsResolved = withoutDeadGroups(gs);

console.log(gsResolved.whiteStones.length === 2);
console.log(gsResolved.blackStones.length === 1);


var gs2 = { whiteStones: [ { x: 1, y: 1 }, { x: 2, y: 0 }, { x: 0, y: 0 } ],
  blackStones: [ { x: 0, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 0 } ],
  turn: 'white',
  size: 9,
  mostRecentMove: { row: 1, col: 0 } 
}

console.log(groupOf(gs2, 0, 0).length === 1);

// suicide-like capture

var gs3 = { whiteStones: [ { x: 1, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 0 }, { x: 2, y: 0 } ],
  blackStones: 
   [ { x: 1, y: 0 },
     { x: 1, y: 0 },
     { x: 0, y: 1 },
     { x: 0, y: 1 },
     { x: 2, y: 1 },
     { x: 2, y: 1 } ],
  turn: 'white',
  size: 9
}

console.log(isAnyNeighbourDiffColorWithOnlyOneLiberty(gs3, 'white', 0, 0));
console.log(isSuicide(gs3, 'white', 0, 0) === false);

// multi-group suicide

var gs4 = { whiteStones: 
   [ { x: 0, y: 2 },
     { x: 1, y: 1 },
     { x: 2, y: 0 }],
  blackStones: 
   [ { x: 0, y: 1 },
     { x: 1, y: 0 }],
  turn: 'black',
  size: 9 
}

console.log(isSuicide(gs4, 'black', 0, 0));

exports.applyMove = applyMove;
exports.currentState = currentState;
