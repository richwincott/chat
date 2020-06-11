import { BaseController } from "../../app.base.controller";

export default class EditProfile extends BaseController {
    public adminError = {
        success: true,
        message: ""
    };
    public uploadedAvatarObject = {
        base64: ""
    };
    public adminKey;
    public newPassword = '';

    static $inject = ['$injector', '$scope', 'socketService', '$timeout', 'showAdminLogin'];

    constructor(
        $injector,
        private $scope: ng.IScope, 
        private socketService, 
        private $timeout: ng.ITimeoutService, 
        public showAdminLogin: boolean
    ) {
        super($injector);
        this.$scope.$watch(() => this.uploadedAvatarObject.base64, (newValue, oldValue) => {
            if (newValue != oldValue) {
                this.me.avatar = 'data:image/png;base64,' + newValue;
                this.socketService.socket().emit('set-avatar', this.me.avatar);
            }
        })
    }

    $onInit() {
        
    }

    public setName() {
        if (this.me.userName.length > 0) {
            this.socketService.socket().emit('set-name', this.me.userName)
        }
    }

    public setPassword() {
        if (this.newPassword.length > 0) {
            this.socketService.socket().emit('set-password', this.newPassword)
            this.newPassword = '';
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