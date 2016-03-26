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

        // black_circle = 'url("../img/black_circle.png") ' + posX + 'px ' + posY + 'px no-repeat';
    });


socket.on('get_new_piece', function (msg) {
    add(msg.row, msg.col);
});

//REMOVES THE PIECE FROM THE BOARD
remove = function(row, col) {
    var posToRemove = removePosition(row, col);
    if(posToRemove == -1) { // The case where the element doesn't exist
        return -1;
    }
    arr = circles.split(","); // array of CSS background property of all the pieces on the board 
    arr.splice(posToRemove, 1); // removes the element from the array
    circles = '';
    for(var i = 0; i < arr.length; i++) {
        if(circles) {
            circles = circles + ',' + arr[i].toString();
        } else {
            circles = arr[i].toString();
        }
    }
    $('.board').css("background", circles);
    $('.board').css("background-size", '60px');
};


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
    if(!circles) {
        circles = circles + 'url("../img/black_circle.png") ' + posX + 'px ' + posY + 'px no-repeat';
        $('.board').css("background", circles);
        $('.board').css("background-size", '60px');
    } else {
        circles = circles + ',' + 'url("../img/black_circle.png") ' + posX + 'px ' + posY + 'px no-repeat';
        $('.board').css("background", circles);
        $('.board').css("background-size", '60px');
    }
}

});
