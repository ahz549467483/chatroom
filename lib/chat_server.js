var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {} ;
var namesUsed= [];
var currentRoom = {};

exports.listen = function (server) {
    io = socketio.listen(server);
    io.set('log level', 1);
    io.sockets.on('connection', function (socket) {
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
        joinRoom(socket, 'Lobby');
        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);
        socket.on('rooms', function () {
            socket.emit('rooms', io.sockets.adapter.rooms);
        });
        handleClientDisconnection(socket, nickNames, namesUsed);
    })
}

//分配用户名
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    var name = 'Guest' + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult', {
        success: true,
        name: name
    })
    namesUsed.push(name);
    return guestNumber + 1;
}

// 进入聊天室
function joinRoom(socket, room) {
    // 让用户进入房间
    socket.join(room);
    //记录用户的当前房间
    currentRoom[socket.id] = room;
    // 让用户知道他们进入了房间
    socket.emit('joinResult', {room:room});
    // 让房间里其他的用户知道有新用户进入房间
    socket.broadcast.to(room).emit('message',{
        text: nickNames[socket.id] + ' has join ' + room + '.'
    })
    // 确定有哪些用户在这个房间
    var usersInRoom = io.sockets.adapter.rooms[room];
    var length = Object.keys(usersInRoom).length;
    // 如果不只一个用户子在这个房间，汇总下都是谁
    if (length > 1) {
        var usersInRoomSummary = 'Users currently in ' + room + ':';
        var array = [];
        for (var index in nickNames) {
            array.push(nickNames[index]);
        }
        usersInRoomSummary += array.join(",") + '.';
        socket.emit('message', { text: usersInRoomSummary });
    }
}

function handleMessageBroadcasting(socket) {
    socket.on('message', function (message) {
        console.log(message);
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ':' + message.text
        })
    })
}

// 更名请求
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', function (name) {
        if(name.indexOf('Guest') == 0){
            socket.emit('nameResult', {
                success:false,
                message: 'Names cannot begin with "Guest" .'
            })
        } else {
            if(namesUsed.indexOf(name) == -1){
                var previousName = nickNames[socket.id];
                var previousIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult', {
                    success: true,
                    name:name
                });
                socket.broadcast.to(currentRoom[socket.id]),emit('message',{
                    text: previousName + ' is now known as ' + name + '.'
                });
            }else{
                socket.emit('nameResult', {
                    success: false,
                    message: 'That name is already in use'
                })
            }
        }
    })
}

function handleRoomJoining(socket) {
    socket.on('join', function (room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    })
}

function handleClientDisconnection(socket) {
    socket.on('disconnect', function () {
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}