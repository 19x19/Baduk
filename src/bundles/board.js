$(document).ready(function (e) {
$('[data-toggle="popover"]').popover();

$(window).mousemove(function (e) {
    appElement.handleMouseMove(e);
});

$(window).resize(function () {
    // TBD
});

socket.on('new_game_state', function (gameState) {

    if (gameState === false) {
        console.log('WARN: gameState is false, this should never happen. Please contact @zodiac');
        return;
    }

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

socket.on('new_dead_group_resolution_state', function (msg) {
    console.log(msg);
});

socket.on('move_is_illegal', function (msg) {
    console.log('illegal move');
});

socket.on('new_game_status', function (msg) {
    window.appElement.setState({
        gameStatus: msg,
    });
});

var App = React.createClass({
    getInitialState: function () {
        return {
            mostRecentGameState: initialGameState(),
            selectedMoveIdx: -1,
            hoverPiece: null,
            boardSize: 500,
            borderSize: 60,
            muted: true,
            chatHistory: [],
            playerName: null,
            playerColor: null,
            roommates: [],
            gameStatus: null,
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
                'hoverPiece': {
                    x: pieceCoordX,
                    y: pieceCoordY
                }
            });
        } else {
            this.setState({
                'hoverPiece': null,
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

        var coordOfClickE = this.coordOfClick(e.pageX, e.pageY);

        var room = /[^/]*$/.exec(window.location.pathname)[0];

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
    handleRetractPassBtnClick: function () {
        socket.emit('post_retract_pass', {
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
        var self = this;
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
                <pre>{JSON.stringify(this.state.gameStatus)}</pre>
                <Board
                    ref="gameBoard"
                    mostRecentGameState={this.state.mostRecentGameState}
                    selectedMoveIdx={this.state.selectedMoveIdx}
                    hoverPiece={this.state.hoverPiece}
                    boardSize={this.state.boardSize}
                    borderSize={this.state.borderSize}
                    handleClick={this.handleBoardClick}
                    gridSize={this.gridSize()}
                    playerColor={this.state.playerColor}
                    gameStatus={this.state.gameStatus} />
                <GameStatusDisplay gameState={this.state.mostRecentGameState} />
                <ButtonArea
                    gameStatus={this.state.gameStatus}
                    onPassBtnClick={this.handlePassBtnClick}
                    onRetractPassBtnClick={this.handleRetractPassBtnClick}
                    onResignBtnClick={this.handleResignBtnClick}
                    onMuteBtnClick={this.handleMuteBtnClick}
                    muted={this.state.muted} />
            </div>
            <div className="col-md-3 sidebar-right">
                <RoommatesBox roommates={this.state.roommates} />
                <MoveHistoryBox
                    moves={this.state.mostRecentGameState.moves}
                    selectedMoveIdx={this.state.selectedMoveIdx}
                    onSelectMove={function (selectedMoveIdx) {
                        self.setState({
                            selectedMoveIdx: selectedMoveIdx,
                        });
                    }}/>

            </div>
        </div>
    }
});

var ButtonArea = React.createClass({
    render: function () {
        if (this.props.gameStatus === null || this.props.gameStatus === 'playing') {
            return <div className="buttons">
                <button className="btn" onClick={this.props.onPassBtnClick}>Pass</button>
                <button className="btn" onClick={this.props.onResignBtnClick}>Resign</button>
                <button className="btn" onClick={this.props.onMuteBtnClick}>
                    <i id="sound_display" className={this.props.muted ? "fa fa-volume-off" : "fa fa-volume-up"} aria-hidden="true"></i>
                    </button>
            </div>
        } else if (this.props.gameStatus === 'resolving_dead_groups') {
            return <div className="buttons">
                <button className="btn" onClick={this.props.onRetractPassBtnClick}>Retract Pass</button>
                <button className="btn" onClick={this.props.onResignBtnClick}>Resign</button>
                <button className="btn">
                    <i id="sound_display" className={this.props.muted ? "fa fa-volume-off" : "fa fa-volume-up"} aria-hidden="true"></i>
                    </button>
            </div>
        }
    }
})

var Board = React.createClass({
    // props:
    // mostRecentGameState
    // selectedMoveIdx
    // hoverPiece
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
        selectedStones = JSON.parse(JSON.stringify(selectedStones));

        var selectedMove = this.props.mostRecentGameState.moves[this.props.selectedMoveIdx];

        var stones = [];
        var boardSize = this.props.mostRecentGameState.size;

        var stoneStride = this.props.gridSize / 8;
        var stoneSize = stoneStride - 2;

        var isNonEmptyStoneColor = function (i) {
            return i === 1 || i === 2 || i === 3 || i === 4;
        }

        var isGhostStoneColor = function (i) {
            return i === 3 || i === 4;
        }

        if ((this.props.gameStatus === 'playing' || this.props.gameStatus === null) &&
            this.props.hoverPiece &&
            isLegalMove(this.props.mostRecentGameState, this.props.playerColor, this.props.hoverPiece.x, this.props.hoverPiece.y)) {

            selectedStones[this.props.hoverPiece.x][this.props.hoverPiece.y] = { 'black': 3, 'white': 4 }[this.props.playerColor];

        }

        for (var i=0; i<boardSize; i++) for (var j=0; j<boardSize; j++) {
            if (isNonEmptyStoneColor(selectedStones[i][j])) {
                stones.push({
                    x: i,
                    y: j,
                    color: { 1: 'black', 2: 'white', 3: 'black', 4: 'white' }[selectedStones[i][j]],
                    isGhost: isGhostStoneColor(selectedStones[i][j]),
                    isSelectedMove: selectedMove && selectedMove.row === i && selectedMove.col === j
                });
            }
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
                        height={stoneSize}
                        opacity={stone.isGhost ? 0.5 : 1} />
                }
            })}
        </svg>
    }
});

window.appElement = ReactDOM.render(
  <App />, document.getElementById('reactAppContainer')
);

});
