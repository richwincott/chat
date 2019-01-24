var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var mongoose = require('mongoose');

var seed = 1000;
var messages = [];
var users = {};
var rooms = ["General"];

//Import the mongoose module
var mongoose = require('mongoose');

//Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1/chat';
mongoose.connect(mongoDB, { useNewUrlParser: true });
// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var mdb = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
mdb.on('error', console.error.bind(console, 'MongoDB connection error:'));


// Define schema
var Schema = mongoose.Schema;

var seedSchema = new Schema({
    userId: Number,
});

var messageSchema = new Schema({
    userId: Number,
    message: String,
    type: String,
    dateTime: Date,
    room: String,
    edited: Boolean,
    deleted: { type: Boolean, default: false }
});

var userSchema = new Schema({
    id: Number,
    userName: String,
    online: { type: Boolean, default: false },
    avatar: String,
    admin: { type: Boolean, default: false },
    currentRoom: { type: String, default: "General" }
});

var roomSchema = new Schema({
    name: String,
});

// Compile model from schema
var seedModel = mongoose.model('seed', seedSchema );
var messageModel = mongoose.model('message', messageSchema );
var userModel = mongoose.model('user', userSchema );
var roomModel = mongoose.model('room', roomSchema );

seedModel.find({}, function(err, _seeds) {
    if (err) handleError(err);

    if (_seeds.length == 0) {
        var newSeedInstance = new seedModel({userId: seed});
        save("seed", newSeedInstance);
    }
    else {
        seed = _seeds[0].userId;
    }
    console.log("current seed: " + seed);
});

messageModel.find({}, function(err, _messages) {
    if (err) handleError(err);
    
    messages = _messages;
});

userModel.find({}, function(err, _users) {
    if (err) handleError(err);
    
    _users.forEach(user => {
        users[user.id] = user;
    });
});

roomModel.find({}, function(err, _rooms) {
    if (err) handleError(err);

    if (_rooms.length == 0) {
        var newSeedInstance = new roomModel({name: rooms[0]});
        save("room", newSeedInstance);
    }
    else {
        _rooms.forEach(room => {
            if (room.name != "General") {
                rooms.push(room.name);
            }
        });
    }
});

function save(type, instance) {
    if (type) {
        switch (type) {
            case "seed":
                instance.save(function (err) {
                    if (err) return handleError(err);
                });
                break;
            case "message":
                instance.save(function (err) {
                    if (err) return handleError(err);
                });
                break;
            case "user":       
                instance.save(function (err) {
                    if (err) return handleError(err);
                });
                break;
            case "room":
                instance.save(function (err) {
                    if (err) return handleError(err);
                });
                break;
        }
    }
}

function handleError(err) {
    console.error(err);
}

app.use(express.static(path.join(__dirname, 'build')));

