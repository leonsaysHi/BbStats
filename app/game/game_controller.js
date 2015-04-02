(function(){
  'use strict';


  angular.module('game',['ngRoute'])
    .config(function ($routeProvider) {
      $routeProvider
        .when('/game/:sheetId', {
          templateUrl: 'game/game.html',
          controller: 'Game',
          resolve: {
            statSheetDatas : function ($route, $q, $indexedDB) {
              var deferred = $q.defer(),
              id = parseInt($route.current.params.sheetId);

              $indexedDB.openStore('statsheets', function(store) {
                store.find(id).then(function(data) {
                  deferred.resolve(data);
                });
              });

              return deferred.promise;
            }
          }
        })
      ;
    }
  )

  .controller('Game', function ($scope, $routeParams, statSheetDatas) {

    $scope.sheetdatas = statSheetDatas;

  })

  .controller('gameTimer', function ($scope, $routeParams, $indexedDB ) {
    $scope.chrono = "xx:xx:xx";
  })

})();