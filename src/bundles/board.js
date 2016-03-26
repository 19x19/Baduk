$(document).ready(function(e) {
    var circles = '';
    $('.board').click(function(e){
 
        var posX = (e.pageX - 48  - $(this).position().left);
        var posY = (e.pageY - 70 - $(this).position().top);

        var row = parseInt(posX / 57);
        var col = parseInt(posY / 57);
 
        if (row == 9) {
            row = 8;
        }
 
        if (col == 9) {
            col = 8;
        }

        console.log(row, col);

        var room = /[^/]*$/.exec(window.location.pathname)[0];

        socket.emit('post_new_piece', {
            'row': row,
            'col': col,
            'room': room
        });

    });

socket.on('new_game_state', function (msg) {
    $('.board').css("background", '');
    circles = '';
    msg.blackStones.forEach(function (stone) {
        add(stone.x, stone.y, 'Black');
    });
    msg.whiteStones.forEach(function (stone) {
        add(stone.x, stone.y, 'White');
    });
});


// RETURNS WHICH PART OF THE STRING TO REMOVE
removePosition = function(row, col) {
    arr = circles.split(","); // array of CSS background property of all the pieces on the board
    var arr_2;
    for(var i = 0; i < arr.length; i++) {
        var test = arr[i].toString();
        arr_2 = arr[i].toString().split(" ",3);
        if((arr_2[1].toString() == ((row * 55) + "px")) && 
            (arr_2[2].toString() == ((col * 55) + "px"))) {
                return i;
        }
    }
    return -1;
};

//ADDS THE PIECE TO THE BOARD
add = function(row, col, type) {
    var posX = row * 55;
    var posY = col * 55;

    var filename;
    if (type === 'White') {
        filename = '../img/white_circle.png';
    } else {
        filename = '../img/black_circle.png';
    }

    circles = circles + ',' + 'url("' + filename + '") ' + posX + 'px ' + posY + 'px no-repeat';
    $('.board').css("background", circles);
    $('.board').css("background-size", '60px');

}

});
