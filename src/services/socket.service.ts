const io = require('../../node_modules/socket.io-client');

export default class SocketService { 
    private _socket;

    static $inject = ["$q", "$interval", "config"];

    constructor(
        private $q,
        private $interval,
        private config
    ) {
        this._socket = new io((config.socketHostName ? config.socketHostName : window.location.hostname) + ':' + config.socketPort);

        $interval(() => {
            this._socket.emit('ping');
        }, 30 * 1000);
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