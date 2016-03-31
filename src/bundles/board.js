$(document).ready(function (e) {
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

socket.on('new_game_state', function (msg) {
    if (msg.turn === 'white') {
        $("#gameState").text('White to play');
    } else {
        $("#gameState").text('Black to play');
    }
    $('.inner').empty().append(imgOfAll(msg.blackStones, msg.whiteStones));
});


imgOfAll = function (blackStones, whiteStones) {
    var imgOfBlack = blackStones.map(function (stone) {
        return imgOf(stone.x, stone.y, 'black');
    });
    var imgOfWhite = whiteStones.map(function (stone) {
        return imgOf(stone.x, stone.y, 'white');
    });
    return imgOfBlack.concat(imgOfWhite);
}


imgOf = function (row, col, type) {
    var filename;
    if (type === 'white') {
        filename = '/img/white_circle.png';
    } else {
        filename = '/img/black_circle.png';
    }
    var posX = (row * 55) + 15;
    var posY = (col * 55) + 80;
    return $("<img>", {
        'src': filename,
        'css': {
            'position': 'absolute',
            'left': posX,
            'top': posY,
            'width': 60
        }
    });
}

});
