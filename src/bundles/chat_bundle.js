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
    if( $('#roommates > pre').length < 1) {
        $('#userWait').modal('show');
    }
    window.appElement.notifyFromServer(info.username + " has connected");
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
    window.your_color = msg.color;
    $("#yourColor").text(msg.color);
});

// Send a new message to the room
$("#plus_one").on('click', function () {
    socket.emit('post_new_message', {
        'message': ':+1:',
        'room': room,
    });
});

// Gets a new message from the server
socket.on('get_new_message', function (info) {
    window.appElement.notifyNewChatMessage(info.color, info.username, info.message);
});

// Tell the server before the user leaves
jQuery(window).bind('beforeunload', function (e) {
    socket.emit('post_new_disconnect', {
        'room': room,
    });
});

// Get any disconnects from the server
socket.on('get_new_disconnect', function(info) {
    window.appElement.notifyFromServer(info.username + " has disconnected");
    updateRoommates(info.roommates, info.username);
});

// Links the button to copy the URL. Currently doesn't use the callbacks
// *** This button does not work with Safari ***
var cpb = clipboardButton('#roomLink', success_cpy);
$(roomLink).attr("data-clipboard-text", window.location.href);

var isCurrentBrowserSafari = function() {
    return Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
}

function success_cpy() {
    if(isCurrentBrowserSafari()) {
        $('#roomLink').attr('data-content', 'Press ⌘ +C to copy');
        setTimeout (function () {
            $('.popover').fadeOut(300, function() { $(this).remove(); });
        }, 2000);
    } else {
        $('#roomLink').attr('data-content', 'Copied!');
        setTimeout (function () {
            $('.popover').fadeOut(300, function() { $(this).remove(); });
        }, 2000);
    }
};

