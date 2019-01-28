let HTML = require('./home.html');

HomeConfig.$inject = ["$stateProvider"];

function HomeConfig($stateProvider) {
    $stateProvider
      .state('index.home', {
        url: '/',
        controller: 'HomeCtrl',
        controllerAs: '$ctrl',
        templateUrl: HTML
      });
};
  
export default HomeConfig;