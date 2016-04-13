var socket = io();
var room = /[^/]*$/.exec(window.location.pathname)[0];
var game_started = false;

socket.emit('post_new_connect', {
    'room' : room,
});

var faClassNameOf = function (color) {
    if (color === 'white') return 'circle-thin';
    if (color === 'black') return 'circle';
    return 'eye';
}

// Wraps a name with the appropriate image
var wrapName = function (color, name) {
    var player = faClassNameOf(color);
    return "<i class=\"fa fa-" + faClassNameOf(color) + "\"></i> " + name;
}

// Updates the list of roommates
var updateRoommates = function(roommates, exclude) {
    $("#roommates").empty();
    for(var name in roommates) {
        if(exclude !== roommates[name].name) {
            $("#roommates").append(
                "<pre>" + wrapName(roommates[name].color, roommates[name].name) + "</pre>"
            );
        }
    }
}

// Get a message when a new user connects
socket.on('get_new_connect', function(info) {
    $("#history").append(
        "<pre><i>" + info.username + " has connected.</i></pre>"
    );
    updateRoommates(info.roommates);
    if( $('#roommates > pre').length >= 2) {
        $('#userWait').modal('hide');
    }
    if(info.roommates.length > 1 && !game_started) {
        $("#gameState").text("Black to play");
    }
});

socket.on('your_name', function (msg) {
    $("#yourName").text(msg.username);
    updateRoommates(msg.roommates);
});

socket.on('your_color', function (msg) {
    $("#yourColor").text(msg.color);
});

// Send a new message to the room
$("#send").on('click', function () {
    var message = $("#message").val();
    if(message !== '') {
        $("#message").val('');
        socket.emit('post_new_message', {
            'message': message,
            'room': room,
        });
    }
});

// Opens the modal to change your moniker
$("#moniker").on('click', function () {
    $('#moniker').modal('show');
});

// Send a new message to the room
$("#plus_one").on('click', function () {
    socket.emit('post_new_message', {
        'message': ':+1:',
        'room': room,
    });
});

var appendToChatHistory = function (color, username, message) {
    $("#history").append(
        "<pre>" + wrapName(color, username) + ': ' + message + '</pre>'
    );
    $("#history").animate({ scrollTop: $("#history")[0].scrollHeight}, 0);
}

// Gets a new message from the server
socket.on('get_new_message', function (info) {
    appendToChatHistory(info.color, info.username, info.message);
});

window.notifyFromServer = function (message) {
    $("#history").append(
        "<pre><i>" + message + "</i></pre>"
    );
    $("#history").animate({ scrollTop: $("#history")[0].scrollHeight}, 0);
}

// Tell the server before the user leaves
jQuery(window).bind('beforeunload', function (e) {
    socket.emit('post_new_disconnect', {
        'room': room,
    });
});

// Get any disconnects from the server
socket.on('get_new_disconnect', function(info) {
    $("#history").append(
        "<pre><i>" + info.username + " has disconnected.</i></pre>"
    );
    updateRoommates(info.roommates, info.username);
});

// Links the button to copy the URL. Currently doesn't use the callbacks
// *** This button does not work with Safari ***
var cpb = clipboardButton('#roomLink');
$(roomLink).attr("data-clipboard-text", window.location.href);

// Allows you to press "Enter" to send text when input selected
$("#message").keyup(function(event){
    if(event.keyCode == 13){
        $("#send").click();
    }
});
