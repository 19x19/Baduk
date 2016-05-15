var borderSizeOf = function (boardSize, boardSizePixels) {
    return {
        9: 60,
        13: 45,
        19: 30
    }[boardSize];
}

window.ButtonArea = React.createClass({
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
});

window.App = React.createClass({
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
                <BoardContainer
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
