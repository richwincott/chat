const io = require('../../node_modules/socket.io-client');

export default class SocketService { 
    private _socket;

    static $inject = ["$q", "$rootScope", "config"];

    constructor(
        private $q,
        private $rootScope,
        private config
    ) {
        this._socket = new io((config.socketHostName ? config.socketHostName : window.location.hostname) + ':' + config.socketPort);
    }

    public socket() {
        return this._socket;
    }

    public request(event, data?) {
        var defer = this.$q.defer();
        this.socket().emit(event, data, function(d) {
            defer.resolve(d);
        });
        return defer.promise;
    }
}