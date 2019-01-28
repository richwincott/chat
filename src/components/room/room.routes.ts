let HTML = require('./room.html');

RoomConfig.$inject = ["$stateProvider", "$urlRouterProvider"];

function RoomConfig($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/General');
    $stateProvider
      .state('index.home.room', {
        url: ':roomName',
        controller: 'RoomCtrl',
        controllerAs: '$ctrl',
        templateUrl: HTML
      });
};
  
export default RoomConfig;