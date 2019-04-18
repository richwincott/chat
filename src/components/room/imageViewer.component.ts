import { BaseController } from "../../app.base.controller";

let imageViewerHTML = require('./imageViewer.html');

class ImageViewer {

    static $inject = ['$uibModal', '$state', '$stateParams'];

    constructor(
        private $uibModal: ng.ui.bootstrap.IModalService,
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
            controller: class InnerImageViewer extends BaseController {
                public selected;

                static $inject: string[] = ['$injector', '$scope', 'id', 'type'];
                
                constructor(
                    $injector,
                    private $scope: ng.IScope,
                    private id,
                    public type
                ) {
                    super($injector);
                    this.$scope.$watch(() => { 
                        return {
                            messages: this.messages,
                            users: this.users
                        }
                    }, this.dataChanged.bind(this), true);
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