import { IHttpResponse, ui } from "angular";

let viewImageHTML = require('./viewImage.html');

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

    public message;
    public uploadedPictureObject = {
        base64: ""
    }

    public gif;
    public giphy_query = "";
    public giphy_offset = 0;

    static $inject = ["$scope", "$http", "$stateParams", "$timeout", "userService", "chatService", "socketService", "config", "$uibModal"];

    constructor(
        private $scope: ng.IScope,
        private $http: ng.IHttpService,
        private $stateParams: ng.ui.IStateParamsService,
        private $timeout: ng.ITimeoutService,
        private userService,
        private chatService,
        private socketService,
        private config: IConfig,
        private $uibModal: ui.bootstrap.IModalService
    ) {
    
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

    $onInit() {
        this.defaultAvatar = this.userService.defaultAvatar;

        this.$scope.$watch(() => this.uploadedPictureObject, (newValue, oldValue) => {
            if (newValue != oldValue) {
                this.message = 'data:image/png;base64,' + newValue.base64;
                this.send();
            }
        })        

        this.socketService.socket().emit('join', this.$stateParams.roomName);
        this.chatService.fetchMessages();
    }

    public fetchGif() {
        this.gif = undefined;
        this.giphy_offset++;
        this.$http.get('http://api.giphy.com/v1/gifs/search?q=' + this.giphy_query + '&api_key=' + this.config.giphyApiKey + '&limit=1&offset=' + (this.giphy_offset - 1))
            .then((response: IHttpResponse<IGiphyResponse>) => {
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
        this.chatService.formatMessages(true);
    }

    public openUploadDialog() {
        document.getElementsByClassName(".pictureUpload").item[0].click();
    }

    public openImage(message) {
        this.$uibModal.open({
            animation: true,
            templateUrl: viewImageHTML,
            size: 'sm',
            bindToController: true,
            controllerAs: '$ctrl',
            resolve: {
                selected: message,
                users: this.users
            },
            controller: function(selected, users) {
                this.users = users;
                this.selected = selected;
            }
        }).result.then(() => {
            // closed the modal
        }, () => {
            // cancelled the modal
        });
    }

    scrollToBottom = () => {
        this.$timeout(() => {
            if (document.getElementsByClassName(".messages").item[0]) {
                document.getElementsByClassName(".messages").item[0].scrollTo(0, document.getElementsByClassName(".messages").item[0].scrollHeight);
            }
        }, 100);
    }
}