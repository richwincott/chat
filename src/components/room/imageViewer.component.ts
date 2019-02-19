let imageViewerHTML = require('./imageViewer.html');

class ImageViewer {

    static $inject = ['$uibModal', 'chatService', '$state', '$stateParams'];

    constructor(
        private $uibModal: ng.ui.bootstrap.IModalService,
        private chatService,
        private $state: ng.ui.IStateService,
        private $stateParams: ng.ui.IStateParamsService
    ) {}

    get users() {
        return this.chatService.users;
    }

    get messages(): any[] {
        return this.chatService.messages;
    }

    $onInit() {
        let message, user;

        switch(this.$stateParams.type) {
            case 'message':
                message = this.messages.filter((message) => message._id == this.$stateParams.id)[0];
                break;
            case 'avatar':
                user = this.userById(this.$stateParams.id);
                break;
        }

        this.$uibModal.open({
            animation: true,
            templateUrl: imageViewerHTML,
            size: 'sm',
            bindToController: true,
            controllerAs: '$ctrl',
            resolve: {
                type: () => this.$stateParams.type,
                selected: message ? message : user,
                users: this.users
            },
            controller: ['type', 'selected', 'users', 'userService', function(type, selected, users, userService) {
                this.type = type;
                this.users = users;
                this.selected = selected;
                this.defaultAvatar = userService.defaultAvatar;
            }]
        }).result.then(() => {
            // closed the modal
            this.goUpOneState();
        }, () => {
            // cancelled the modal
            this.goUpOneState();
        });
    }

    public userById(id) {
        if (this.users) {
            return this.users[parseInt(id)];
        }
    }

    private goUpOneState() {
        this.$state.go('^');
    }
}

export const ImageViewerComponent = {
    controllerAs: '$ctrl',
    controller: ImageViewer
}