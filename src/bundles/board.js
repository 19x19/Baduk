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
    reactBoardElement.handleMouseMove(e);
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
        $("#gameState").text(resultStringOf(gameState.result.winner, gameState.result.advantage));
    } else if (gameState.turn === 'white') {
        $("#gameState").text('White to play');
    } else {
        $("#gameState").text('Black to play');
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

    window.reactBoardElement.setState({
        mostRecentGameState: gameState,
        selectedMoveIdx: gameState.moves.length - 1,
    });
});

socket.on('move_is_illegal', function (msg) {
    console.log('illegal move');
});

var Board = React.createClass({
    getInitialState: function () {
        return {
            mostRecentGameState: initialGameState(),
            selectedMoveIdx: -1,
            ghostPiece: null,
            boardSize: 500,
            borderSize: 20,
        }
    },
    coordOfClick: function (mouseX, mouseY) {

        var boardX = $(ReactDOM.findDOMNode(this)).offset().left;
        var boardY = $(ReactDOM.findDOMNode(this)).offset().top;

        var mouseRelX = mouseX - boardX;
        var mouseRelY = mouseY - boardY;

        var mousePctX = mouseRelX / 500;
        var mousePctY = mouseRelY / 500;

        var mousePicPctX = mousePctX;
        var mousePicPctY = mousePctY;

        var pieceCoordX = Math.round(mousePicPctX * 8);
        var pieceCoordY = Math.round(mousePicPctY * 8);

        return {
            x: pieceCoordX,
            y: pieceCoordY
        }
    },
    handleClick: function (e) {
        var coordOfClickE = this.coordOfClick(e.pageX, e.pageY);

        var room = /[^/]*$/.exec(window.location.pathname)[0];

        socket.emit('post_new_piece', {
            'row': coordOfClickE.x,
            'col': coordOfClickE.y,
            'room': room
        });
    },
    handleMouseMove: function (e) {
        if (typeof(window.your_color) === 'undefined') return;

        var coordOfClickE = this.coordOfClick(e.pageX, e.pageY);

        var pieceCoordX = coordOfClickE.x;
        var pieceCoordY = coordOfClickE.y;

        var stoneSize = 500 / 8;
        var posOfStone = posOf(pieceCoordX, pieceCoordY);

        if (0 <= pieceCoordX && pieceCoordX < 9
         && 0 <= pieceCoordY && pieceCoordY < 9
        ) {

            window.reactBoardElement.setState({
                'ghostPiece': {
                    x: pieceCoordX,
                    y: pieceCoordY
                }
            });

        }
    },
    render: function () {

        var selectedStones = boardStateHistoryOf(this.state.mostRecentGameState)[this.state.selectedMoveIdx + 1].stones;
        var selectedMove = this.state.mostRecentGameState.moves[this.state.selectedMoveIdx];

        var stones = [];
        var boardSize = this.state.mostRecentGameState.size;

        var stoneStride = 500 / 8;
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


        if (this.state.ghostPiece &&
            isLegalMove(this.state.mostRecentGameState, window.your_color, this.state.ghostPiece.x, this.state.ghostPiece.y)) {
            // monads yo
            var ghostPieces = [this.state.ghostPiece];
        } else {
            var ghostPieces = [];
        }

        return <svg
            height="500"
            width="500"
            onClick={this.handleClick}
        >
            <circle cx={50} cy={50} r={10} fill="red" />
            <image xlinkHref="/img/wood-texture.jpg" preserveAspectRatio="none" x="0" y="0" width={500} height={500} />
            <image xlinkHref="/img/go_board_9*9.png" width={500} height={500} />
            {stones.map(function (stone, i) {
                var posOfStone = posOf(stone.x, stone.y);
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
                var posOfStone = posOf(ghostPiece.x, ghostPiece.y);
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

window.reactBoardElement = ReactDOM.render(
  <Board />, document.getElementById('reactBoardContainer')
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

var posOf = function (row, col) {
    var stoneSize = 500 / 8; // TODO: compute 500 dynamically. board size is not available at compute time though :'(
    return {
        x: (row * stoneSize),
        y: (col * stoneSize),
    };

}

});