io.on('connection', function(socket){

    socket.on('ping', () => {
        socket.emit("pong");
        console.log("ping")
    });

    socket.on('login', (data) => {
        if (users[data.id]) {
            users[data.id].online = true;
            authenticated();
            socket.userId = data.id;
            socket.emit('authenticated', users[data.id]);
            io.emit("users", users);
            console.log(data.id + ' connected');
            userModel.find({id: socket.userId}, function (err, users) {
                if (err) return handleError(err);
                users[0].online = true;
                save("user", users[0]);
            });
            
        }
        else {
            newUser(data);
        }
    });

    socket.on('new-user', (data, callback) => {
        if (!userExists(data.username)) {
            newUser(data);
            callback(true);
        }
        else {
            callback(false);
        }
    });

    function userExists(userNameToCheck) {
        let found = false;
        for (let key in users) {
            if (users[key].userName.split("/")[0].toLowerCase() == userNameToCheck.toLowerCase()) {
                found = true;
            }
        };
        return found;
    }

    function newUser(data) {
        seed++
        var user = {
            id: seed,
            userName: data.username ? data.username : "Anon",
            avatar: null,
            online: true,
            admin: false
        };
        users[seed] = user;
        authenticated();
        socket.userId = seed;
        socket.emit('authenticated', users[seed]);
        io.emit("users", users);
        console.log(seed + ' connected');
        var newUserInstance = new userModel(user);
        save("user", newUserInstance);
        seedModel.find({}, function (err, seeds) {
            if (err) return handleError(err);
            seeds[0].userId = seed;
            save("seed", seeds[0]);
        });
    }

    socket.on("fetch-rooms", function () {
        socket.emit('rooms', rooms)
    });

    socket.on("fetch-users", function () {
        socket.emit('users', users)
    });

    function authenticated() {
        socket.on("set-name", function (data) {
            users[socket.userId].userName = data;
            io.emit('username-change', {
                userId: socket.userId,
                newName: users[socket.userId].userName
            });
            userModel.find({id: socket.userId}, function (err, users) {
                if (err) return handleError(err);
                users[0].userName = data;
                save("user", users[0]);
            });
        });        

        socket.on("set-avatar", function (data) {
            users[socket.userId].avatar = data;
            io.emit('avatar-change', {
                userId: socket.userId,
                newAvatar: users[socket.userId].avatar
            });
            userModel.find({id: socket.userId}, function (err, users) {
                if (err) return handleError(err);
                users[0].avatar = data;
                save("user", users[0]);
            });
        });
        
        socket.on("check-key", function(key, callback) {
            if (key === "ninjacat") {
                console.log(users[socket.userId].userName + " became an admin!")
                users[socket.userId].admin = true;
                io.emit("users", users);
                userModel.find({id: socket.userId}, function (err, users) {
                    if (err) return handleError(err);
                    users[0].admin = true;
                    save("user", users[0]);
                });
                
                callback(true);
            }
            else {
                callback(false);
            }
        });

        socket.on("fetch-messages", function () {
            setTimeout(function () {
                socket.emit('messages', messages.filter((message) => {
                    return message.room == users[socket.userId].currentRoom;
                }))
            }, 0)
        });

        socket.on('join', function (roomName) {
            if (rooms.indexOf(roomName) == -1) {
                rooms.push(roomName);
                io.emit('new-room', roomName);
                var newRoomInstance = new roomModel({name: roomName});
                save("room", newRoomInstance);
            }
            users[socket.userId].currentRoom = roomName;
            io.emit("users", users);
            socket.join(roomName);
            userModel.find({id: socket.userId}, function (err, users) {
                if (err) return handleError(err);
                users[0].currentRoom = roomName;
                save("user", users[0]);
            });
        })

        socket.on("new-room", function (newRoomName) {
            rooms.push(newRoomName);
            io.emit('new-room', newRoomName);
            var newRoomInstance = new roomModel({name: newRoomName});
            save("room", newRoomInstance);
        })

        socket.on("new-message", function (message) {
            const newMessage = {
                userId: socket.userId,
                message: message,
                type: "text",
                dateTime: new Date(),
                room: users[socket.userId].currentRoom,
                edited: false,
                deleted: false
            };
            if (message.indexOf('.png') > -1 || message.indexOf('.jpg') > -1 || message.indexOf('.jpeg') > -1 || message.indexOf('.gif') > -1 || message.indexOf('data:image/png;base64,') > -1) {
                newMessage.type = "image";
            }
            messages.push(newMessage);
            io.to(newMessage.room).emit('new-message', newMessage);
            var newMessageInstance = new messageModel(newMessage);
            save("message", newMessageInstance);
        })

        socket.on("edit-message", function (data) {
            var _message = messages.filter((message) => {
                return message.room == users[socket.userId].currentRoom;
            })[data.index];
            _message.message = data.newMessage;
            _message.edited = true;
            io.to(users[socket.userId].currentRoom).emit('edited-message', data);
            messageModel.find({_id: _message._id}, function (err, messages) {
                if (err) return handleError(err);
                messages[0].message = data.newMessage;
                messages[0].edited = true;
                save("message", messages[0]);
            });
        })

        socket.on("remove-message", function (data) {
            var _message = messages.filter((message) => {
                return message.room == users[socket.userId].currentRoom;
            })[data]
            _message.deleted = true;
            io.to(users[socket.userId].currentRoom).emit('removed-message', data);
            messageModel.find({_id: _message._id}, function (err, messages) {
                if (err) return handleError(err);
                messages[0].deleted = true;
                save("message", messages[0]);
            });
        })
    }

    socket.on('disconnect', function() {
        console.log(socket.userId + ' disconnected');
        if (users[socket.userId]) {
            users[socket.userId].online = false;
            io.emit("users", users);
            userModel.find({id: socket.userId}, function (err, users) {
                if (err) return handleError(err);
                users[0].online = false;
                save("user", users[0]);
            });
        }
    });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});