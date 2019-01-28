AppConfig.$inject = ["$locationProvider", "$urlRouterProvider"];

function AppConfig($locationProvider, $urlRouterProvider) {
    $locationProvider.hashPrefix('');
    $urlRouterProvider.otherwise('/');
};
  
export default AppConfig;