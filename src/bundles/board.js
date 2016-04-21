$(document).ready(function (e) {
$('[data-toggle="popover"]').popover();

$('#passBtn').click(function () {
    socket.emit('post_pass', {
        'room': room
    });
});

$('#resignBtn').click(function () {
    socket.emit('post_resign', {
        'room': room
    });
});

$(window).mousemove(function (e) {
    appElement.handleMouseMove(e);
});

$(window).resize(function () {
    // TBD
});

window.drawDebug = function (gameState) {
    $('.inner').empty().append(imgOfAll(gameState.blackStones, gameState.whiteStones, {}));
}

var resultStringOf = function (color, advantage) {
    if (advantage === 'resign') {
        return color[0].toUpperCase() + '+R';
    } else {
        return color[0].toUpperCase() + advantage.toString();
    }
}

socket.on('new_game_state', function (gameState) {

    // Play the sound for a new piece
    if(!muted) {
        var move_sound = new Audio("/sounds/move.wav");
        move_sound.play();
    }

    if (gameState.result) {
        $("#gameStatus").text(resultStringOf(gameState.result.winner, gameState.result.advantage));
    } else if (gameState.turn === 'white') {
        $("#gameStatus").text('White to play');
    } else {
        $("#gameStatus").text('Black to play');
    }

    if (gameState.moves.length > 0) {
        var mostRecentMove = gameState.moves.slice(-1)[0];
        if (mostRecentMove.action === 'pass') {
            color = mostRecentMove.player_color.charAt(0).toUpperCase() + mostRecentMove.player_color.slice(1);
            window.notifyFromServer(color + ' passed');
        } else if (mostRecentMove.action === 'resign') {
            color = mostRecentMove.player_color.charAt(0).toUpperCase() + mostRecentMove.player_color.slice(1);
            window.notifyFromServer(color + ' resigned');
        }
    }

    window.appElement.setState({
        mostRecentGameState: gameState,
        selectedMoveIdx: gameState.moves.length - 1,
    });
});

socket.on('move_is_illegal', function (msg) {
    console.log('illegal move');
});

var App = React.createClass({
    getInitialState: function () {
        return {
            mostRecentGameState: initialGameState(),
            selectedMoveIdx: -1,
            ghostPiece: null,
            boardSize: 500,
            borderSize: 60,
        }
    },
    gridSize: function () {
        var boardSize = this.state.boardSize;
        var borderSize = this.state.borderSize;
        return boardSize - 2*borderSize;
    },
    handleMouseMove: function (e) {
        if (typeof(window.your_color) === 'undefined') return;

        var coordOfClickE = this.coordOfClick(e.pageX, e.pageY);

        var pieceCoordX = coordOfClickE.x;
        var pieceCoordY = coordOfClickE.y;

        var stoneSize = this.gridSize() / 8;
        var posOfStone = this.posOf(pieceCoordX, pieceCoordY);

        if (0 <= pieceCoordX && pieceCoordX < 9
         && 0 <= pieceCoordY && pieceCoordY < 9
        ) {
            this.setState({
                'ghostPiece': {
                    x: pieceCoordX,
                    y: pieceCoordY
                }
            });
        } else {
            this.setState({
                'ghostPiece': null,
            });
        }
    },
    coordOfClick: function (mouseX, mouseY) {

        var boardX = $(ReactDOM.findDOMNode(this)).offset().left;
        var boardY = $(ReactDOM.findDOMNode(this)).offset().top;

        var mouseRelX = mouseX - boardX - this.state.borderSize;
        var mouseRelY = mouseY - boardY - this.state.borderSize;

        var mousePctX = mouseRelX / this.gridSize();
        var mousePctY = mouseRelY / this.gridSize();

        var pieceCoordX = Math.round(mousePctX * 8);
        var pieceCoordY = Math.round(mousePctY * 8);

        return {
            x: pieceCoordX,
            y: pieceCoordY
        }
    },
    posOf: function (row, col) {
        var stoneSize = this.gridSize() / 8;
        return {
            x: this.state.borderSize + (row * stoneSize),
            y: this.state.borderSize + (col * stoneSize),
        };
    },
    handleBoardClick: function (e) {

        console.log('handleBoardClick', e.pageX);

        var coordOfClickE = this.coordOfClick(e.pageX, e.pageY);

        var room = /[^/]*$/.exec(window.location.pathname)[0];

        console.log('handleBoardClick', coordOfClickE);

        socket.emit('post_new_piece', {
            'row': coordOfClickE.x,
            'col': coordOfClickE.y,
            'room': room
        });
    },
    render: function () {
        return <Board
            mostRecentGameState={this.state.mostRecentGameState}
            selectedMoveIdx={this.state.selectedMoveIdx}
            ghostPiece={this.state.ghostPiece}
            boardSize={this.state.boardSize}
            borderSize={this.state.borderSize}
            handleClick={this.handleBoardClick} />
    }
})

var Board = React.createClass({
    gridSize: function () {
        var boardSize = this.props.boardSize;
        var borderSize = this.props.borderSize;
        return boardSize - 2*borderSize;
    },
    posOf: function (row, col) {
        var stoneSize = this.gridSize() / 8;
        return {
            x: this.props.borderSize + (row * stoneSize),
            y: this.props.borderSize + (col * stoneSize),
        };
    },
    handleClick: function (e) {
        this.props.handleClick(e);
    },
    render: function () {

        if (this.props.mostRecentGameState.moves.length === this.props.selectedMoveIdx) {
            // fast path optimization, not strictly necessary
            var selectStones = this.props.mostRecentGameState.stones;
        } else {
            var selectedStones = boardStateHistoryOf(this.props.mostRecentGameState)[this.props.selectedMoveIdx + 1].stones;
        }

        var selectedMove = this.props.mostRecentGameState.moves[this.props.selectedMoveIdx];

        var stones = [];
        var boardSize = this.props.mostRecentGameState.size;

        var stoneStride = this.gridSize() / 8;
        var stoneSize = stoneStride - 2;

        for (var i=0; i<boardSize; i++) for (var j=0; j<boardSize; j++) {
            if (selectedStones[i][j] === 1) {
                stones.push({
                    x: i,
                    y: j,
                    color: 'black',
                });
            } else if (selectedStones[i][j] === 2) {
                stones.push({
                    x: i,
                    y: j,
                    color: 'white',
                });
            }
        }


        if (this.props.ghostPiece &&
            isLegalMove(this.props.mostRecentGameState, window.your_color, this.props.ghostPiece.x, this.props.ghostPiece.y)) {
            // monads yo
            var ghostPieces = [this.props.ghostPiece];
        } else {
            var ghostPieces = [];
        }

        var boardSize = this.props.boardSize;
        var borderSize = this.props.borderSize;
        var gridSize = boardSize - 2*borderSize;

        var self = this;

        return <svg
            height={this.props.boardSize}
            width={this.props.boardSize}
            onClick={this.handleClick}
        >
            <image xlinkHref="/img/wood-texture.jpg" preserveAspectRatio="none" x="0" y="0" width={boardSize} height={boardSize} />
            <image xlinkHref="/img/go_board_9*9.png" 
                width={gridSize} 
                height={gridSize} 
                x={borderSize}
                y={borderSize} />
            {stones.map(function (stone, i) {
                var posOfStone = self.posOf(stone.x, stone.y);
                if (stone.color === 'white' || stone.color === 'black') {
                    return <image
                        key={stone.color + "-" + stone.x + "-" + stone.y}
                        xlinkHref={"/img/" + stone.color + "_circle.png"}
                        x={posOfStone.x - (stoneSize / 2)}
                        y={posOfStone.y - (stoneSize / 2)}
                        width={stoneSize}
                        height={stoneSize} />
                }
            })}
            {ghostPieces.map(function (ghostPiece) {
                var posOfStone = self.posOf(ghostPiece.x, ghostPiece.y);
                return <image
                    key="ghostPiece"
                    xlinkHref={"/img/" + window.your_color + "_circle.png"}
                    x={posOfStone.x - (stoneSize / 2)}
                    y={posOfStone.y - (stoneSize / 2)}
                    width={stoneSize}
                    height={stoneSize}
                    opacity={0.5} />
            })}
        </svg>
    }
});

window.appElement = ReactDOM.render(
  <App />, document.getElementById('reactBoardContainer')
);

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

});
