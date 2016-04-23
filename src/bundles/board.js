$(document).ready(function (e) {
$('[data-toggle="popover"]').popover();

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
            <ChatBox chatHistory={this.state.chatHistory} />
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
                    playerColor={window.your_color} />
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
                <div className="well">
                    <h5>Roommates</h5>
                    <div id="roommates"></div>
                </div>

                <div className="well move-history">
                    <h5>Move History</h5>
                    <div id="moveHistory">
                    </div>
                </div>

            </div>
        </div>
    }
});

var faClassNameOf = function (color) {
    if (color === 'white') return 'circle-thin';
    if (color === 'black') return 'circle';
    return 'eye';
}

var ChatBox = React.createClass({
    handleSend: function () {
        socket.emit('post_new_message', {
            'message': $(this.refs.chatInput).val(),
            'room': room,
        });
        $(this.refs.chatInput).val('');
    },
    handleKeyUp: function (e) {
        if (e.keyCode == 13){
            this.handleSend();
        }
    },
    render: function () {
        var self = this;
        return <div className="col-md-3 well">
            <h5>Chat</h5>
            <center>
                Your name is <span id="yourName" className="strong"></span><br />
                Your color is <span id="yourColor" className="strong"></span>
            </center>
            <div className="chat">{this.props.chatHistory.map(function (entry, i) {
                if (entry.color === 'admin') {
                    return <pre key={i}>
                        <i>{entry.message}</i>
                    </pre>
                } else {
                    return <pre key={i}>
                        <i className={"fa fa-" + faClassNameOf(entry.color)}></i>
                        <b style={{marginLeft: 4}}>{entry.username + ": "}</b>
                        <span>{entry.message}</span>
                    </pre>
                }
            })}</div>

            <div className="chat-controls">
                <input
                    ref="chatInput"
                    onKeyUp={this.handleKeyUp}
                    className="form-control" />
                <button id="send" onClick={this.handleSend} className="btn"><i className="material-icons">&#xE163;</i></button>
            </div>
        </div>
    }
});

var GameStatusDisplay = React.createClass({
    render: function () {
        if (this.props.gameState.result) {
            return <div>{resultStringOf(this.props.gameState.result.winner, this.props.gameState.result.advantage)}</div>
        } else if (this.props.gameState.turn === 'white') {
            return <div>White to play</div>
        } else {
            return <div>Black to play</div>
        }
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
