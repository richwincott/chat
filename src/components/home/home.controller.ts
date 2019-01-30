export default class HomeCtrl {
    public loggedIn = false;
    public isLoading = false;

    public userName;
    public id;
    public password = "";
    public isExistingUser: boolean = false;

    public defaultAvatar = this.userService.defaultAvatar;
    public signUpError;
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
            this.id = localStorage.getItem('id');
            this.isExistingUser = true;
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

    public forgetMe() {
        localStorage.removeItem('id');
        this.isExistingUser = false;
    }

    public login() {
        this.isLoading = true;
        this.loginError = "";
        this.socketService.request('login', { 
            id: parseInt(localStorage.getItem('id')),
            password: this.password
        }).then((data) => {
            if (data) {
                this.loggedIn = true;
                this.isLoading = false;
                
                localStorage.setItem('id', data.id);
                data.password = atob(data.password);
                this.userService.setUser(data);
            } else {
                this.isLoading = false;
                this.loginError = "Incorrect password, please try again.";
                this.password = "";
            }
        });
    }

    public signUp() {
        if (this.userName && this.userName.length > 0) {
            this.isLoading = true;
            this.signUpError = "";
            this.socketService.socket().emit('new-user', { username: this.userName }, (data) => {
                if (data) {
                    this.loggedIn = true;
                    this.isLoading = false;

                    localStorage.setItem('id', data.id);
                    this.userService.setUser(data);
                }
                else {
                    this.isLoading = false;
                    this.signUpError = "That username is already taken, please try another.";
                    this.userName = "";
                }
                this.$scope.$apply();
            });
        }
    }
}