var socket = io();
var room = /[^/]*$/.exec(window.location.pathname)[0];

// Tell the server that we've connected to a new room
socket.emit('post_new_connect', {
    'room' : room,
});

// Updates the list of roommates
var updateRoommates = function(roommates, exclude) {
    $("#roommates").empty();
    for(var name in roommates) {
        if(exclude !== roommates[name]) {
            $("#roommates").append($("<pre>", {
                'text': roommates[name],
            }));
        }
    }
}

// Get a message when a new user connects
socket.on('get_new_connect', function(info) {
    $("#history").append($("<pre>", {
        'text': (info.username + ' has connected.'),
    }));
    updateRoommates(info.roommates);
});

// Send a new message to the room
$("#send").on('click', function () {
    var message = $("#message").val();
    $("#message").val('');
    socket.emit('post_new_message', {
        'message': message,
        'room': room,
    });
});

// Gets a new message from the server
socket.on('get_new_message', function (info) {
    $("#history").append($("<pre>", {
        'text': '[' + info.color + '] ' + info.username + ': ' + info.message,
    }));
});

// Tell the server before the user leaves
jQuery(window).bind('beforeunload', function (e) {
    socket.emit('post_new_disconnect', {
        'room': room,
    });
});

// Get any disconnects from the server
socket.on('get_new_disconnect', function(info) {
    $("#history").append($("<pre>", {
        'text' : info.username + ' has left the chat.',
    }));
    updateRoommates(info.roommates, info.username);
});
