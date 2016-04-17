/*
    Go game rules
*/

(function () {

var current_games = {};

// public API

var applyMove = function (roomId, action) {
    /*
    update current_games[roomId] with action
    return false and do nothing else if it is an illegal move
    */

    if (current_games[roomId] === undefined) {
        current_games[roomId] = initialGameState();
    }

    var newState = withMove(current_games[roomId], action);
    if (newState === false) return false;

    newState.moves.push(action);

    current_games[roomId] = newState;
    return newState;
}

var currentState = function(roomId) {
    // Return the current game state of the given room
    return current_games[roomId];
}

// turn-taking logic

var withMove = function (gameState, action) {

    if (gameState.result) {
        console.log('illegal move: game is over');
        return false;
    }

    if (action['action'] === 'resign') {
        var newState = copy(gameState);
        newState.result = {
            'winner': oppositeColor(action.player_color),
            'advantage': 'resign',
        };
        return newState;
    }

    if (action.player_color !== gameState.turn) {
        console.log('illegal move: not your turn');
        return false;
    }

    if (action['action'] === 'pass') {

        var newState = copy(gameState);

        // TODO: enter scoring mode if 2 passes in a row

        if (newState.turn === 'white') {
            newState.turn = 'black';
        } else {
            newState.turn = 'white';
        }

        return newState;

    }

    if (action['action'] === 'new_piece') {
        var newState = withNewPiece(copy(gameState), action.player_color, action.row, action.col);
        if (newState === false) return false;
        return newState;
    }

}

// utility 

var copy = function (obj) {
    return JSON.parse(JSON.stringify(obj));
}

// board representation

var oppositeColor = function (color) {
    if (color === 'white') return 'black';
    if (color === 'black') return 'white';
    throw 'oppositeColor received argument ' + color;
}

var prettyReprOfStones = function (stones) {
    return stones.map(function (row) {
        return row.map(function (stone) {
            return '_bw'[stone];
        }).join('');
    }).join('\n');
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
        'size': 9,
        'moves': [],
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

// ko

var boardStateHistoryOf = function (gameState) {
    var bs = initialGameState();
    var ret = [bs];
    gameState.moves.forEach(function (move) {
        bs = withMove(bs, move);
        ret.push(bs);
    });
    return ret;
}


// exported to browser

var isLegalMove = function (gameState, color, x, y) {
    return gameState && withMove(gameState, {
        player_color: color,
        action: 'new_piece',
        row: x,
        col: y
    }) !== false;
}

// go-specific logic

var withNewPiece = function (gameState, color, x, y) {
    if (['black', 'white'].indexOf(color) === -1) throw new Exception("color");

    var oldGameState = copy(gameState);

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
    
    gameState = withStone(gameState, color, x, y); // place move
    gameState = withoutDeadGroups(gameState);      // remove all dead stones

    groupOfPlayedStone.forEach(function (stone) {  // put back group of played stone
        gameState.stones[stone.x][stone.y] = { 'black': 1, 'white': 2 }[color];
    });

    var repeatedOldPosition = false;
    boardStateHistoryOf(oldGameState).forEach(function (boardState) {
        var stones = boardState.stones;

        if (prettyReprOfStones(stones) === prettyReprOfStones(gameState.stones)) {
            repeatedOldPosition = true;
        }
    });

    if (repeatedOldPosition) {
        console.log('illegal: positional superko');
        return false;
    }

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

if (typeof(exports) !== 'undefined') {
    exports.applyMove = applyMove;
    exports.currentState = currentState;

    // exported for testing

    exports.isInBounds = isInBounds;
    exports.libertiesOf = libertiesOf;
    exports.withoutDeadGroups = withoutDeadGroups;
    exports.colorOf = colorOf;
    exports.groupOf = groupOf;
    exports.isAnyNeighbourDiffColorWithOnlyOneLiberty = isAnyNeighbourDiffColorWithOnlyOneLiberty;
    exports.isSuicide = isSuicide;
    exports.withNewPiece = withNewPiece;
    exports.boardStateHistoryOf = boardStateHistoryOf;
    exports.prettyReprOfStones = prettyReprOfStones;
}

if (typeof(window) !== 'undefined') {
    window.isLegalMove = isLegalMove;
}

})();
