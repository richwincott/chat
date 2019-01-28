export default class EditProfile {
    public defaultAvatar = this.userService.defaultAvatar;
    public adminError = {
        success: true,
        message: ""
    };
    public uploadedAvatarObject = {};
    public adminKey;

    static $inject = ['$scope', '$uibModalInstance', 'socketService', 'userService', '$timeout', 'me', 'showAdminLogin'];

    constructor(
        private $scope, 
        private $uibModalInstance, 
        private socketService, 
        private userService, 
        private $timeout, 
        public me, 
        public showAdminLogin
    ) {}

    $onInit() {
        this.$scope.$watch(() => this.uploadedAvatarObject, (newValue, oldValue) => {
            if (newValue != oldValue) {
                this.me.avatar = 'data:image/png;base64,' + newValue.base64;
                this.socketService.socket().emit('set-avatar', this.me.avatar);
            }
        })
    }

    public setName() {
        if (this.me.userName.length > 0) {
            this.socketService.socket().emit('set-name', this.me.userName)
        }
    }

    public checkKey() {
        if (this.adminKey && this.adminKey.length > 0) {
            this.adminError.message = "";
            this.socketService.socket().emit('check-key', this.adminKey, (result) => {
                if (result) {
                    this.adminError.success = true;
                    this.adminError.message = "Success: You are now an admin!"
                    this.me.admin = true;
                    this.adminKey = "";
                    this.$timeout(() => {
                        this.showAdminLogin = false;
                    }, 4000);
                }
                else {
                    this.adminError.success = false;
                    this.adminError.message = "Wrong key entered.."
                }
            })
        }
    }
}