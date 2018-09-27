app.service('socketService', function () { 

    var _socket;

    this.socket = () => {
        if (!_socket) {
            _socket = io();
        }

        return _socket;
    };

 });