var go = require('../modules/go');
var isInBounds = go.isInBounds;
var libertiesOf = go.libertiesOf;
var withoutDeadGroups = go.withoutDeadGroups;
var colorOf = go.colorOf;
var groupOf = go.groupOf;
var isAnyNeighbourDiffColorWithOnlyOneLiberty = go.isAnyNeighbourDiffColorWithOnlyOneLiberty;
var isSuicide = go.isSuicide;
var withNewPiece = go.withNewPiece;
var boardStateHistoryOf = go.boardStateHistoryOf;
var prettyReprOfStones = go.prettyReprOfStones;
var sum = go.sum;
var numBlackStones = go.numBlackStones;
var numWhiteStones = go.numWhiteStones;
var estimatedSquareOwnershipOfBoard = go.estimatedSquareOwnershipOfBoard;
var withExpandedBorder = go.withExpandedBorder;

console.log(sum([]) === 0);
console.log(sum([1, 2]) === 3);
console.log(numBlackStones([
    [1, 2, 0, 0, 0, 0, 0, 0, 0],
    [2, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
]) === 2);
console.log(numWhiteStones([
    [1, 2, 0, 0, 0, 0, 0, 0, 0],
    [2, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
]) === 3);

var bs1 = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
];
console.log(bs1);
var bs2 = withExpandedBorder(9, bs1);
console.log(bs2);
var bs3 = withExpandedBorder(9, bs2);
console.log(bs3);
var bs4 = withExpandedBorder(9, bs3);
console.log(bs4);
var bs5 = withExpandedBorder(9, bs4);
console.log(bs5);

console.log(estimatedSquareOwnershipOfBoard(9, bs1));


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
    size: 9,
    moves: [],
};

var gs7 = withNewPiece(gs6, 'white', 0, 1);

console.log(gs7.stones[0][0] === 0);
console.log(gs7.stones[1][0] === 2);
console.log(gs7.stones[2][0] === 1);

console.log(isSuicide(gs7, 'black', 0, 0) === false);
console.log(isSuicide(gs7, 'white', 0, 0) === true);

console.log(isAnyNeighbourDiffColorWithOnlyOneLiberty(gs7, 'black', 0, 0));

var gs8 = withNewPiece(gs7, 'black', 0, 0);

console.log(gs8.stones[0][0] === 1);
console.log(gs8.stones[1][0] === 0);
console.log(gs8.stones[2][0] === 1);

var gs9 = {
    stones: [
        [1, 2, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    moves: [
        {
            'action': 'new_piece',
            'player_color': 'black',
            'row': 0,
            'col': 0
        },
        {
            'action': 'new_piece',
            'player_color': 'white',
            'row': 0,
            'col': 1
        }
    ]
}

var gs9BoardStates = ["_________\n\
_________\n\
_________\n\
_________\n\
_________\n\
_________\n\
_________\n\
_________\n\
_________",
"b________\n\
_________\n\
_________\n\
_________\n\
_________\n\
_________\n\
_________\n\
_________\n\
_________",
"bw_______\n\
_________\n\
_________\n\
_________\n\
_________\n\
_________\n\
_________\n\
_________\n\
_________"];

boardStateHistoryOf(gs9).forEach(function (boardState, i) {
    console.log(prettyReprOfStones(boardState.stones) === gs9BoardStates[i]);
});
