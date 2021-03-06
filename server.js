var virtualDirPath = process.env.virtualDirPath;
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http, { 
	path: virtualDirPath + '/socket.io',
});
var mongoose = require('mongoose');

var seed = 1000;

//Import the mongoose module
var mongoose = require('mongoose');

//Set up default mongoose connection
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost:27017/chat', { useNewUrlParser: true });
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
    password: { type: String, default: "" },
    userName: String,
    online: { type: Boolean, default: false },
    avatar: String,
    admin: { type: Boolean, default: false },
    currentRoom: { type: String, default: "General" }
});

var roomSchema = new Schema({
    name: String,
    private: { type: Boolean, default: false },
    lastUpdate: Date
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
        save(newSeedInstance);
    }
    else {
        seed = _seeds[0].userId;
    }
    console.log("current seed: " + seed);
});

function fetchMessages() {
    return new Promise((resolve, reject) => {
        messageModel.find({}, function(err, _messages) {
            if (err) handleError(err);
            
            resolve(_messages);
        });
    })
}

function fetchUsers(withPassword = false) {
    return new Promise((resolve, reject) => {
        userModel.find({}, function(err, _users) {
            if (err) handleError(err);
            
            let users = {};

            _users.forEach(user => {
                if (!withPassword) {
                    if (user.password) {
                        user.password = 'nothing to see here';
                    }
                    else {
                        user.password = undefined;
                    }
                }
                users[user.id] = user;
            });

            resolve(users);
        });
    })
}

function fetchRooms() {
    return new Promise((resolve, reject) => {
        roomModel.find({}, function(err, _rooms) {
            if (err) handleError(err);

            let rooms = [];

            if (_rooms.length == 0) {
                rooms.push({
                    name: "General",
                    private: false
                });
                var newSeedInstance = new roomModel(rooms[0]);
                save(newSeedInstance);
            }
            else {
                _rooms.forEach(room => {
                    rooms.push(room);
                });
            }

            resolve(rooms);
        });
    })
}

function save(instance) {
    instance.save(function (err) {
        if (err) return handleError(err);
    });
}

function handleError(err) {
    console.error(err);
}

