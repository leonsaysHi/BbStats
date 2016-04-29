(function(){
  'use strict';


  angular.module('bbstats')
  .controller('MainCtrl', function ($scope, config, $indexedDB) {
    
    // get Games list :
    $scope.getGamesList = function(){
      $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
        store.getAll().then(function(gamesdatas) {
          $scope.gamesdatas = gamesdatas;
        });
      });
    };
    

    $scope.deleteGame = function (id) {
      $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
        store.delete(id);
        $scope.getGamesList();
      });
    };

    $scope.getGamesList();

  });

})();