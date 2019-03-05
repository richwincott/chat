let userTooltip = require('./userTooltip.html');

interface IGiphyResponse {
    data: {
        data: {}[]
    }
}

interface IConfig {
    giphyApiKey: string
}

export default class RoomCtrl {
    public notifyMe = false;
    public editingMessage = -1;
    public showDeleted = false;
    public defaultAvatar;
    public userTooltip;

    public message;
    public uploadedPictureObject = {
        base64: ""
    };

    public gif;
    public giphy_query = "";
    public giphy_offset = 0;
    public giphy_show = false;

    private lastKeyPress = this.moment();

    static $inject = ["$scope", "$http", "$state", "$stateParams", "$timeout", "userService", "chatService", "socketService", "config", "moment"];

    constructor(
        private $scope: ng.IScope,
        private $http: ng.IHttpService,
        private $state: ng.ui.IStateService,
        private $stateParams: ng.ui.IStateParamsService,
        private $timeout: ng.ITimeoutService,
        private userService,
        private chatService,
        private socketService,
        private config: IConfig,
        private moment
    ) {
        this.$scope.$watch(() => this.uploadedPictureObject.base64, (newValue, oldValue) => {
            if (newValue != oldValue) {
                this.message = 'data:image/png;base64,' + newValue;
                this.send();
            }
        })
    }

    get me() {
        return this.userService.user;
    }

    get users() {
        return this.chatService.users;
    }

    get dates() {
        return this.chatService.dates;
    }

    get messages() {
        return this.chatService.messages;
    }

    get typing() {
        return this.chatService.typing;
    }

    $onInit() {
        this.defaultAvatar = this.userService.defaultAvatar;
        this.userTooltip = userTooltip;
        
        if (!this.associatedUser(this.$stateParams.roomName)) {
            this.me.currentRoom = "General";
            this.$state.go('index.home.room', {roomName: "General"});
        } else {
            this.socketService.socket().emit('join', this.$stateParams.roomName, this.$stateParams.private);
            this.chatService.fetchMessages(this.$stateParams.roomName);
        }        
    }

    public userTyping() {
        if (this.lastKeyPress < this.moment().subtract(3, 'seconds')) {
            this.lastKeyPress = this.moment();
            this.chatService.userIsTyping();
        }
    }

    private associatedUser(roomName) {
        if (roomName.indexOf(':') > -1) { // ie private, refactor this later to user private property on room
            return roomName.split(':').indexOf(this.me.id.toString()) > -1 ? true : false;
        } else {
            return true;
        }
    }

    public fetchGif() {
        this.giphy_offset++;
        this.$http.get('http://api.giphy.com/v1/gifs/search?q=' + this.giphy_query + '&api_key=' + this.config.giphyApiKey + '&limit=1&rating=r&offset=' + (this.giphy_offset - 1))
            .then((response: ng.IHttpResponse<IGiphyResponse>) => {
                this.gif = response.data.data[0];
            })
    }

    public sendGif() {
        this.message = this.gif.images.downsized.url;
        this.send();
        this.gif = undefined;
        this.giphy_query = "";
        this.giphy_show = false;
    }

    public cancelGif() {
        this.gif = undefined;
        this.giphy_query = "";
        this.giphy_show = false;
        this.message = "";
    }

    public send() {
        this.gif = undefined;
        if (this.message.indexOf('/giphy ') > -1) {
            this.giphy_query = this.message.split('/giphy ')[1];
            this.giphy_offset = 0;
            this.giphy_show = true;
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
        this.chatService.formatMessages(true);
    }

    public openUploadDialog() {
        this.simulateClick(document.getElementsByClassName("pictureUpload").item(0));
    }

    private simulateClick(elem) {
        // Create our event (with options)
        var evt = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        // If cancelled, don't dispatch our event
        var canceled = !elem.dispatchEvent(evt);
    };

    public openImage(message) {
        this.$state.go('index.home.room.image', {type: 'message', id: message._id});
    }

    scrollToBottom = () => {
        this.$timeout(() => {
            if (document.getElementsByClassName("messages").item(0)) {
                document.getElementsByClassName("messages").item(0).scrollTo(0, document.getElementsByClassName("messages").item(0).scrollHeight);
            }
        }, 100);
    }
}