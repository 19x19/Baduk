$(document).ready(function(e) {
    var circles = '';
    $('.board').click(function(e){
        var posX = (e.pageX - 48  - $(this).position().left);
        var    posY = (e.pageY - 70 - $(this).position().top);
        //alert(posX + ' , ' + posY);
        var row = parseInt(posX / 57);
        var col = parseInt(posY / 57);
        if(row == 9) {
            row = 8;
        }
        if(col == 9) {
            col = 8;
        }

        socket.emit('postNewPiece',{
            'row': row,
            'col': col
        });
        //black_circle = 'url("../img/black_circle.png") ' + posX + 'px ' + posY + 'px no-repeat';
        // TODO : Send to server
    });


//REMOVES THE PIECE FROM THE BOARD
remove = function(row, col) {
    var posToRemove = removePosition(row, col);
    arr = circles.split(","); // array of CSS background property of all the pieces on the board 
    arr.splice(posToRemove, 1); // removes the element from the array
    circles = '';
    for(var i = 0; i < arr.length; i++) {
        if(!circles) {
            circles = circles + ',' + arr[i].toString();
        } else {
            circles = arr[i].toString();
        }
    }
    $('.board').css("background", circles);
    $('.board').css("background-size", '60px');
};


// RETURNS WHICH PART OF THE STRING TO REMOVE (WHICH WOULD BASICALLY REMOVE THAT PIECE)
removePosition = function(row, col) {
    arr = circles.split(","); // array of CSS background property of all the pieces on the board
    //console.log("length: " + arr.length);
    //console.log("arr: " + arr);
    var arr_2;
    for(var i = 0; i < arr.length; i++) {
        //console.log(arr[i]);
        var test = arr[i].toString();
        //console.log("test " + test);
        arr_2 = arr[i].toString().split(" ",3);
        //console.log("arr2: " + arr_2); 
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
        //alert(black_circles);
        $('.board').css("background", circles);
        $('.board').css("background-size", '60px');
    } else {
        circles = circles + ', ' + 'url("../img/black_circle.png") ' + posX + 'px ' + posY + 'px no-repeat';
        $('.board').css("background", circles);
        $('.board').css("background-size", '60px');
    }
}

});