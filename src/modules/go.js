/*
    Go game rules, and a bit of turn-taking logic

    statesOfRoom maps roomId to
        - gameState,
        - takebackState,
        - deadGroupResolutionState,
        - gameResult,
        - gameStatus
*/

(function () {

var statesOfRoom = {};

// public API

var getLobby = function () {
    return statesOfRoom;
}

var registerGameRoom = function (roomId, options) {
    statesOfRoom[roomId] = {};
    statesOfRoom[roomId].gameState = initialGameState(options);
    statesOfRoom[roomId].gameStatus = 'playing';
}

var applyMove = function (roomId, action) {
    /*
    update statesOfRoom[roomId] with action
    return if move was legal
    */

    const VALID_GAME_STATUSES = [
        'game_over',
        'illegal_move',
        'resolving_dead_groups',
        'playing',
    ];

    if (currentGameStatus(roomId) === 'game_over') {
        if (isNodejs()) console.log('illegal move: game is over');
        return false;
    }

    if (action['action'] === 'retract_pass') {
        if (currentGameStatus(roomId) === 'resolving_dead_groups') {

            var player_color = action.player_color;

            console.log(player_color, 'retracts pass');
            console.log(statesOfRoom[roomId].gameState);

            var gameState = statesOfRoom[roomId].gameState;
            var lastMove = gameState.moves.slice(-1)[0]

            console.log(lastMove);

            assert(lastMove.action === 'pass');

            var numMovesToRevert = 0;
            if (lastMove.player_color === player_color) {
                numMovesToRevert = 1;
                console.log('revert 1 move');
            } else {
                numMovesToRevert = 2;
                console.log('revert 2 moves');
            }

            statesOfRoom[roomId].gameState.moves = statesOfRoom[roomId].gameState.moves.slice(0, -numMovesToRevert);
            statesOfRoom[roomId].gameStatus = 'playing';
            statesOfRoom[roomId].gameState.turn = player_color;

            return true;
        } else {
            if (isNodejs()) console.log('illegal move: cannot retract_pass unless status is resolving_dead_groups');
            return false;
        }
    }

    if (action['action'] === 'commit_endgame_resolution') {
        if (currentGameStatus(roomId) === 'resolving_dead_groups') {
            statesOfRoom[roomId].deadGroupResolutionState[action.player_color + '_committed'] = true;

            if (statesOfRoom[roomId].deadGroupResolutionState['white_committed'] &&
                statesOfRoom[roomId].deadGroupResolutionState['black_committed']) {
                statesOfRoom[roomId].gameStatus = 'game_over';

                var size = statesOfRoom[roomId].gameState.size;

                var score = scoreOfBoard(size, statesOfRoom[roomId].deadGroupResolutionState.stones);

                if (score > 0) {
                    statesOfRoom[roomId].gameState.result = {
                        'winner': 'black',
                        'advantage': score,
                    }
                } else {
                    statesOfRoom[roomId].gameState.result = {
                        'winner': 'white',
                        'advantage': -score,
                    }
                }
            }

            return true;
        } else {
            if (isNodejs()) console.log('illegal move: cannot commit_endgame_resolution unless status is resolving_dead_groups');
            return false;
        }
    }

    if (action['action'] === 'mark_group_as_dead' || action['action'] === 'mark_group_as_alive') {
        if (currentGameStatus(roomId) === 'resolving_dead_groups') {

            var stones = statesOfRoom[roomId].deadGroupResolutionState.stones;
            var colorOfMarkedStone = stones[action.row][action.col];
            var groupOfMarkedStone = groupOf_stones(stones, action.row, action.col);

            if (action['action'] === 'mark_group_as_dead') {
                var colorOfDeadMarkedStone = colorOfMarkedStone + 2;
                console.log(colorOfMarkedStone, colorOfDeadMarkedStone);

                groupOfMarkedStone.forEach(function (stone) {
                    statesOfRoom[roomId].deadGroupResolutionState.stones[stone.x][stone.y] = colorOfDeadMarkedStone;
                });

                console.log(groupOfMarkedStone);
            } else if (action['action'] === 'mark_group_as_alive') {
                var colorOfAliveMarkedStone = colorOfMarkedStone - 2;
                console.log(colorOfMarkedStone, colorOfAliveMarkedStone);

                groupOfMarkedStone.forEach(function (stone) {
                    statesOfRoom[roomId].deadGroupResolutionState.stones[stone.x][stone.y] = colorOfAliveMarkedStone;
                });
            }


            return true;
        } else {
            if (isNodejs()) console.log('illegal move');
            return false;
        }
    }

    // it's probably a post_new_piece. todo: verify that

    var newState = withMove(currentGameState(roomId), action);

    if (newState.gameStatus === undefined) {
        console.log('undefined gameStatus on gameState ', newState);
        return;
    }

    if (VALID_GAME_STATUSES.indexOf(newState.gameStatus) === -1) {
        console.log('unrecognized gameStatus', newState.gameStatus);
        return;
    }

    if (newState.gameStatus === 'illegal_move') {
        return false;
    }

    var newGameState = newState.gameState;
    newGameState.moves.push(action);
    statesOfRoom[roomId].gameState = newGameState;
    statesOfRoom[roomId].gameStatus = newState.gameStatus;

    if (newState.gameStatus === 'resolving_dead_groups') {
        statesOfRoom[roomId].deadGroupResolutionState = {
            'stones': newState.deadGroupResolutionState,
            'white_committed': false,
            'black_committed': false,
        };
    }

    return true;
}

var getStatesOfRoom = function (roomId) {
    if (statesOfRoom[roomId] === undefined) {
        statesOfRoom[roomId] = {};
    }
    return statesOfRoom[roomId];
}

var currentGameState = function (roomId) {
    if (getStatesOfRoom(roomId).gameState === undefined) {
        statesOfRoom[roomId].gameState = initialGameState();
    }

    return getStatesOfRoom(roomId).gameState;
}

var currentDeadGroupResolutionState = function (roomId) {
    if (getStatesOfRoom(roomId).gameState === undefined) {
        statesOfRoom[roomId].gameState = initialGameState();
    }

    return getStatesOfRoom(roomId).deadGroupResolutionState;
}

var currentGameStatus = function (roomId) {
    if (getStatesOfRoom(roomId).gameState === undefined) {
        statesOfRoom[roomId].gameState = 'playing';
    }

    return getStatesOfRoom(roomId).gameStatus;
}

// turn-taking logic - resign, pass, and new piece (delegated to other function)
// returns a subset of { gameStatus, gameState, deadGroupResolutionState }

var withMove = function (gameState, action) {

    if (gameState.result) {
        if (isNodejs()) console.log('illegal move: game is over');
        return {
            gameStatus: 'illegal_move',
        };
    }

    if (action['action'] === 'resign') {
        var newGameState = copy(gameState);
        newGameState.result = {
            'winner': oppositeColor(action.player_color),
            'advantage': 'resign',
        };
        return {
            gameStatus: 'game_over',
            gameState: newGameState,
        };
    }

    if (action.player_color !== gameState.turn) {
        if (isNodejs()) console.log('illegal move: not your turn');
        return {
            gameStatus: 'illegal_move',
        };
    }

    if (action['action'] === 'pass') {

        var newGameState = copy(gameState);

        if (newGameState.turn === 'white') {
            newGameState.turn = 'black';
        } else {
            newGameState.turn = 'white';
        }

        if (gameState.moves.length > 0 && gameState.moves.slice(-1)[0].action === 'pass') {
            return {
                gameStatus: 'resolving_dead_groups',
                gameState: newGameState,
                deadGroupResolutionState: copy(gameState.stones),
            }
        }

        return {
            gameStatus: 'playing',
            gameState: newGameState,
        };

    }

    if (action['action'] === 'new_piece') {

        var newGameState = withNewPiece(copy(gameState), action.player_color, action.row, action.col);
        if (newGameState === false) {
            return {
                gameStatus: 'illegal_move',
            };
        }
        return {
            gameStatus: 'playing',
            gameState: newGameState,
        };
    }

}

// utility

var copy = function (obj) {
    return JSON.parse(JSON.stringify(obj));
}

var isNodejs = function () {
    return typeof(exports) !== 'undefined';
}

var isBrowser = function () {
    return typeof(window) !== 'undefined';
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

var initialGameState = function (options) {

    options = options || {};

    // 0 - empty
    // 1 - black
    // 2 - white
    // 3 - black ghost
    // 4 - white ghost

    var board_size = parseInt(options.board_size, 10) || 9;

    var stones = [];
    for (var i=0; i<board_size; i++) {
        stones[i] = [];
        for (var j=0; j<board_size; j++) {
            stones[i][j] = 0;
        }
    }
    return {
        'stones': stones,
        'turn': 'black',
        'size': board_size,
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
    var bs = initialGameState({
        board_size: gameState.size,
    });
    var ret = [bs];
    gameState.moves.forEach(function (move) {
        bs = withMove(bs, move).gameState;
        ret.push(bs);
    });
    return ret;
}


// exported to browser

var isLegalMove = function (gameState, color, x, y) {
    if (!gameState) return false;
    var newState = withMove(gameState, {
        player_color: color,
        action: 'new_piece',
        row: x,
        col: y,
    });
    if (newState.gameStatus === 'illegal_move') return false;
    return true;
}

// go-specific logic

var withExpandedBorder = function (boardSize, stones) {

    // gets rid of some 0s

    var ret = [];
    for (var i = 0; i < boardSize; i++) ret.push([]);

    for (var x=0; x<boardSize; x++) for (var y=0; y<boardSize; y++) {
        if (stones[x][y] === 0) {

            var influence = 0;
            var influenced = false;

            for (var dx=-1; dx <= 1; dx += 1) for (var dy=-1; dy <= 1; dy += 1) {
                if (dx === 0 && dy === 0) continue;
                if (dx * dy !== 0) continue;
                if (!(0 <= x+dx && x+dx < boardSize)) continue;
                if (!(0 <= y+dy && y+dy < boardSize)) continue;

                if (stones[x+dx][y+dy] === 1) {
                    influence += 1;
                    influenced = true;
                }
                if (stones[x+dx][y+dy] === 2) {
                    influence -= 1;
                    influenced = true;
                }
            }
            if (!influenced) ret[x][y] = 0;
            if (influence > 0) ret[x][y] = 1;
            if (influenced && influence === 0) ret[x][y] = 5;
            if (influence < 0) ret[x][y] = 2;

        } else {
            ret[x][y] = stones[x][y];
        }
    }
    return ret;

}

var estimatedSquareOwnershipOfBoard = function (boardSize, stones) {

    /*
    returns an array of
    1 - black territory
    2 - white territory
    5 - wall
    */

    var liveStones = copy(stones);

    for (var i=0; i<boardSize; i++) for (var j=0; j<boardSize; j++) {
        if (liveStones[i][j] === 3) {
            liveStones[i][j] = 0;
        }
        if (liveStones[i][j] === 4) {
            liveStones[i][j] = 0;
        }
    }

    for (var k=0; k<2*boardSize; k++) liveStones = withExpandedBorder(boardSize, liveStones);

    return liveStones;

}

var scoreOfBoard = function (boardSize, stones) {

    /*
    returns an integer
    */

    var liveStones = copy(stones);

    for (var i=0; i<boardSize; i++) for (var j=0; j<boardSize; j++) {
        if (liveStones[i][j] === 3) {
            liveStones[i][j] = 0;
        }
        if (liveStones[i][j] === 4) {
            liveStones[i][j] = 0;
        }
    }

    for (var k=0; k<2*boardSize; k++) liveStones = withExpandedBorder(boardSize, liveStones);

    // here "territory" refers to area scoring territory (so stones + "japanese territory")
    var numBlackTerritory = numBlackStones(liveStones);
    var numWhiteTerritory = numWhiteStones(liveStones);

    return numBlackTerritory - numWhiteTerritory;

}

var numBlackStones = function (stones) {
    return numStonesWithColor(1, stones);
}

var numWhiteStones = function (stones) {
    return numStonesWithColor(2, stones);
}

var sum = function (nums) {
    if (nums.length === 0) return 0;
    return nums[0] + sum(nums.slice(1));
}

var numStonesWithColor = function (color, stones) {
    return sum(stones.map(function (row) {
        return row.filter(function (c) {
            return c === color;
        }).length;
    }));
}

var assert = function (b) {
    if (!b) console.log("assertion failure");
}

var withNewPiece = function (gameState, color, x, y) {
    if (['black', 'white'].indexOf(color) === -1) throw new Exception("color");

    var oldGameState = copy(gameState);

    var oldNumBlackStones = numBlackStones(gameState.stones);
    var oldNumWhiteStones = numWhiteStones(gameState.stones);

    if (colorOf(gameState, x, y) !== 'empty') {
        if (isNodejs()) console.log('illegal move: not an empty intersection');
        return false;
    }

    if (isSuicide(gameState, color, x, y)) {
        if (isNodejs()) console.log('illegal move: suicide');
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
        if (isNodejs()) console.log('illegal: positional superko');
        return false;
    }

    var newNumBlackStones = numBlackStones(gameState.stones);
    var newNumWhiteStones = numWhiteStones(gameState.stones);

    if (color === 'black') {
        assert(newNumBlackStones === oldNumBlackStones + 1);
        var numWhiteStonesKilled = oldNumWhiteStones - newNumWhiteStones;
        assert(numWhiteStonesKilled >= 0);

        if (numWhiteStonesKilled > 0) {
            if (isNodejs()) console.log('killed', numWhiteStonesKilled, 'white stones');
        }
    } else if (color === 'white') {
        assert(newNumWhiteStones === oldNumWhiteStones + 1);
        var numBlackStonesKilled = oldNumBlackStones - newNumBlackStones;
        assert(numBlackStonesKilled >= 0);

        if (numBlackStonesKilled > 0) {
            if (isNodejs()) console.log('killed', numBlackStonesKilled, 'black stones');
        }
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

var groupOf_stones = function (stones, x, y, blacklist) {
    blacklist = blacklist || [];

    if (blacklist.indexOf(reprStone(x, y)) !== -1) return [];

    var color = stones[x][y];
    if (color === 0) return [];

    var ret = [{'x': x, 'y': y}];

    for (var dx=-1; dx <= 1; dx += 1) for (var dy=-1; dy <= 1; dy += 1) {
        if (dx === 0 && dy === 0) continue;
        if (dx * dy !== 0) continue;

        if (0 <= x+dx && x+dx < stones.length &&
            0 <= y+dy && y+dy < stones.length) {
            var otherColor = stones[x+dx][y+dy];

            if (otherColor === color) {
                if (ret.map(function (s) { return reprStone(s.x, s.y)}).indexOf(reprStone(x+dx, y+dy)) === -1) {
                    ret.push({'x': x+dx, 'y': y+dy});
                }
                var retConcat = groupOf_stones(stones, x+dx, y+dy, blacklist.concat([reprStone(x, y)]));
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

if (isNodejs()) {
    exports.applyMove = applyMove;
    exports.currentGameState = currentGameState;
    exports.currentGameStatus = currentGameStatus;
    exports.currentDeadGroupResolutionState = currentDeadGroupResolutionState;
    exports.registerGameRoom = registerGameRoom;
    exports.getLobby = getLobby;

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
    exports.sum = sum;
    exports.numBlackStones = numBlackStones;
    exports.numWhiteStones = numWhiteStones;
    exports.estimatedSquareOwnershipOfBoard = estimatedSquareOwnershipOfBoard;
    exports.withExpandedBorder = withExpandedBorder;

}

if (isBrowser()) {
    window.isLegalMove = isLegalMove;
    window.boardStateHistoryOf = boardStateHistoryOf;
    window.initialGameState = initialGameState;
    window.estimatedSquareOwnershipOfBoard = estimatedSquareOwnershipOfBoard;
}

})();
