$(document).ready(function (e) {
$('[data-toggle="popover"]').popover();

$(window).mousemove(function (e) {
    appElement.handleMouseMove(e);
});

$(window).resize(function () {
    window.appElement.setState({
        boardSizePixels: $('.col-md-6').width(),
    });
});

socket.on('new_game_state', function (gameState) {

    if (gameState === false) {
        console.log('WARN: gameState is false, this should never happen. Please contact @zodiac');
        return;
    }

    // Play the sound for a new piece
    window.appElement.notifyNewGameState();

    if (gameState.moves.length > 0) { // todo: not idempotent :'(
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
    window.appElement.setState({
        deadGroupResolutionState: msg,
    });
});

socket.on('move_is_illegal', function (msg) {
    console.log('illegal move');
});

socket.on('new_game_status', function (msg) {
    window.appElement.setState({
        gameStatus: msg,
    });
});

var borderSizeOf = function (boardSize, boardSizePixels) {
    return {
        9: 60,
        13: 45,
        19: 30
    }[boardSize];
}

var App = React.createClass({
    getInitialState: function () {
        return {
            mostRecentGameState: initialGameState(),
            selectedMoveIdx: -1,
            hoverPiece: null,
            boardSizePixels: 500,
            muted: true,
            chatHistory: [],
            playerName: null,
            playerColor: null,
            roommates: [],
            gameStatus: null,
            deadGroupResolutionState: null,
        }
    },
    componentDidMount: function () {
        window.setTimeout(function () { $(window).resize() }, 0);
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
        var boardSizePixels = this.state.boardSizePixels;
        var borderSize = borderSizeOf(this.state.mostRecentGameState.size, this.state.boardSizePixels);
        return boardSizePixels - 2*borderSize;
    },
    handleMouseMove: function (e) {
        if (this.state.playerColor === null) return;

        var coordOfClickE = this.coordOfClick(e.pageX, e.pageY);

        var pieceCoordX = coordOfClickE.x;
        var pieceCoordY = coordOfClickE.y;

        var boardSize = this.state.mostRecentGameState.size;

        var stoneSize = this.gridSize() / (boardSize - 1);

        if (0 <= pieceCoordX && pieceCoordX < boardSize
         && 0 <= pieceCoordY && pieceCoordY < boardSize
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

        var borderSize = borderSizeOf(this.state.mostRecentGameState.size, this.state.boardSizePixels);

        var mouseRelX = mouseX - boardX - borderSize;
        var mouseRelY = mouseY - boardY - borderSize;

        var mousePctX = mouseRelX / this.gridSize();
        var mousePctY = mouseRelY / this.gridSize();

        var boardSize = this.state.mostRecentGameState.size;

        var pieceCoordX = Math.round(mousePctX * (boardSize - 1));
        var pieceCoordY = Math.round(mousePctY * (boardSize - 1));

        return {
            x: pieceCoordX,
            y: pieceCoordY
        }
    },
    posOf: function (row, col) {
        var stoneSize = this.gridSize() / (this.state.mostRecentGameState.size - 1);
        var borderSize = borderSizeOf(this.state.mostRecentGameState.size, this.state.boardSizePixels);
        return {
            x: borderSize + (row * stoneSize),
            y: borderSize + (col * stoneSize),
        };
    },
    handleBoardClick: function (e) {

        var coordOfClickE = this.coordOfClick(e.pageX, e.pageY);
        var room = /[^/]*$/.exec(window.location.pathname)[0];

        if (this.state.gameStatus === 'playing' || this.state.gameStatus === null) {

            socket.emit('post_new_piece', {
                'row': coordOfClickE.x,
                'col': coordOfClickE.y,
                'room': room,
            });

        } else if (this.state.gameStatus === 'resolving_dead_groups') {

            var colorOfClickedStone = this.state.deadGroupResolutionState.stones[coordOfClickE.x][coordOfClickE.y];

            if (colorOfClickedStone === 0) return;

            if (colorOfClickedStone === 1 || colorOfClickedStone === 2) {
                socket.emit('mark_group_as_dead', {
                    'row': coordOfClickE.x,
                    'col': coordOfClickE.y,
                    'room': room,
                });
            } else if (colorOfClickedStone === 3 || colorOfClickedStone === 4) {
                socket.emit('mark_group_as_alive', {
                    'row': coordOfClickE.x,
                    'col': coordOfClickE.y,
                    'room': room,
                });
            }

        } else {
            console.log('???');
        }

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
    handleCommitResolutionBtnClick: function () {
        console.log('emitting post_commit_endgame_resolution');
        socket.emit('post_commit_endgame_resolution', {
            'room': room
        });
    },
    render: function () {
        var self = this;
        return <div className="row go">
            <div className="col-md-3">
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
            </div>
            <div className="col-md-6">
                <pre>{JSON.stringify(this.state.gameStatus)}</pre>
                <Board
                    ref="gameBoard"
                    mostRecentGameState={this.state.mostRecentGameState}
                    selectedMoveIdx={this.state.selectedMoveIdx}
                    hoverPiece={this.state.hoverPiece}
                    boardSize={this.state.boardSizePixels}
                    borderSize={borderSizeOf(this.state.mostRecentGameState.size, this.state.boardSizePixels)}
                    handleClick={this.handleBoardClick}
                    gridSize={this.gridSize()}
                    playerColor={this.state.playerColor}
                    gameStatus={this.state.gameStatus}
                    deadGroupResolutionState={this.state.deadGroupResolutionState}/>
                <GameStatusDisplay gameState={this.state.mostRecentGameState} />
                <ButtonArea
                    gameStatus={this.state.gameStatus}
                    onPassBtnClick={this.handlePassBtnClick}
                    onRetractPassBtnClick={this.handleRetractPassBtnClick}
                    onResignBtnClick={this.handleResignBtnClick}
                    onMuteBtnClick={this.handleMuteBtnClick}
                    onCommitResolutionBtnClick={this.handleCommitResolutionBtnClick}
                    muted={this.state.muted} />
            </div>
            <div className="col-md-3">
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
                <button className="btn" onClick={this.props.onCommitResolutionBtnClick}>Commit</button>
                <button className="btn" onClick={this.props.onResignBtnClick}>Resign</button>
                <button className="btn">
                    <i id="sound_display" className={this.props.muted ? "fa fa-volume-off" : "fa fa-volume-up"} aria-hidden="true"></i>
                    </button>
            </div>
        } else if (this.props.gameStatus === 'game_over') {
            return <div className="buttons">
                <button className="btn">Good</button>
                <button className="btn">Game</button>
            </div>
        } else {
            console.log('unknown gameStatus ', this.props.gameStatus);
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
        var stoneSize = this.props.gridSize / (this.props.mostRecentGameState.size - 1);
        return {
            x: this.props.borderSize + (row * stoneSize),
            y: this.props.borderSize + (col * stoneSize),
        };
    },
    getDisplayedStones: function () {
        if (this.props.gameStatus === 'resolving_dead_groups' && this.props.deadGroupResolutionState) {
            var displayedStones = [];
            var gameBoardSize = this.props.mostRecentGameState.size;

            var stones = this.props.deadGroupResolutionState.stones;

            var isNonEmptyStoneColor = function (i) {
                return i === 1 || i === 2 || i === 3 || i === 4 || i === 7 || i === 8;
            }
            var isGhostStoneColor = function (i) {
                return i === 3 || i === 4;
            }

            for (var i=0; i<gameBoardSize; i++) for (var j=0; j<gameBoardSize; j++) {
                if (isNonEmptyStoneColor(stones[i][j])) {
                    displayedStones.push({
                        x: i,
                        y: j,
                        color: { 1: 'black', 2: 'white', 3: 'black', 4: 'white' }[stones[i][j]],
                        isGhost: isGhostStoneColor(stones[i][j]),
                        isSelectedMove: false
                    });
                }
            }
            return displayedStones;
        } else {
            return this.getSelectedDisplayedStones();
        }
    },
    getSelectedDisplayedStones: function () {
        var isNonEmptyStoneColor = function (i) {
            return i === 1 || i === 2 || i === 3 || i === 4 || i === 7 || i === 8;
        }
        var isGhostStoneColor = function (i) {
            return i === 3 || i === 4;
        }
        var isEstimateColor = function (i) {
            return i === 7 || i === 8;
        }

        if (this.props.mostRecentGameState.moves.length === this.props.selectedMoveIdx + 1) {
            // fast path optimization, not strictly necessary
            var selectedStones = this.props.mostRecentGameState.stones;
        } else {
            var selectedStones = boardStateHistoryOf(this.props.mostRecentGameState)[this.props.selectedMoveIdx + 1].stones;
        }
        selectedStones = JSON.parse(JSON.stringify(selectedStones));

        var selectedMove = this.props.mostRecentGameState.moves[this.props.selectedMoveIdx];

        var stones = [];
        var gameBoardSize = this.props.mostRecentGameState.size;

        var isNonEmptyStoneColor = function (i) {
            return i === 1 || i === 2 || i === 3 || i === 4 || i === 7 || i === 8;
        }

        var isGhostStoneColor = function (i) {
            return i === 3 || i === 4;
        }

        if ((this.props.gameStatus === 'playing' || this.props.gameStatus === null) &&
            this.props.hoverPiece &&
            isLegalMove(this.props.mostRecentGameState, this.props.playerColor, this.props.hoverPiece.x, this.props.hoverPiece.y)) {

            selectedStones[this.props.hoverPiece.x][this.props.hoverPiece.y] = { 'black': 3, 'white': 4 }[this.props.playerColor];

        }

        var estimatedSquareOwnership = estimatedSquareOwnershipOfBoard(gameBoardSize, selectedStones);

        // propagate estimatedSquareOwnership to selectedStones
        for (var i=0; i<gameBoardSize; i++) for (var j=0; j<gameBoardSize; j++) {
            if (selectedStones[i][j] === 0) {
                if (estimatedSquareOwnership[i][j] === 1) {
                    selectedStones[i][j] = 7;
                }
                if (estimatedSquareOwnership[i][j] === 2) {
                    selectedStones[i][j] = 8;
                }
            }
        }

        var displayedStones = [];

        for (var i=0; i<gameBoardSize; i++) for (var j=0; j<gameBoardSize; j++) {
            if (isNonEmptyStoneColor(selectedStones[i][j])) {
                displayedStones.push({
                    x: i,
                    y: j,
                    color: { 1: 'black', 2: 'white', 3: 'black', 4: 'white', 7: 'black', 8: 'white' }[selectedStones[i][j]],
                    isGhost: isGhostStoneColor(selectedStones[i][j]),
                    isSelectedMove: selectedMove && selectedMove.row === i && selectedMove.col === j,
                    isEstimate: isEstimateColor(selectedStones[i][j]),
                });
            }
        }
        return displayedStones;
    },
    render: function () {

        var displayedStones = this.getDisplayedStones();
        var boardSizePixels = this.props.boardSize;
        var borderSize = this.props.borderSize;
        var gridSize = boardSizePixels - 2*borderSize;
        var gameBoardSize = this.props.mostRecentGameState.size;

        var self = this;

        return <svg
            height={boardSizePixels}
            width={boardSizePixels}
            onClick={this.props.handleClick}
        >
            <image xlinkHref="/img/wood-texture.jpg" preserveAspectRatio="none" x="0" y="0" width={boardSizePixels} height={boardSizePixels} />
            <image xlinkHref={{
                9: "/img/go_board_9*9.png",
                13: "/img/go_board_13*13.png",
                19: "/img/go_board_19*19.png",
            }[gameBoardSize] }
                width={gridSize}
                height={gridSize}
                x={borderSize}
                y={borderSize} />
            {displayedStones.map(function (stone, i) {
                var posOfStone = self.posOf(stone.x, stone.y);
                var stoneSize = stone.isEstimate ? 15 : gridSize / gameBoardSize;
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
