(function(){
  'use strict';


  angular.module('game',['ngRoute'])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/game/:sheetId', {
        templateUrl: 'game/game.html',
        controller: 'Game'
      })
    ;
  })

  .controller('Game', function ($scope, $routeParams, $indexedDB) {
    $scope.sheetdatas = {
      id:parseInt($routeParams.sheetId)
    };

    // get from indexedDB
    $indexedDB.openStore('statsheets', function(store) {
      store.find($scope.sheetdatas.id).then(function(sheetdatas) {  
        $scope.sheetdatas = sheetdatas;
      });
    });

  })

  .controller('gameTimer', function ($scope, $routeParams, $indexedDB ) {
    $scope.chrono = "xx:xx:xx";
  })

})();