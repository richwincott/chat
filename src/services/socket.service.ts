const io = require('../../node_modules/socket.io-client');

export default class SocketService { 
    private _socket;

    static $inject = ["$q", "$rootScope"];

    constructor(
        private $q,
        private $rootScope
    ) {
        this._socket = new io('http://127.0.0.1:3003');
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