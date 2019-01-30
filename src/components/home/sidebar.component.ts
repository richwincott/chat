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
    public showAddRoom: boolean = false;

    static $inject = ['$scope', 'userService', 'chatService', '$state', '$stateParams', '$uibModal'];

    constructor(
        private $scope: ng.IScope,
        private userService,
        private chatService,
        private $state: ng.ui.IStateService,
        private $stateParams: ng.ui.IStateParamsService,
        private $uibModal: ng.ui.bootstrap.IModalService
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

        this.$scope.$on('new-room', () => {
            this.showAddRoom = false;
        })
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