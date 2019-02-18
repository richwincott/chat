import RoomConfig from './room.routes';
import RoomCtrl from './room.controller';
import { ImageViewerComponent } from './imageViewer.component';

declare var angular: any;

export default angular.module('room', [])
    .config(RoomConfig)
    .controller('RoomCtrl', RoomCtrl)
    .component('imageViewer', ImageViewerComponent)