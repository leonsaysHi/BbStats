(function(){
  'use strict';


  angular.module('bbstats')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'main/main.html',
        controller: 'MainCtrl'
      })
    ;
  })
  .controller('MainCtrl', function ($scope, config, $indexedDB) {
    
    $scope.statsheets = [];
    
    // get from indexedDB
    $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
      store.getAll().then(function(gamesdatas) {
        console.log(gamesdatas);
        $scope.gamesdatas = gamesdatas;
      });
    });

  });

})();