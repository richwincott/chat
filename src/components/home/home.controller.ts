import { BaseController } from "../../app.base.controller";

export default class HomeCtrl extends BaseController {
    public loggedIn = false;
    public isLoading = true;

    public userName;
    public ids = [];
    public password = "";
    public isExistingUser: boolean = false;
    public loginUserList = {};
    public selectedUser;

    public signUpError;
    public loginError;
    
    static $inject = ["$injector", "$scope", "$state", "socketService", "$uibModal"];

    constructor(
        $injector,
        private $scope: ng.IScope,
        private $state: ng.ui.IStateService,
        private socketService,
        private $uibModal: ng.ui.bootstrap.IModalService
    ) {
        super($injector);
    }

    $onInit() {
        if (this.$state.current.name === "index.home") {
            this.me.currentRoom = "General";
            this.$state.go('index.home.room', {roomName: "General"});
        }

        if (localStorage.getItem('ids') !== null) {
            this.ids = JSON.parse(localStorage.getItem('ids'));
            this.isExistingUser = true;
            this.ids.forEach((id) => {
                this.socketService.request('fetch-user', id).then((user) => {
                    this.loginUserList[id] = user;
                    if (this.ids.length == 1) {
                        this.selectedUser = user;
                    }
                    this.isLoading = false;
                })
            })
        } else {
            this.isLoading = false;
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

    public forgetMe(id) {
        this.loginError = "";
        this.ids.splice(this.ids.indexOf(id), 1);
        delete this.loginUserList[id];
        localStorage.setItem('ids', JSON.stringify(this.ids));
        if (this.ids.length == 0) {
            this.isExistingUser = false;
        }
        this.selectedUser = null;
    }

    public login(id) {
        if (this.selectedUser) {
            this.isLoading = true;
            this.loginError = "";
            this.socketService.request('login', { 
                id: parseInt(id),
                password: this.password
            }).then((data) => {
                if (data) {
                    this.loggedIn = true;
                    this.isLoading = false;
                    
                    data.password = atob(data.password);
                    this.userService.setUser(data);
                } else {
                    this.isLoading = false;
                    this.loginError = "Incorrect password, please try again.";
                    this.password = "";
                }
            });
        } else {
            this.loginError = "Please select an account first.";
        }
    }

    public signUp() {
        this.loginError = "";
        if (this.userName && this.userName.length > 0) {
            this.isLoading = true;
            this.signUpError = "";
            this.socketService.socket().emit('new-user', { username: this.userName }, (data) => {
                if (data) {
                    this.loggedIn = true;
                    this.isLoading = false;

                    this.ids.push(data.id)
                    localStorage.setItem('ids', JSON.stringify(this.ids));
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