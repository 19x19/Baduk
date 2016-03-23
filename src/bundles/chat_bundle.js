var socket = io();                                                          
var room = /[^/]*$/.exec(window.location.pathname)[0];                      
                                                                            
// Tell the server that we've connected to a new room                       
socket.emit('post_new_connect', {                                           
    'room' : room,                                                          
});                                                                         
                                                                            
// Get a message when a new user connects                                   
socket.on('get_new_connect', function(info) {                               
    $("#history").append($("<pre>", {                                       
        'text': (info.socket_id + ' has connected.'),                       
    }));                                                                    
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
        'text': info.author + ': ' + info.message,                          
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
        'text' : info.socket_id + ' has left the chat.',                    
    }));                                                                    
});   
