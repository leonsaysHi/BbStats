(function(){
  'use strict';


  angular.module('bbstats')
  .config(function ($routeProvider) {
    $routeProvider
    .when('/gameconfig/:gameId', {
      templateUrl: 'gameconfig/gameconfig.html',
      controller: 'gameConfig',
      resolve: {
        gameDatas : function ($route, config, $q, $indexedDB) {
          var id = $route.current.params.gameId;
          if($route.current.params.gameId == 'new') {
            return {
              id : new Date().valueOf()
            };
          }
          else {
            var deferred = $q.defer();
            $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
              store.find(parseInt(id)).then(function(data) {
                deferred.resolve(data);
              });
            });
            return deferred.promise;
          }
        }
      }
    })
    ;
  })
  .controller('gameConfig', function ($scope, config, $routeParams, $indexedDB, gameDatas, GameFact) {
    GameFact.setDatas(gameDatas);
    
    $scope.gamedatas = GameFact.getDatas();    
    console.log($scope.gamedatas);

    $scope.save = function() {
      var gamedatas = GameFact.getDatas();

      $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
        if ($routeParams.sheetId !== 'new') {
          store.upsert (gamedatas).then(function(e){console.log(e);});
        }
        else {
          store.insert (gamedatas).then(function(e){console.log(e);});
        }
      });
    };

  });

})();