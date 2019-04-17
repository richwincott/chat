export default class ChatService {
    public users;
    public messages;
    public rooms;
    public dates = [];
    public typing = [];

    static $inject = ["$rootScope", "socketService", "userService", "$timeout"];

    constructor(
        private $rootScope,
        private socketService,
        private userService,
        private $timeout: ng.ITimeoutService
    ) {
        // requests
        this.socketService.request('fetch-users').then((users) => {
            this.users = users;
        });

        this.socketService.request('fetch-rooms').then((rooms) => {
            this.rooms = rooms;
        });



        // listeners
        this.socketService.socket().on('users', (data) => {
            this.users = data;
            this.$rootScope.$apply();
        });

        this.socketService.socket().on('rooms', (data) => {
            this.rooms = data;
            this.$rootScope.$apply();
        });

        this.socketService.socket().on('new-room', (data) => {
            this.rooms.push(data);
            this.$rootScope.$broadcast('new-room');
            this.$rootScope.$apply();
        });
        
        this.socketService.socket().on('room-last-update', (data) => {
            this.rooms.forEach((room) => {
                if (room.name == data.name) {
                    room.lastUpdate = data.newDateTime;
                }
            });
            this.$rootScope.$apply();
        });

        this.socketService.socket().on('new-message', (data) => {
            this.messages.push(data);
            this.formatMessages();
            this.$rootScope.$broadcast('scroll-to-bottom');
            this.$rootScope.$apply();
        })

        this.socketService.socket().on('edited-message', (data) => {
            this.messages[data.index].message = data.newMessage;
            this.messages[data.index].edited = true;
            this.formatMessages();
            this.$rootScope.$apply();
        })

        this.socketService.socket().on('removed-message', (data) => {
            this.messages[data].deleted = true;
            this.formatMessages();
            this.$rootScope.$apply();
        })

        this.socketService.socket().on('user-typing', (data) => {
            this.typing.push(data);
            this.$timeout(() => {
                this.typing.splice(this.typing.indexOf(data), 1);
            }, 3000);
            this.$rootScope.$apply();
        });



        // profile stuff
        this.socketService.socket().on('username-change', (data) => {
            for (let key in this.users) {
                if (key == data.userId) {
                    this.users[key].userName = data.newName;
                }
            };
            this.$rootScope.$apply();
        })

        this.socketService.socket().on('avatar-change', (data) => {
            for (let key in this.users) {
                if (key == data.userId) {
                    this.users[key].avatar = data.newAvatar;
                }
            };
            this.$rootScope.$apply();
        })
    }

    public fetchMessages(roomName) {
        this.messages = [];
        this.dates = [];
        this.socketService.request('fetch-messages', roomName).then((data) => {
            this.messages = data;
            this.formatMessages();
            this.$rootScope.$broadcast('scroll-to-bottom');
        });
    }

    public userIsTyping() {
        this.socketService.request('user-typing');
    }

    public formatMessages() {
        this.dates = [];
        this.messages.forEach((message) => {
            if ((!message.deleted || this.userService.user.admin) && this.dates.indexOf(message.dateTime.split('T')[0]) == -1) {
                this.dates.push(message.dateTime.split('T')[0]);
            }
        })
    }
}