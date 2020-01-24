import './components/index/index';
import AppConfig from './app.routes';
import Config from './app.config';
import SocketService from './services/socket.service';
import UserService from './services/user.service';
import ChatService from './services/chat.service';
//import './styles/index.scss';

declare var angular: any;

angular.module("chat", ['ui.bootstrap', 'ui.router', 'naif.base64', 'angularMoment', 'index'])
    .config(AppConfig)
    .service('socketService', SocketService)
    .service('userService', UserService)
    .service('chatService', ChatService)
    .factory('config', Config);

angular.bootstrap(document.getElementById('app'), ['chat']);