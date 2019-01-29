import './components/index/index';
import AppConfig from './app.config';
import SocketService from './services/socket.service';
import UserService from './services/user.service';
import ChatService from './services/chat.service';

declare var angular: any;

angular.module("chat", ['ui.bootstrap', 'ui.router', 'naif.base64', 'index'])
    .config(AppConfig)
    .service('socketService', SocketService)
    .service('userService', UserService)
    .service('chatService', ChatService)
    .factory('config', () => {
        return {
            giphyApiKey: 'P6R7IJSx6B0NB5bnsMeJKRKXFqW2ENeP'
        }
    })

angular.bootstrap(document.getElementById('app'), ['chat']);