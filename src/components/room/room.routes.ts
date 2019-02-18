let HTML = require('./room.html');

RoomConfig.$inject = ["$stateProvider", "$urlRouterProvider"];

function RoomConfig($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/General');
    $stateProvider
      .state('index.home.room', {
        url: ':roomName',
        controller: 'RoomCtrl',
        controllerAs: '$ctrl',
        templateUrl: HTML,
        params: {
          private: false
        }
      })
      .state('index.home.room.image', {
        url: '/:messageId',
        component: 'imageViewer',
      });
};
  
export default RoomConfig;