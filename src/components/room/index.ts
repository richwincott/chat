import RoomConfig from './room.routes';
import RoomCtrl from './room.controller';

declare var angular: any;

export default angular.module('room', [])
    .config(RoomConfig)
    .controller('RoomCtrl', RoomCtrl)