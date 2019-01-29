import { ui } from "angular";

let sidebarHtml = require('./sidebar.html');
let editProfileHTML = require('./editProfile.html');
let addRoomHTML = require('./addRoom.html');
let avatarHTML = require('./avatar.html');

class SidebarCtrl {
    public showOffline = false;
    public tabState = "rooms";
    public showAdminLogin = true;
    public roomName = this.$stateParams.roomName;
    public defaultAvatar = this.userService.defaultAvatar;

    static $inject = ['userService', 'chatService', '$state', '$stateParams', '$uibModal'];

    constructor(
        private userService,
        private chatService,
        private $state: ng.ui.IStateService,
        private $stateParams: ng.ui.IStateParamsService,
        private $uibModal: ui.bootstrap.IModalService
    ) {}

    get me() {
        return this.userService.user;
    }

    get users() {
        return this.chatService.users;
    }

    get rooms() {
        return this.chatService.rooms;
    }

    $onInit() {
        if (this.me.admin) {
            this.showAdminLogin = false;
        };
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
        this.$uibModal.open({
            animation: true,
            templateUrl: avatarHTML,
            size: 'sm',
            bindToController: true,
            controllerAs: '$ctrl',
            resolve: {
                selected: user
            },
            controller: function(selected, userService) {
                this.defaultAvatar = userService.defaultAvatar;
                this.selected = selected;
            }
        }).result.then(() => {
            // closed the modal
        }, () => {
            // cancelled the modal
        });
    }

    public openAddRoom() {
        this.$uibModal.open({
            animation: true,
            templateUrl: addRoomHTML,
            size: 'sm',
            bindToController: true,
            controllerAs: '$ctrl',
            controller: function(socketService, $uibModalInstance) {
                this.socketService = socketService;
                this.newRoomName;

                this.createRoom = function () {
                    if (this.newRoomName.length > 0) {
                        this.socketService.socket().emit('new-room', this.newRoomName);
                        this.newRoomName = "";
                        $uibModalInstance.close();
                        // $uibModalInstance.dismiss('cancel');
                    }
                }
            }
        }).result.then(() => {
            // closed the modal
        }, () => {
            // cancelled the modal
        });
    }
    
    public selectRoom(roomName) {
        this.roomName = roomName;
        this.me.currentRoom = roomName;
        this.$state.go('index.home.room', {roomName: roomName});
    }
}

export const SidebarComponent = {
    templateUrl: sidebarHtml,
    controllerAs: '$ctrl',
    controller: SidebarCtrl
}