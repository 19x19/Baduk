
// Sets the Border to the board dynamically
var setBorder = function () {
    var boardPadding = ($('.board').width() / 17) + 3;
    $('.board').css('padding', boardPadding);
}

$(document).ready(function (e) {

    setBorder();
    setTimeout (function (){
    if( $('#roommates > pre').length < 2) {
        $('#userWait').modal('show');        
    }
    }, 1000);

    $('.board').click(function (e){

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

        var room = /[^/]*$/.exec(window.location.pathname)[0];

        socket.emit('post_new_piece', {
            'row': pieceCoordX,
            'col': pieceCoordY,
            'room': room
        });

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

socket.on('new_game_state', function (msg) {
    if (msg.turn === 'white') {
        $("#gameState").text('White to play');
    } else {
        $("#gameState").text('Black to play');
    }
    window.mostRecentGameState = msg;
    window.renderMostRecentGameState();
});

socket.on('move_is_illegal', function (msg) {
    window.notifyFromServer('move is illegal');
});

var render = function (gameState) {
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


imgOf = function (row, col, type, mostRecentMove) {
    var filename = '/img/' + type + '_circle';
    if (mostRecentMove.row === row && mostRecentMove.col === col) {
        filename += '_recent'
    }
    filename += '.png';

    var impX = 20; //Imperical addition to the top position
    var impY = 67; //Imperical addition to the top position
    if ($('.container').width() > 900) { // Because the margins change when the containers size changes
        impY = 85;
    }

    setBorder();
    var stoneSize = $('.board').width() / 8;
    
    var posX = (row * stoneSize) + impX;
    var posY = (col * stoneSize) + impY;

    var css = {
        'position': 'absolute',
        'left': posX,
        'top': posY,
        'width': (stoneSize - 2)
    };

    return $("<img>", {
        'src': filename,
        'css': css
    });
}

});
