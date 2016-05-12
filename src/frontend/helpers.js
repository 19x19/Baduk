var faClassNameOf = function (color) {
    if (color === 'white') return 'circle-thin';
    if (color === 'black') return 'circle';
    return 'eye';
}

// return modified european coordinates of a move
// top left = A1, bottom right = T19 (I is skipped)
var reprOfMove = function (move) {
    if (move.action === 'pass') return 'pass';
    if (move.action === 'resign') return 'resign';
    if (move.action === 'new_piece') {
        return 'ABCDEFGHJKLMNOPQRST'[move.row] + (move.col + 1).toString();
    }
    if (move.action === undefined) throw "no action in " + JSON.stringify(move);
    throw "unrecognized move action " + move.action;
}

var isNonEmptyStoneColor = function (i) {
    return i === 1 || i === 2 || i === 3 || i === 4 || i === 7 || i === 8;
}
var isGhostStoneColor = function (i) {
    return i === 3 || i === 4;
}

// Converts a n*n array of stones to an array of stones with
// coordinates
var itemizedStonesOf = function (gameBoardSize, stones, selectedMove) {
    var ret = [];
    for (var i=0; i<gameBoardSize; i++) for (var j=0; j<gameBoardSize; j++) {
        if (isNonEmptyStoneColor(stones[i][j])) {
            ret.push({
                x: i,
                y: j,
                color: { 1: 'black', 2: 'white', 3: 'black', 4: 'white', 7: 'black', 8: 'white' }[stones[i][j]],
                isGhost: isGhostStoneColor(stones[i][j]),
                isSelectedMove: selectedMove && selectedMove.row === i && selectedMove.col === j,
            });
        }
    }
    return ret;
}

var pairsOf = function (arr) {
    // return array of pairs [[arr[0], arr[1]], [arr[2], arr[3]] ...]
    var ret = [];
    for (var i=0; i<arr.length; i+=2) {
        if (i+1 < arr.length) {
            ret.push([{
                'idx': i,
                'elem': arr[i],
            }, {
                'idx': i+1,
                'elem': arr[i+1],
            }]);
        } else {
            ret.push([{
                'idx': i,
                'elem': arr[i],
            }]);
        }
    }
    return ret;
}