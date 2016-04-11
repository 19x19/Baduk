/*
    Go game rules
*/

var current_games = {};

// public API

var applyMove = function (roomId, action) {
    /* 
    update current_games[roomId] with action
    return false if it is an illegal move
    */

    // If its the first move, initialize the game
    if (current_games[roomId] === undefined) {
        current_games[roomId] = initialGameState();
    }

    // If its not their turn, invalid move
    if (action.player_color !== current_games[roomId].turn) {
        console.log('illegal move: not your turn');
        return false;
    }

    if (action['action'] === 'pass') {

        var newState = copy(current_games[roomId]);

        // TODO: enter scoring mode if 2 passes in a row

        if (newState.turn === 'white') {
            newState.turn = 'black';
        } else {
            newState.turn = 'white';
        }

        current_games[roomId] = newState;
        return newState;

    } else if (action['action'] === 'new_piece') {

        var newState = makeMove(current_games[roomId], action.player_color, action.row, action.col);

        if (newState === false) return false;

        current_games[roomId] = newState;
        return newState;
    }
}

var currentState = function(roomId) {
    // Return the current game state of the given room
    return current_games[roomId];
}

// utility 

var copy = function (obj) {
    return JSON.parse(JSON.stringify(obj));
}

// board representation

var oppositeColor = function (color) {
    if (color === 'white') return 'black';
    if (color === 'black') return 'white';
    throw new Exception('color');
}

var reprStone = function (x, y) {
    return x + ' ' + y;
}

var withStone = function (gameState, color, x, y) {
    gameState = copy(gameState);

    if (color === 'white') {
        gameState.stones[x][y] = 2;
    } else {
        gameState.stones[x][y] = 1;
    }

    return gameState;
}

var isInBounds = function (gameState, x, y) {
    return 0 <= x && x < gameState.size && 0 <= y && y < gameState.size;
}

var colorOf = function (gameState, x, y) {
    return ['empty', 'black', 'white'][gameState.stones[x][y]];
}

var initialGameState = function () {

    // 0 - empty
    // 1 - black
    // 2 - white

    var stones = [];
    for (var i=0; i<9; i++) {
        stones[i] = [];
        for (var j=0; j<9; j++) {
            stones[i][j] = 0;
        }
    }
    return {
        'stones': stones,
        'turn': 'black',
        'size': 9
    };
};

// suicide - https://en.wikibooks.org/wiki/Computer_Go/Recognizing_Illegal_Moves

var isSuicide = function (gameState, color, x, y) {
    if (isAnyNeighbourEmpty(gameState, x, y) ||
        isAnyNeighbourSameColorWithMoreThanOneLiberty(gameState, color, x, y) ||
        isAnyNeighbourDiffColorWithOnlyOneLiberty(gameState, color, x, y)) {
        return false;
    }
    return true;
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

// go-specific logic

var makeMove = function (gameState, color, x, y) {
    if (['black', 'white'].indexOf(color) === -1) throw new Exception("color");

    if (colorOf(gameState, x, y) !== 'empty') {
        console.log('illegal move: not an empty intersection');
        return false;
    }

    if (isSuicide(gameState, color, x, y)) {
        console.log('illegal move: suicide');
        return false;
    }

    var gs2 = copy(gameState);
    gs2.stones[x][y] = { 'black': 1, 'white': 2 }[color];

    groupOfPlayedStone = groupOf(gs2, x, y);
    
    gameState = withStone(gameState, color, x, y);
    gameState = withoutDeadGroups(gameState);


    groupOfPlayedStone.forEach(function (stone) {
        gameState.stones[stone.x][stone.y] = { 'black': 1, 'white': 2 }[color];
    });

    if (gameState.turn === 'white') {
        gameState.turn = 'black';
    } else {
        gameState.turn = 'white';
    }

    return gameState;
}

var withoutDeadGroups = function (gameState) {

    var newState = copy(gameState);

    for (var i=0; i<gameState.size; i++) for (var j=0; j<gameState.size; j++) {
        if (colorOf(gameState, i, j) === 'empty') continue;
        if (libertiesOf(gameState, i, j).length === 0) newState.stones[i][j] = 0;
    }

    return newState;

}

var groupOf = function (gameState, x, y, blacklist) { // todo: duplicates?
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
                if (ret.map(function (s) { return reprStone(s.x, s.y)}).indexOf(reprStone(x+dx, y+dy)) === -1) {
                    ret.push({'x': x+dx, 'y': y+dy});
                }
                var retConcat = groupOf(gameState, x+dx, y+dy, blacklist.concat([reprStone(x, y)]));
                retConcat.forEach(function (sc) {
                    if (ret.map(function (s) { return reprStone(s.x, s.y)}).indexOf(reprStone(sc.x, sc.y)) === -1) {
                        ret.push({'x': sc.x, 'y': sc.y});
                    }
                });
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
                if (ret.map(function (s) { return reprStone(s.x, s.y)}).indexOf(reprStone(x+dx, y+dy)) === -1) {
                    ret.push({'x': x+dx, 'y': y+dy});
                }
            } else if (otherColor === color) {
                
                var retConcat = libertiesOf(gameState, x+dx, y+dy, blacklist.concat([reprStone(x, y)]));
                
                retConcat.forEach(function (sc) {
                    if (ret.map(function (s) { return reprStone(s.x, s.y)}).indexOf(reprStone(sc.x, sc.y)) === -1) {
                        ret.push({'x': sc.x, 'y': sc.y});
                    }
                });
                
            }

        }
    }

    return ret;

}

