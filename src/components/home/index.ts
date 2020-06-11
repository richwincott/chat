import HomeConfig from './home.routes';
import HomeCtrl from './home.controller';
import EditProfileCtrl from './editProfile.controller';
import { SidebarComponent } from './sidebar.component';
import { AddRoomComponent } from './addRoom.component';

declare var angular: any;

export default angular.module('home', [])
    .component('sidebar', SidebarComponent)
    .component('addRoom', AddRoomComponent)    
    .controller('HomeCtrl', HomeCtrl)
    .controller('EditProfileCtrl', EditProfileCtrl)
    .config(HomeConfig);