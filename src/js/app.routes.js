app.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', ($stateProvider, $urlRouterProvider, $locationProvider) => {
    $urlRouterProvider.otherwise('/General');
    $stateProvider
        .state('home', {
            url: '/',
            controller: 'home.controller',
            controllerAs: "vm",
            templateUrl: 'partials/home/home.html'
        })
        .state('home.room', {
            url: ':roomName',
            controller: 'room.controller',
            controllerAs: "vm",
            templateUrl: 'partials/room/room.html'
        })  
    $locationProvider.hashPrefix('');
}]);