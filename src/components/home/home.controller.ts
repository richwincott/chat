export default class HomeCtrl {
    public loggedIn = false;
    public isLoading = false;
    public userName;

    public defaultAvatar = this.userService.defaultAvatar;
    public loginError;
    
    static $inject = ["$scope", "$state", "userService", "chatService", "socketService", "$uibModal"];

    constructor(
        private $scope: ng.IScope,
        private $state: ng.ui.IStateService,
        private userService,
        private chatService,
        private socketService,
        private $uibModal: ng.ui.bootstrap.IModalService
    ) {
    
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
        if (this.$state.current.name === "index.home") {
            this.me.currentRoom = "General";
            this.$state.go('index.home.room', {roomName: "General"});
        }

        if (localStorage.getItem('id') !== null) {
            this.isLoading = true;
            this.socketService.request('login', { id: parseInt(localStorage.getItem('id')) }).then((data) => {
                this.loggedIn = true;
                this.isLoading = false;
                
                localStorage.setItem('id', data.id);
                this.userService.setUser(data);
            });
        }
    }

    public openSidebar() {
        this.$uibModal.open({
            animation: true,
            size: 'sm',
            template: '<sidebar></sidebar>'
        }).result.then(() => {
            // closed the modal
        }, () => {
            // cancelled the modal
        });
    }

    public login() {
        if (this.userName && this.userName.length > 0) {
            this.isLoading = true;
            this.loginError = "";
            this.socketService.socket().emit('new-user', { username: this.userName }, (data) => {
                if (data) {
                    this.loggedIn = true;
                    this.isLoading = false;

                    localStorage.setItem('id', data.id);
                    this.userService.setUser(data);
                }
                else {
                    this.isLoading = false;
                    this.loginError = "That username is already taken, please try another.";
                    this.userName = "";
                }
                this.$scope.$apply();
            });
        }
    }
}