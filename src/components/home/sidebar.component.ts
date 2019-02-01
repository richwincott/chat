let sidebarHtml = require('./sidebar.html');
let editProfileHTML = require('./editProfile.html');
let addRoomHTML = require('./addRoom.html');
let avatarHTML = require('./avatar.html');

class SidebarCtrl {
    public showOffline = false;
    public tabState = "rooms";
    public showAdminLogin = true;
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

    get roomName() {
        return this.$stateParams.roomName;
    }

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
    
    public selectRoom(roomName, priv?) {
        if (priv && roomName.split(':')[1] == this.me.id) {
            return;
        }

        this.roomByName(this.me.currentRoom).lastAccessed = new Date();

        let params = {
            roomName: roomName,
            private: priv
        }
        this.me.currentRoom = roomName;
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

    public dateCheck(room) {
        return new Date(room.lastUpdate) > room.lastAccessed;
    }

    private roomByName(roomName) {
        let match;
        this.rooms.forEach((room) => {
            if (room.name == roomName) {
                match = room;
            }
        });
        return match;
    }
}

export const SidebarComponent = {
    templateUrl: sidebarHtml,
    controllerAs: '$ctrl',
    controller: SidebarCtrl
}