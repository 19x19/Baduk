$(document).ready(function (e) {
$('[data-toggle="popover"]').popover();

$(window).mousemove(function (e) {
    appElement.handleMouseMove(e);
});

$(window).resize(function () {
    // TBD
});

var resultStringOf = function (color, advantage) {
    if (advantage === 'resign') {
        return color[0].toUpperCase() + '+R';
    } else {
        return color[0].toUpperCase() + advantage.toString();
    }
}

socket.on('new_game_state', function (gameState) {

    // Play the sound for a new piece
    window.appElement.notifyNewGameState();

    if (gameState.moves.length > 0) {
        var mostRecentMove = gameState.moves.slice(-1)[0];
        var color = mostRecentMove.player_color.charAt(0).toUpperCase() + mostRecentMove.player_color.slice(1);
        if (mostRecentMove.action === 'pass') {
            window.appElement.notifyFromServer(color + ' passed');
        } else if (mostRecentMove.action === 'resign') {
            window.appElement.notifyFromServer(color + ' resigned');
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
            muted: false,
            chatHistory: [],
            playerName: null,
            playerColor: null,
            roommates: [],
        }
    },
    notifyNewChatMessage: function (color, username, message) {
        this.setState(({
            chatHistory: this.state.chatHistory.concat({
                color: color,
                username: username,
                message: message,
            }),
        }));
    },
    notifyFromServer: function (message) {
        this.setState({
            chatHistory: this.state.chatHistory.concat({
                color: 'admin',
                message: message
            }),
        });
    },
    notifyNewGameState: function () {
        if (!this.state.muted) {
            var move_sound = new Audio("/sounds/move.wav");
            move_sound.play();
        }
    },
    gridSize: function () {
        var boardSize = this.state.boardSize;
        var borderSize = this.state.borderSize;
        return boardSize - 2*borderSize;
    },
    handleMouseMove: function (e) {
        if (this.state.playerColor === null) return;

        var coordOfClickE = this.coordOfClick(e.pageX, e.pageY);

        var pieceCoordX = coordOfClickE.x;
        var pieceCoordY = coordOfClickE.y;

        var stoneSize = this.gridSize() / 8;

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

        var boardX = $(ReactDOM.findDOMNode(this.refs.gameBoard)).offset().left;
        var boardY = $(ReactDOM.findDOMNode(this.refs.gameBoard)).offset().top;

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
    handlePassBtnClick: function () {
        socket.emit('post_pass', {
            'room': room
        });
    },
    handleResignBtnClick: function () {
        socket.emit('post_resign', {
            'room': room
        });
    },
    handleMuteBtnClick: function () {
        this.setState({
            muted: !this.state.muted,
        });
    },
    render: function () {
        return <div className="row go">
            <ChatBox 
                chatHistory={this.state.chatHistory}
                playerName={this.state.playerName}
                playerColor={this.state.playerColor}
                onSendMessage={function (msg) {
                    socket.emit('post_new_message', {
                        'message': msg,
                        'room': room,
                    });
                }} />
            <div className="col-md-6 go-board">
                <Board
                    ref="gameBoard"
                    mostRecentGameState={this.state.mostRecentGameState}
                    selectedMoveIdx={this.state.selectedMoveIdx}
                    ghostPiece={this.state.ghostPiece}
                    boardSize={this.state.boardSize}
                    borderSize={this.state.borderSize}
                    handleClick={this.handleBoardClick}
                    gridSize={this.gridSize()}
                    playerColor={this.state.playerColor} />
                <GameStatusDisplay gameState={this.state.mostRecentGameState} />
                <div className="buttons">
                    <button className="btn" onClick={this.handlePassBtnClick}>Pass</button>
                    <button className="btn" onClick={this.handleResignBtnClick}>Resign</button>
                    <button className="btn" onClick={this.handleMuteBtnClick}>
                        <i id="sound_display" className={this.state.muted ? "fa fa-volume-up" : "fa fa-volume-off"} aria-hidden="true"></i>
                        </button>
                </div>
            </div>
            <div className="col-md-3 sidebar-right">
                <RoommatesBox roommates={this.state.roommates} />

                <div className="well move-history">
                    <h5>Move History</h5>
                    <div id="moveHistory">
                    </div>
                </div>

            </div>
        </div>
    }
});

var Board = React.createClass({
    // props:
    // mostRecentGameState
    // selectedMoveIdx
    // ghostPiece
    // boardSize
    // borderSize
    // handleClick
    // gridSize
    // playerColor
    // todo: reduce
    posOf: function (row, col) {
        var stoneSize = this.props.gridSize / 8;
        return {
            x: this.props.borderSize + (row * stoneSize),
            y: this.props.borderSize + (col * stoneSize),
        };
    },
    render: function () {

        if (this.props.mostRecentGameState.moves.length === this.props.selectedMoveIdx + 1) {
            // fast path optimization, not strictly necessary
            var selectedStones = this.props.mostRecentGameState.stones;
        } else {
            var selectedStones = boardStateHistoryOf(this.props.mostRecentGameState)[this.props.selectedMoveIdx + 1].stones;
        }

        var selectedMove = this.props.mostRecentGameState.moves[this.props.selectedMoveIdx];

        var stones = [];
        var boardSize = this.props.mostRecentGameState.size;

        var stoneStride = this.props.gridSize / 8;
        var stoneSize = stoneStride - 2;

        for (var i=0; i<boardSize; i++) for (var j=0; j<boardSize; j++) {
            if (selectedStones[i][j] === 1 || selectedStones[i][j] === 2) {
                stones.push({
                    x: i,
                    y: j,
                    color: {1: 'black', 2: 'white'}[selectedStones[i][j]],
                    isSelectedMove: selectedMove.row === i && selectedMove.col === j
                });
            }
        }

        if (this.props.ghostPiece &&
            isLegalMove(this.props.mostRecentGameState, this.props.playerColor, this.props.ghostPiece.x, this.props.ghostPiece.y)) {
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
            onClick={this.props.handleClick}
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
                        xlinkHref={"/img/" + stone.color + "_circle" + (stone.isSelectedMove ? "_recent" : "" ) + ".png"}
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
                    xlinkHref={"/img/" + self.props.playerColor + "_circle.png"}
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
  <App />, document.getElementById('reactAppContainer')
);

});
