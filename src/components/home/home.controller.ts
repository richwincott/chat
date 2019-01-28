export default class HomeCtrl {
    public loggedIn = false;
    public isLoading = true;
    public userName;
    public me = this.userService.user;
    public rooms = [];
    public users = [];
    
    public defaultAvatar = this.userService.defaultAvatar;
    public error;
    
    static $inject = ["$scope", "$timeout", "userService", "socketService", "$uibModal"];

    constructor(
        private $scope,
        private $timeout,
        private userService,
        private socketService,
        private $uibModal
    ) {
    
    }

    $onInit() {
        // important first clear any listeners registered in this controller to maintain a single instance of each
        this.socketService.socket().removeListener('new-room');
        this.socketService.socket().removeListener('users');

        this.ping();

        this.$scope.$watch(() => {return this.userService.user}, (newValue, oldValue) => {
            this.me = newValue;
        })
    
        this.socketService.request('fetch-rooms').then((rooms) => {
            this.rooms = rooms;
        });
        this.socketService.request('fetch-users').then((users) => {
            this.users = users;
        });

        this.socketService.socket().on('users', (data) => {
            this.users = data;
            this.$scope.$apply();
        })
    
        if (localStorage.getItem('id') !== null) {
            this.socketService.request('login', { id: parseInt(localStorage.getItem('id')) }).then((data) => {
                this.loggedIn = true;
                this.isLoading = false;
                
                localStorage.setItem('id', data.id);
    
                this.userService.setUser(data);
            
                this.socketService.socket().on('new-room', (data) => {
                    this.rooms.push(data);
                    this.$scope.$apply();
                })
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

    private ping() {
        this.$timeout(() => {
            this.socketService.socket().emit('ping');
            this.ping();
        }, 5000);
    }

    public login() {
        if (this.userName && this.userName.length > 0) {
            this.socketService.socket().emit('new-user', { username: this.userName }, (data) => {
                if (data) {
                    this.loggedIn = true;
                    this.isLoading = false;
                }
                else {
                    this.error = "That username is already taken, please try another.";
                    this.userName = "";
                }
                this.$scope.$apply();
            });
        }
    }
}