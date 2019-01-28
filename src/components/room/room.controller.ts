export default class RoomCtrl {
    public notifyMe = false;
    public editingMessage = -1;
    public me;
    public showDeleted = false;
    public defaultAvatar;

    public message;
    public messages = [];
    public dates = [];
    public users = [];

    public gif;
    public giphy_query = "";
    public giphy_offset = 0;

    static $inject = ["$scope", "$http", "$state", "$stateParams", "$timeout", "userService", "socketService", "config"];

    constructor(
        private $scope,
        private $http,
        private $state,
        private $stateParams,
        private $timeout,
        private userService,
        private socketService,
        private config
    ) {
    
    }

    $onInit() {
        // important first clear any listeners registered in this controller to maintain a single instance of each
        this.socketService.socket().removeListener('new-message');
        this.socketService.socket().removeListener('edited-message');
        this.socketService.socket().removeListener('removed-message');
        this.socketService.socket().removeListener('username-change');
        this.socketService.socket().removeListener('avatar-change');

        this.me = this.userService.user;
        this.defaultAvatar = this.userService.defaultAvatar;
   
        this.$scope.$watch(() => {return this.userService.user}, (newValue, oldValue) => {
            this.me = newValue;
        })

        this.$scope.$watch('this.uploadedPictureObject', (newValue, oldValue) => {
            if (newValue != oldValue) {
                this.message = 'data:image/png;base64,' + newValue.base64;
                this.send();
            }
        })        

        this.socketService.socket().on('new-message', (data) => {
            this.messages.push(data);
            this.formatMessages();
            this.$scope.$apply();
            this.scrollToBottom();
        })

        this.socketService.socket().on('edited-message', (data) => {
            this.messages[data.index].message = data.newMessage;
            this.messages[data.index].edited = true;
            this.formatMessages();
            this.$scope.$apply();
        })

        this.socketService.socket().on('removed-message', (data) => {
            this.messages[data].deleted = true;
            this.formatMessages();
            this.$scope.$apply();
        })

        this.socketService.socket().on('username-change', (data) => {
            for (let key in this.users) {
                if (key == data.userId) {
                    this.users[key].userName = data.newName;
                }
            };
            this.$scope.$apply();
        })

        this.socketService.socket().on('avatar-change', (data) => {
            for (let key in this.users) {
                if (key == data.userId) {
                    this.users[key].avatar = data.newAvatar;
                }
            };
            this.$scope.$apply();
        })

        this.socketService.socket().emit('join', this.$stateParams.roomName);

        this.socketService.request('fetch-messages').then((data) => {
            this.messages = data;
            this.formatMessages();
            this.scrollToBottom();
        });

        this.socketService.request('fetch-users').then((users) => {
            this.users = users;
        });
    }

    public fetchGif() {
        this.gif = undefined;
        this.giphy_offset++;
        this.$http.get('http://api.giphy.com/v1/gifs/search?q=' + this.giphy_query + '&api_key=' + this.config.giphyApiKey + '&limit=1&offset=' + (this.giphy_offset - 1))
            .then((response) => {
                this.gif = response.data.data[0];
            })
    }

    public sendGif() {
        this.message = this.gif.images.downsized.url;
        this.send();
        this.gif = undefined;
        this.giphy_query = "";
    }

    public cancelGif() {
        this.gif = undefined;
        this.giphy_query = "";
        this.message = "";
    }

    public send() {
        this.gif = undefined;
        if (this.message.indexOf('/giphy ') > -1) {
            this.giphy_query = this.message.split('/giphy ')[1];
            this.giphy_offset = 0;
            this.fetchGif();
            return;
        }
        if (this.message.length > 0) {
            if (this.editingMessage > -1) {
                this.socketService.socket().emit('edit-message', {
                    newMessage: this.message,
                    index: this.editingMessage
                });
                this.message = "";
            }
            else {
                this.socketService.socket().emit('new-message', this.message);
                this.message = "";
            }
        }
        this.editingMessage = -1;
    }

    public editMessage(message) {
        this.editingMessage = this.messages.indexOf(message);
        this.message = this.messages[this.editingMessage].message;
    }

    public removeMessage(message) {
        this.socketService.socket().emit("remove-message", this.messages.indexOf(message));
    }

    public toggleDeleted() {
        this.showDeleted = !this.showDeleted
        this.formatMessages(true);
    }

    public openUploadDialog() {
        document.getElementsByClassName(".pictureUpload").item[0].click();
    }

    formatMessages = (clear?) => {
        if (clear) {
            this.dates = [];
        }
        this.messages.forEach((message) => {
            if ((!message.deleted || (this.me.admin && this.showDeleted)) && this.dates.indexOf(message.dateTime.split('T')[0]) == -1) {
                this.dates.push(message.dateTime.split('T')[0]);
            }
        })
    }

    scrollToBottom = () => {
        this.$timeout(() => {
            if (document.getElementsByClassName(".messages").item[0]) {
                document.getElementsByClassName(".messages").item[0].scrollTo(0, document.getElementsByClassName(".messages").item[0].scrollHeight);
            }
        }, 100);
    }
}