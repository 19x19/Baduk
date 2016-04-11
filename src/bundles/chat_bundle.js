var socket = io();
var room = /[^/]*$/.exec(window.location.pathname)[0];
var game_started = false;

// Tell the server that we've connected to a new room
var returning = undefined;
if(Cookies.get('socket_id') !== undefined && Cookies.get('room') === room) {
    returning = Cookies.get('socket_id');
}

socket.emit('post_new_connect', {
    'room' : room,
    'returning' : returning,
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
    Cookies.set('socket_id', socket.id);
    Cookies.set('room', room);
});

socket.on('your_color', function (msg) {
    $("#yourColor").text(msg.color);
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

var appendToChatHistory = function (color, username, message) {
    $("#history").append(
        "<pre>" + wrapName(color, username) + ': ' + message + '</pre>'
    );
    $("#history").animate({ scrollTop: $("#history")[0].scrollHeight}, 1000);
}

// Gets a new message from the server
socket.on('get_new_message', function (info) {
    appendToChatHistory(info.color, info.username, info.message);
});

window.notifyFromServer = function (message) {
    $("#history").append(
        "<pre><i>Illegal move</i></pre>"
    );
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
roomLink.setAttribute("data-clipboard-text", window.location.href);

// Allows you to press "Enter" to send text when input selected
$("#message").keyup(function(event){
    if(event.keyCode == 13){
        $("#send").click();
    }
});
