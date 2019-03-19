export class BaseController {
    public userService;
    public chatService;
    public defaultAvatar;

    constructor(
        private $injector, 
    ) {
        this.userService = this.$injector.get('userService');
        this.chatService = this.$injector.get('chatService');
        this.defaultAvatar = this.userService.defaultAvatar;
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

    get dates() {
        return this.chatService.dates;
    }

    get messages() {
        return this.chatService.messages;
    }

    get typing() {
        return this.chatService.typing;
    }
}