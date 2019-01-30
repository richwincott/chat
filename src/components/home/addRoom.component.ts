let addRoomHTML = require('./addRoom.html');

class AddRoom {
    private newRoomName;

    static $inject = ['socketService'];

    constructor(
        private socketService
    ) {}

    public createRoom() {
        if (this.newRoomName.length > 0) {
            this.socketService.socket().emit('new-room', this.newRoomName);
            this.newRoomName = "";
        }
    }
}

export const AddRoomComponent = {
    templateUrl: addRoomHTML,
    controllerAs: '$ctrl',
    controller: AddRoom
}