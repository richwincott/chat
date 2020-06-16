import { Socket } from "socket.io";

const io = require('../../node_modules/socket.io-client');

export default interface ISocketService {
    socket(): Socket;
    request(event: String, data?: any): Promise<any>;
}

export default class SocketService implements ISocketService { 
    private _socket: Socket;

    static $inject = ["$q", "$interval", "config"];

    constructor(
        private $q,
        private $interval,
        private config
    ) {
        //this._socket = new io((config.socketHostName ? config.socketHostName : window.location.hostname) + ':' + config.socketPort);
		
		var address = window.location.protocol + '//' + window.location.host;  
		var details = {  
			path: process.env.NODE_ENV === 'development' ? '/socket.io' : '/chat/socket.io'		
		};
		
		this._socket = io.connect(address, details); 	

        $interval(() => {
            this._socket.emit('ping');
        }, 30 * 1000);
    }

    public socket(): Socket {
        return this._socket;
    }

    public request(event, data?): Promise<any> {
        var defer = this.$q.defer();
        this.socket().emit(event, data, function(d) {
            defer.resolve(d);
        });
        return defer.promise;
    }
}