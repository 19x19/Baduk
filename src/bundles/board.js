$(document).ready(function (e) {
$('[data-toggle="popover"]').popover();

setTimeout (function (){
  if( $('#roommates > pre').length < 2) {
      $('#userWait').modal('show');
  }
}, 1000);

var coordOfClick = function (e) {
    var mouseX = e.pageX;
    var mouseY = e.pageY;

    var boardX = $("#boardContainer svg").offset().left;
    var boardY = $("#boardContainer svg").offset().top;

    var mouseRelX = mouseX - boardX;
    var mouseRelY = mouseY - boardY;

    var mousePctX = mouseRelX / $("#boardContainer svg").width();
    var mousePctY = mouseRelY / $("#boardContainer svg").height();

    var mousePicPctX = mousePctX;
    var mousePicPctY = mousePctY;

    var pieceCoordX = Math.round(mousePicPctX * 8);
    var pieceCoordY = Math.round(mousePicPctY * 8);

    return {
        x: pieceCoordX,
        y: pieceCoordY
    }
}

window.onBoardClick = function (e) {

    var coordOfClickE = coordOfClick(e);

    console.log(coordOfClickE);

    var room = /[^/]*$/.exec(window.location.pathname)[0];

    socket.emit('post_new_piece', {
        'row': coordOfClickE.x,
        'col': coordOfClickE.y,
        'room': room
    });
}

$('#boardContainer').click(window.onBoardClick);

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

    if (typeof(window.your_color) === 'undefined') return;

    var coordOfClickE = coordOfClick(e);

    var pieceCoordX = coordOfClickE.x;
    var pieceCoordY = coordOfClickE.y;

    var stoneSize = $('#boardContainer svg').width() / 8;
    var posOfStone = posOf(pieceCoordX, pieceCoordY);

    window.renderSelectedGameState();
    window.ghost_piece = undefined;

    if (0 <= pieceCoordX && pieceCoordX < 9
     && 0 <= pieceCoordY && pieceCoordY < 9
     && isLegalMove(window.mostRecentGameState, window.your_color, pieceCoordX, pieceCoordY)
    ) {

        window.ghost_piece = {
            x: pieceCoordX,
            y: pieceCoordY,
        }

    }

});

$(window).resize(function () {
     window.renderSelectedGameState();
});

window.drawDebug = function (gameState) {
    $('.inner').empty().append(imgOfAll(gameState.blackStones, gameState.whiteStones, {}));
}

window.renderSelectedGameState = function () {
    if (window.mostRecentGameState) {
        render(window.mostRecentGameState, window.selectedMoveIdx, window.ghost_piece);
    }
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
    var move_sound = new Audio("/sounds/move.wav");
    move_sound.play();

    if (gameState.result) {
        $("#gameState").text(resultStringOf(gameState.result.winner, gameState.result.advantage));
    } else if (gameState.turn === 'white') {
        $("#gameState").text('White to play');
    } else {
        $("#gameState").text('Black to play');
    }
    window.mostRecentGameState = gameState;

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

    window.selectedMoveIdx = gameState.moves.length - 1;
    window.renderSelectedGameState();
});

socket.on('move_is_illegal', function (msg) {
    console.log('illegal move');
});

var render = function (gameState, selectedMoveIdx, ghost_piece) {

    var selectedStones = boardStateHistoryOf(gameState)[selectedMoveIdx + 1].stones;
    var selectedMove = gameState.moves[selectedMoveIdx];

    $('#boardContainer').empty().append(boardOf(selectedStones, gameState.size, selectedMove, ghost_piece));

    $('#moveHistory').empty().append(renderedMoveHistoryOf(gameState, selectedMoveIdx));
}

var boardOf = function (selectedStones, boardSize, selectedMove, ghost_piece) {

    var boardContainer = Snap(500, 500);

    boardContainer.image("/img/wood-texture.jpg", 0, 0, 500, 500);
    boardContainer.image("/img/go_board_9*9.png", 0, 0, 500, 500);

    var stoneStride = 500 / 8;
    var stoneSize = stoneStride - 2;

    for (var i=0; i<boardSize; i++) for (var j=0; j<boardSize; j++) {
        if (selectedStones[i][j] === 1) {
            var posOfStone = posOf(i, j);
            boardContainer.image("/img/black_circle.png", posOfStone.x - (stoneSize / 2), posOfStone.y - (stoneSize / 2), stoneSize, stoneSize);
        } else if (selectedStones[i][j] === 2) {
            var posOfStone = posOf(i, j);
            boardContainer.image("/img/white_circle.png", posOfStone.x - (stoneSize / 2), posOfStone.y - (stoneSize / 2), stoneSize, stoneSize);

        }
    }

    if (ghost_piece) {
        console.log('draw ghost piece');
        var posOfGhostPiece = posOf(ghost_piece.x, ghost_piece.y);
        var ghostPiece = boardContainer.image("/img/" + window.your_color + "_circle.png", posOfGhostPiece.x - (stoneSize / 2), posOfGhostPiece.y - (stoneSize / 2), stoneSize, stoneSize);
        ghostPiece.attr({
            "opacity": 0.5,
        });
    }

    return boardContainer.node;
}

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

var renderedMoveHistoryOf = function (gameState, selectedMoveIdx) {
    return pairsOf(gameState.moves).map(function (moves) {
        if (moves.length === 2) {

            var container = $('<div>');

            var move1 = $('<span>', {
                text: reprOfMove(moves[0].elem),
            });
            var move2 = $('<span>', {
                text: reprOfMove(moves[1].elem),
            });

            if (moves[0].idx === selectedMoveIdx) {
                move1.css('font-weight', 'bold');
            } else if (moves[1].idx === selectedMoveIdx) {
                move2.css('font-weight', 'bold');
            }

            move1.click(function () {
                console.log('selected', moves[0].idx);
                window.selectedMoveIdx = moves[0].idx;
                window.renderSelectedGameState();
            });
            move2.click(function () {
                console.log('selected', moves[1].idx);
                window.selectedMoveIdx = moves[1].idx;
                window.renderSelectedGameState();
            });

            container.append(move1);
            container.append('|');
            container.append(move2);

            return container;
        } else {
            var container = $('<div>');
            var move1 = $('<span>', {
                text: reprOfMove(moves[0].elem),
            });

            if (moves[0].idx === selectedMoveIdx) {
                move1.css('font-weight', 'bold');
            }

            move1.click(function () {
                console.log('selected', moves[0].idx);
                window.selectedMoveIdx = moves[0].idx;
                window.renderSelectedGameState();
            });

            container.append(move1);
            return container;
        }
    });
}


posOf = function (row, col) {
    var stoneSize = 500 / 8; // TODO: compute 500 dynamically. board size is not available at compute time though :'(
    return {
        x: (row * stoneSize),
        y: (col * stoneSize),
    };

}

});
