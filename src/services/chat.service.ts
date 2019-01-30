export default class ChatService {
    public users;
    public messages;
    public rooms;
    public dates = [];

    static $inject = ["$rootScope", "socketService"];

    constructor(
        private $rootScope,
        private socketService
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

        this.socketService.socket().on('new-message', (data) => {
            this.messages.push(data);
            this.formatMessages();
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
            this.formatMessages(true);
        });
    }

    public formatMessages(clear?) {
        if (clear) {
            this.dates = [];
        }
        this.messages.forEach((message) => {
            if (!message.deleted && this.dates.indexOf(message.dateTime.split('T')[0]) == -1) {
                this.dates.push(message.dateTime.split('T')[0]);
            }
        })
    }
}