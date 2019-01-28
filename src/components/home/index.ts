import HomeConfig from './home.routes';
import HomeCtrl from './home.controller';
import EditProfileCtrl from './editProfile.controller';
import { SidebarComponent } from './sidebar.component';

declare var angular: any;

export default angular.module('home', [])
    .config(HomeConfig)
    .controller('HomeCtrl', HomeCtrl)
    .controller('EditProfileCtrl', EditProfileCtrl)
    .component('sidebar', SidebarComponent);