io.on('connection', function(socket) {

    socket.on('login', (data, callback) => {
        fetchUsers(true).then((users) => {
            if (users[data.id]) {
                if (Buffer.from(users[data.id].password, 'base64').toString() === data.password) {
                    for (var id in users) {
                        if (users[id].password) {
                            users[id].password = 'nothing to see here';
                        }
                        else {
                            users[id].password = undefined;
                        }
                    };
                    users[data.id].online = true;
                    authenticated();
                    socket.userId = data.id;
                    io.emit("users", users);
                    console.log(data.id + ' connected');
                    userModel.find({id: socket.userId}, function (err, users) {
                        if (err) return handleError(err);
                        users[0].online = true;
                        save(users[0]);
                    });
                    callback(users[data.id]);
                }
                else {
                    callback();
                }
            }
        })
    });

    socket.on('new-user', (data, callback) => {
        userExists(data.username).then((found) => {
            if (!found) {
                newUser(data).then((user) => {
                    callback(user);
                })
            }
            else {
                callback();
            }
        })
    });

    function userExists(userNameToCheck) {
        return new Promise((resolve, reject) => {
            fetchUsers().then((users) => {
                let found = false;
                for (let key in users) {
                    if (users[key].userName) {
                        if (users[key].userName.split("/")[0].toLowerCase() == userNameToCheck.toLowerCase()) {
                            found = true;
                        }
                    }
                };
                resolve(found);
            })
        })
    }

    function newUser(data) {
        return new Promise((resolve, reject) => {
            fetchUsers().then((users) => {
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
                io.emit("users", users);
                console.log(seed + ' connected');
                var newUserInstance = new userModel(user);
                save(newUserInstance);
                seedModel.find({}, function (err, seeds) {
                    if (err) return handleError(err);
                    seed++
                    seeds[0].userId = seed;
                    save(seeds[0]);
                });
                resolve(users[seed]);
            })
        })
    }

    socket.on("fetch-rooms", function (data, callback) {
        fetchRooms().then((rooms) => {
            callback(rooms);
        });
    });

    socket.on("fetch-users", function (data, callback) {
        fetchUsers().then((users) => {
            callback(users);
        });
    });

    socket.on("fetch-user", function (data, callback) {
        fetchUsers().then((users) => {
            let user = users[data];
            callback(user);
        });
    });

    socket.on("fetch-messages", function (data, callback) {
        fetchMessages().then((messages) => {
            callback(messages.filter((message) => {
                return message.room == data;
            }));
        });
    });

    function authenticated() {
        socket.on("set-name", function (data) {
            fetchUsers().then((users) => {
                users[socket.userId].userName = data;
                io.emit('username-change', {
                    userId: socket.userId,
                    newName: users[socket.userId].userName
                });
                userModel.find({id: socket.userId}, function (err, users) {
                    if (err) return handleError(err);
                    users[0].userName = data;
                    save(users[0]);
                });
            })
        });     
        
        socket.on("set-password", function (data) {
            userModel.find({id: socket.userId}, function (err, users) {
                if (err) return handleError(err);
                users[0].password = Buffer.from(data).toString('base64');
                save(users[0]);
            });
        });  

        socket.on("set-avatar", function (data) {
            fetchUsers().then((users) => {
                users[socket.userId].avatar = data;
                io.emit('avatar-change', {
                    userId: socket.userId,
                    newAvatar: users[socket.userId].avatar
                });
                userModel.find({id: socket.userId}, function (err, users) {
                    if (err) return handleError(err);
                    users[0].avatar = data;
                    save(users[0]);
                });
            })
        });
        
        socket.on("check-key", function(key, callback) {
            fetchUsers().then((users) => {
                if (key === "ninjacat") {
                    console.log(users[socket.userId].userName + " became an admin!")
                    users[socket.userId].admin = true;
                    io.emit("users", users);
                    userModel.find({id: socket.userId}, function (err, users) {
                        if (err) return handleError(err);
                        users[0].admin = true;
                        save(users[0]);
                    });
                    
                    callback(true);
                }
                else {
                    callback(false);
                }
            })
        });

        socket.on('join', function (roomName, private, callback) {
            fetchRooms().then((rooms) => {
                fetchUsers().then((users) => {
                    if (!roomExists(rooms, roomName)) {
                        let newRoom = {name: roomName, private: private}
                        socket.broadcast.emit('new-room', newRoom);
                        var newRoomInstance = new roomModel(newRoom);
                        save(newRoomInstance);
                        if (callback)
                            callback(newRoom);
                    }
                    users[socket.userId].currentRoom = roomName;
                    io.emit("users", users);
                    socket.join(roomName);
                    userModel.find({id: socket.userId}, function (err, users) {
                        if (err) return handleError(err);
                        users[0].currentRoom = roomName;
                        save(users[0]);
                    });
                })
            })
        })

        socket.on("new-room", function (newRoomName) {
            io.emit('new-room', {name: newRoomName});
            var newRoomInstance = new roomModel({name: newRoomName});
            save(newRoomInstance);
        })

        socket.on("new-message", function (message) {
            fetchUsers().then((users) => {
                const dateTime = new Date();
                const newMessage = {
                    userId: socket.userId,
                    message: message,
                    type: "text",
                    dateTime: dateTime,
                    room: users[socket.userId].currentRoom,
                    edited: false,
                    deleted: false
                };
                if (message.indexOf('.png') > -1 || message.indexOf('.jpg') > -1 || message.indexOf('.jpeg') > -1 || message.indexOf('.gif') > -1 || message.indexOf('data:image/png;base64,') > -1) {
                    newMessage.type = "image";
                }
                io.to(newMessage.room).emit('new-message', newMessage);
                var newMessageInstance = new messageModel(newMessage);
                save(newMessageInstance);
                io.emit('room-last-update', {name: users[socket.userId].currentRoom, newDateTime: dateTime});
                roomModel.find({name: users[socket.userId].currentRoom}, function (err, rooms) {
                    if (err) return handleError(err);
                    rooms[0].lastUpdate = dateTime;
                    save(rooms[0]);
                });
            })
        })

        socket.on("edit-message", function (data) {
            fetchMessages().then((messages) => {
                fetchUsers().then((users) => {
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
                        save(messages[0]);
                    });
                })
            });
        })

        socket.on("remove-message", function (data) {
            fetchMessages().then((messages) => {
                fetchUsers().then((users) => {
                    var _message = messages.filter((message) => {
                        return message.room == users[socket.userId].currentRoom;
                    })[data]
                    _message.deleted = true;
                    io.to(users[socket.userId].currentRoom).emit('removed-message', data);
                    messageModel.find({_id: _message._id}, function (err, messages) {
                        if (err) return handleError(err);
                        messages[0].deleted = true;
                        save(messages[0]);
                    });
                })
            });
        })

        socket.on("user-typing", function (data) {
            fetchUsers().then((users) => {
                //console.log(users[socket.userId].userName.split('/')[0] + ' is typing...');
                socket.broadcast.to(users[socket.userId].currentRoom).emit('user-typing', socket.userId);
            })
        })
    }

    socket.on('disconnect', function() {
        fetchUsers().then((users) => {
            console.log(socket.userId + ' disconnected');
            if (users[socket.userId]) {
                users[socket.userId].online = false;
                io.emit("users", users);
                userModel.find({id: socket.userId}, function (err, users) {
                    if (err) return handleError(err);
                    users[0].online = false;
                    save(users[0]);
                });
            }
        })
    });
});

function roomExists(rooms, roomName) {
    let found;
    rooms.forEach((room) => {
        if (room.name == roomName) {
            found = room;
        }
    })
    return found ? true : false;
}

app.use(virtualDirPath, express.static(__dirname + '/build'));

app.get(virtualDirPath + '/', function(req, res) {
    res.sendFile(__dirname + '/build/index.html');
});

var port = process.env.PORT || 8181;
http.listen(port, function() {
    console.log('listening on *:' + port);
});