exports.applyMove = applyMove;
exports.currentState = currentState;

// tests

var gs1 = {
    stones: [
        [1, 2, 0, 0, 0, 0, 0, 0, 0],
        [2, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    turn: "black",
    "size":9
};

console.log(!isInBounds(gs1, 0, -1));
console.log(libertiesOf(gs1, 0, 0).length === 0);

var gsResolved = withoutDeadGroups(gs1);

console.log(colorOf(gsResolved, 0, 0) === 'empty');

var gs2 = {
    stones: [
        [2, 1, 2, 0, 0, 0, 0, 0, 0],
        [1, 2, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    turn: "black",
    size: 9
};

console.log(groupOf(gs2, 0, 0).length === 1);

// suicide-like capture

var gs3 = {
    stones: [
        [0, 1, 2, 0, 0, 0, 0, 0, 0],
        [1, 2, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    turn: "black",
    size: 9
};

console.log(isAnyNeighbourDiffColorWithOnlyOneLiberty(gs3, 'white', 0, 0));
console.log(isSuicide(gs3, 'white', 0, 0) === false);

// multi-group suicide

var gs4 = {
    stones: [
        [0, 1, 2, 0, 0, 0, 0, 0, 0],
        [1, 2, 0, 0, 0, 0, 0, 0, 0],
        [2, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    turn: "black",
    size: 9
};

console.log(isSuicide(gs4, 'black', 0, 0));

// regression

var gs5 = { whiteStones: 
   [ { x: 6, y: 7 },
     { x: 6, y: 8 },
     { x: 7, y: 6 },
     { x: 6, y: 6 },
     { x: 8, y: 6 } ],
  blackStones: 
   [ { x: 7, y: 7 },
     { x: 7, y: 8 },
     { x: 8, y: 7 },
     { x: 5, y: 5 },
     { x: 6, y: 5 },
     { x: 5, y: 6 } ],
  turn: 'white',
  size: 9,
};


var gs5 = {
    stones: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 2, 2, 2],
        [0, 0, 0, 0, 0, 0, 2, 1, 1],
        [0, 0, 0, 0, 0, 0, 2, 1, 0],
    ],
    turn: "black",
    size: 9
};

console.log(!isSuicide(gs5, 'white', 8, 8));
console.log(isAnyNeighbourDiffColorWithOnlyOneLiberty(gs5, 'white', 8, 8));
console.log(libertiesOf(gs5, 7, 8).length === 1);

// https://github.com/19x19/Baduk/issues/35

var gs6 = {
    stones: [
        [1, 0, 1, 0, 0, 0, 0, 0, 0],
        [2, 2, 1, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    turn: "white",
    size: 9
};

var gs7 = makeMove(gs6, 'white', 0, 1);

console.log(gs7.stones[0][0] === 0);
console.log(gs7.stones[1][0] === 2);
console.log(gs7.stones[2][0] === 1);

console.log(isSuicide(gs7, 'black', 0, 0) === false);
console.log(isSuicide(gs7, 'white', 0, 0) === true);

console.log(isAnyNeighbourDiffColorWithOnlyOneLiberty(gs7, 'black', 0, 0));

var gs8 = makeMove(gs7, 'black', 0, 0);

console.log(gs8.stones[0][0] === 1);
console.log(gs8.stones[1][0] === 0);
console.log(gs8.stones[2][0] === 1);
