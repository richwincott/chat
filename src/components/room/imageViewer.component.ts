let imageViewerHTML = require('./imageViewer.html');

class ImageViewer {

    static $inject = ['$uibModal', 'chatService', '$state', '$stateParams'];

    constructor(
        private $uibModal: ng.ui.bootstrap.IModalService,
        private chatService,
        private $state: ng.ui.IStateService,
        private $stateParams: ng.ui.IStateParamsService
    ) {}

    $onInit() {
        this.$uibModal.open({
            animation: true,
            templateUrl: imageViewerHTML,
            bindToController: true,
            controllerAs: '$ctrl',
            resolve: {
                id: () => this.$stateParams.id,
                type: () => this.$stateParams.type
            },
            controller: class InnerImageViewer {
                public selected;

                $inject: string[] = ['$scope', 'id', 'type', 'userService', 'chatService'];
                
                constructor(
                    private $scope: ng.IScope,
                    private id,
                    public type,
                    private userService,
                    private chatService
                ) {
                    this.$scope.$watch(() => { 
                        return {
                            messages: this.messages,
                            users: this.users
                        }
                    }, this.dataChanged.bind(this), true);
                }

                get users() {
                    return this.chatService.users;
                }

                get messages() {
                    return this.chatService.messages;
                }

                get defaultAvatar() {
                    return this.userService.defaultAvatar;
                }

                private dataChanged(newValue, oldValue) {
                    if (newValue.messages.length > 0 && Object.keys(newValue.users).length > 0) {
                        this.setSelected();
                    }
                }

                public setSelected() {
                    switch(this.type) {
                        case 'message':
                            this.selected = this.messages.filter((message) => message._id == this.id)[0];
                            break;
                        case 'avatar':
                            this.selected = this.userById(this.id);
                            break;
                    }
                }

                public userById(id) {
                    if (this.users) {
                        return this.users[parseInt(id)];
                    }
                }

            }
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