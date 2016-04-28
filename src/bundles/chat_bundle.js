var socket = io();
var room = /[^/]*$/.exec(window.location.pathname)[0];
var game_started = false;

socket.emit('post_new_connect', {
    'room' : room,
});

// Updates the list of roommates
var updateRoommates = function(roommates) {
    window.appElement.setState({
        roommates: roommates,
    });
}

// Get a message when a new user connects
socket.on('get_new_connect', function(info) {
    window.appElement.notifyFromServer(info.username + " has connected");
    updateRoommates(info.roommates);

    if (info.roommates.length >= 2) {
        $('#userWait').modal('hide');
    } else if (info.roommates.length <= 1) {
        $('#userWait').modal('show');
    }

    if (info.roommates.length > 1 && !game_started) {
        $("#gameState").text("Black to play");
    }
});

socket.on('your_name', function (msg) {
    window.appElement.setState({
        playerName: msg.username,
    })
    updateRoommates(msg.roommates);
});

socket.on('your_color', function (msg) {
    window.appElement.setState({
        playerColor: msg.color,
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
    updateRoommates(info.roommates);
});

// Links the button to copy the URL. Currently doesn't use the callbacks
// *** This button does not work with Safari ***
clipboardButton('#roomLink', function () {
    if (isCurrentBrowserSafari()) {
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
});
$(roomLink).attr("data-clipboard-text", window.location.href);

var isCurrentBrowserSafari = function() {
    return Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
}
