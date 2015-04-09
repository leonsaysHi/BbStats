(function(){
  'use strict';


  angular.module('bbstats')
  .config(function ($routeProvider) {
    $routeProvider
    .when('/gameconfig/:sheetId', {
      templateUrl: 'gameconfig/gameconfig.html',
      controller: 'gameConfig'
    })
    ;
  })
  .controller('gameConfig', function ($scope, config, $routeParams, $indexedDB, GameFact) {
    $scope.gamedatas = {};
    $scope.gamedatas.id = $routeParams.sheetId === 'new' ? (new Date()).valueOf() : parseInt($routeParams.sheetId);
    
    // get from indexedDB
    if ($routeParams.sheetId !== 'new') {
      $indexedDB.openStore(config.indexedDb.gameStore, function(store) {

        store.find($scope.gamedatas.id).then(function(gamedatas) {  
          // Update scope
          $scope.gamedatas = gamedatas;
        });

      });
    }

    // default sheet
    else {
      $scope.gamedatas.nb_periods = 4;
      $scope.gamedatas.periods_time = 10;
    }

    $scope.save = function() {
      $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
        if ($routeParams.sheetId !== 'new') {
          store.upsert ($scope.gamedatas).then(function(e){console.log(e);});
        }
        else {
          store.insert ($scope.gamedatas).then(function(e){console.log(e);});
        }
      });
    };

  });

})();