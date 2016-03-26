// TODO: make board size a variable
// TODO: move history for ko



if (window) {
	window.initialGameState = initialGameState;
	window.makeMove = makeMove;
	window.libertiesOf = libertiesOf;
	window.copy = copy;
}

// if (typeof exports !== 'undefined') {
// 	exports.initialGameState = initialGameState;
// 	exports.makeMove = makeMove;
// }