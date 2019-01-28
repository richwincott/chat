let HTML = require('./index.html');

IndexConfig.$inject = ["$stateProvider"];

function IndexConfig($stateProvider) {
    $stateProvider
      .state('index', {
        templateUrl: HTML
      });
};

export default IndexConfig;