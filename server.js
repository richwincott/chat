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
            avatar: "data:image/png;base64,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",
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