
// Sets the Border to the board dynamically
var setBorder = function () {
    var boardPadding = ($('.board').width() / 17) + 3;
    $('.board').css('padding', boardPadding).fadeTo(1, .99).fadeTo(1, 1);
}

$(document).ready(function (e) {

setBorder();
setBorder();
setTimeout (function (){
  if( $('#roommates > pre').length < 2) {
      $('#userWait').modal('show');
  }
}, 1000);

window.onBoardClick = function (e) {
    console.log('click');

    var mouseX = e.pageX;
    var mouseY = e.pageY;

    var boardX = $(".board").offset().left;
    var boardY = $(".board").offset().top;

    var mouseRelX = mouseX - boardX;
    var mouseRelY = mouseY - boardY;

    var mousePctX = mouseRelX / $(".board").width();
    var mousePctY = mouseRelY / $(".board").height();

    // 0.07 is empirical
    var mousePicPctX = mousePctX - 0.07;
    var mousePicPctY = mousePctY - 0.07;

    var pieceCoordX = Math.round(mousePicPctX * 8);
    var pieceCoordY = Math.round(mousePicPctY * 8);

    console.log(pieceCoordX, pieceCoordY);

    var room = /[^/]*$/.exec(window.location.pathname)[0];

    socket.emit('post_new_piece', {
        'row': pieceCoordX,
        'col': pieceCoordY,
        'room': room
    });
}

$('.board').click(window.onBoardClick);

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

$('.board').mousemove(function (e){

    var mouseX = e.pageX;
    var mouseY = e.pageY;

    var boardX = $(".board").offset().left;
    var boardY = $(".board").offset().top;

    var mouseRelX = mouseX - boardX;
    var mouseRelY = mouseY - boardY;

    var mousePctX = mouseRelX / $(".board").width();
    var mousePctY = mouseRelY / $(".board").height();

    // 0.07 is empirical
    var mousePicPctX = mousePctX - 0.07;
    var mousePicPctY = mousePctY - 0.07;

    var pieceCoordX = Math.round(mousePicPctX * 8);
    var pieceCoordY = Math.round(mousePicPctY * 8);

    var impX = 20; //Imperical addition to the top position
    var impY = 67; //Imperical addition to the top position
    if ($('.container').width() > 900) { // Because the margins change when the containers size changes
        impY = 85;
    }
    var stoneSize = $('.board').width() / 8;
    var posOfStone = posOf(pieceCoordX, pieceCoordY);

    $('.ghostPiece').remove();
    if (0 <= pieceCoordX && pieceCoordX < 9 && 0 <= pieceCoordY && pieceCoordY < 9) {
        var ghostPiece = $('<img>', {
            'class': 'ghostPiece',
            'src': '/img/black_circle.png',
            'css': {
                position: 'absolute',
                opacity: 0.4,
                left: posOfStone.x,
                top: posOfStone.y,
                width: stoneSize - 2,
            }
        });
        ghostPiece.click(function (event) {
            window.onBoardClick(event);
        });
        $(".inner").prepend(ghostPiece);
    }

    // var room = /[^/]*$/.exec(window.location.pathname)[0];

    // socket.emit('isValid', {
    //     'row': pieceCoordX,
    //     'col': pieceCoordY,
    //     'room': room
    // });

});

$(window).resize(function () {
     window.renderMostRecentGameState();
});

window.drawDebug = function (gameState) {
    $('.inner').empty().append(imgOfAll(gameState.blackStones, gameState.whiteStones, {}));
}

window.renderMostRecentGameState = function () {
    if (window.mostRecentGameState) {
        render(window.mostRecentGameState);
    }
}

var resultStringOf = function (color, advantage) {
    if (advantage === 'resign') {
        return color[0].toUpperCase() + '+R';
    } else {
        return color[0].toUpperCase() + advantage.toString();
    }
}

socket.on('new_game_state', function (msg) {
    if (msg.result) {
        $("#gameState").text(resultStringOf(msg.result.winner, msg.result.advantage));
    } else if (msg.turn === 'white') {
        $("#gameState").text('White to play');
    } else {
        $("#gameState").text('Black to play');
    }
    window.mostRecentGameState = msg;

    if (msg.mostRecentMove) {
        if (msg.mostRecentMove.action === 'pass') {
            color = msg.mostRecentMove.color.charAt(0).toUpperCase() + msg.mostRecentMove.color.slice(1);
            window.notifyFromServer(color + ' passed');
        } else if (msg.mostRecentMove.action === 'resign') {
            color = msg.mostRecentMove.color.charAt(0).toUpperCase() + msg.mostRecentMove.color.slice(1);
            window.notifyFromServer(color + ' resigned');
        }
    }

    window.renderMostRecentGameState();
});

socket.on('move_is_illegal', function (msg) {
    window.notifyFromServer('Illegal move');
});

var render = function (gameState) {
    setBorder();
    $('.inner').empty().append(imgOfAll(gameState.stones, gameState.size, gameState.mostRecentMove));
}


imgOfAll = function (stones, boardSize, mostRecentMove) {

    var ret = [];

    for (var i=0; i<boardSize; i++) for (var j=0; j<boardSize; j++) {
        if (stones[i][j] === 1) {
            ret.push(imgOf(i, j, 'black', mostRecentMove));
        } else if (stones[i][j] === 2) {
            ret.push(imgOf(i, j, 'white', mostRecentMove));
        }
    }

    return ret;
}

posOf = function (row, col) {
    var stoneSize = $('.board').width() / 8;
    var impX = 19;
    var impY = $('.container').width() > 900 ? 85 : 67;
    return {
        x: (row * stoneSize) + impX,
        y: (col * stoneSize) + impY,
    };

}

imgOf = function (row, col, type, mostRecentMove) {
    var filename = '/img/' + type + '_circle';
    if (mostRecentMove.row === row && mostRecentMove.col === col) {
        filename += '_recent'
    }
    filename += '.png';

    var stoneSize = $('.board').width() / 8;
    var posOfStone = posOf(row, col);

    var css = {
        'position': 'absolute',
        'left': posOfStone.x,
        'top': posOfStone.y,
        'width': (stoneSize - 2)
    };

    return $("<img>", {
        'src': filename,
        'css': css
    });
}

});
