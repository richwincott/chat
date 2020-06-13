import { BaseController } from "../../app.base.controller";

let sidebarHtml = require('./sidebar.html');
let editProfileHTML = require('./editProfile.html');

class SidebarCtrl extends BaseController {
    public showOffline = false;
    public tabState = "rooms";
    public showAdminLogin = true;
    public showAddRoom: boolean = false;

    static $inject = ['$injector', '$scope', '$state', '$stateParams', '$uibModal'];

    constructor(
        $injector,
        private $scope: ng.IScope,
        private $state: ng.ui.IStateService,
        private $stateParams: ng.ui.IStateParamsService,
        private $uibModal: ng.ui.bootstrap.IModalService
    ) {
        super($injector);
    }

    get roomName() {
        return this.$stateParams.roomName;
    }

    $onInit() {
        if (this.me.admin) {
            this.showAdminLogin = false;
            this.showOffline = true;
        };

        this.$scope.$on('new-room', () => {
            this.showAddRoom = false;
        })

        let dateTimeNow = new Date();
        this.rooms.forEach((room) => {
            room.lastAccessed = dateTimeNow;
        });
    }

    public openEditProfile() {
        this.$uibModal.open({
            animation: true,
            templateUrl: editProfileHTML,
            size: 'sm',
            bindToController: true,
            controllerAs: '$ctrl',
            resolve: {
                me: this.me,
                showAdminLogin: this.showAdminLogin
            },
            controller: 'EditProfileCtrl'
        }).result.then(() => {
            // closed the modal
        }, () => {
            // cancelled the modal
        });
    }

    public openAvatar(user) {
        this.$state.go('index.home.room.image', {type: 'avatar', id: user.id});
    }
    
    public selectRoom(roomName, priv?) {
        if (priv && roomName.split(':')[1] == this.me.id) {
            return;
        }

        //this.chatService.roomByName(this.me.currentRoom).lastAccessed = new Date();

        let params = {
            roomName: roomName,
            private: priv
        }
        if (priv) {
            this.tabState = "rooms";
        }
        this.$state.go('index.home.room', params);
    }

    public userById(id) {
        if (this.users) {
            return this.users[parseInt(id)];
        }
    }

    public offlineUserCount() {
        let count = 0;
        for (let key in this.users) {
            if (!this.users[key].online) {
                count++;
            }
        };
        return count;
    }

    public objectLength(obj) {
        return Object.keys(obj).length;
    }

    public dateCheck(room) {
        return new Date(room.lastUpdate) > room.lastAccessed;
    }
}

export const SidebarComponent = {
    templateUrl: sidebarHtml,
    controllerAs: '$ctrl',
    controller: SidebarCtrl
}