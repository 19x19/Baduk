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

$('#gameOverOKBtn').click(() => {
    $('#gameOver').modal('hide');
});

socket.on('new_game_state', function (gameState) {

    if (gameState === false) {
        console.log('WARN: gameState is false, this should never happen. Please contact @zodiac');
        return;
    }

    if (gameState.result) {
        console.log(gameState.result);
        var winner = gameState.result.winner;
        winner = winner[0].toUpperCase() + winner.slice(1);
        if (gameState.result.advantage === 'resign') {
            $('#winMessage').text(winner + " wins by resignation");
        } else {
            $('#winMessage').text(winner + " wins by " + gameState.result.advantage + " points");
        }
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
    if (msg === 'game_over') {
        $('#gameOver').modal('show');
    }
    window.appElement.setState({
        gameStatus: msg,
    });
});

window.appElement = ReactDOM.render(
  <App />, document.getElementById('reactAppContainer')
);

});
