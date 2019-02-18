let messageViewerHTML = require('./imageViewer.html');

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
        let message = this.messages.filter((message) => message._id == this.$stateParams.messageId)[0];

        this.$uibModal.open({
            animation: true,
            templateUrl: messageViewerHTML,
            size: 'sm',
            bindToController: true,
            controllerAs: '$ctrl',
            resolve: {
                selected: message,
                users: this.users
            },
            controller: ['selected', 'users', function(selected, users) {
                this.users = users;
                this.selected = selected;
            }]
        }).result.then(() => {
            // closed the modal
            this.goUpOneState();
        }, () => {
            // cancelled the modal
            this.goUpOneState();
        });
    }

    private goUpOneState() {
        this.$state.go('^');
    }
}

export const ImageViewerComponent = {
    controllerAs: '$ctrl',
    controller: ImageViewer
}