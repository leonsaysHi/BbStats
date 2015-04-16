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
    angular.merge(GameFact, gameDatas);
    
    $scope.gamedatas = GameFact;

    $scope.addPayer = function() {
      $scope.gamedatas.teams[0].players.push({});
    };
    $scope.removePlayer = function(index) {      
      $scope.gamedatas.teams[0].players.splice(index, 1);
    };

    $scope.save = function() {
      console.log('save', GameFact);
      $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
        if ($routeParams.sheetId !== 'new') {
          store.upsert (GameFact).then(function(e){console.log(e);});
        }
        else {
          store.insert (GameFact).then(function(e){console.log(e);});
        }
      });
    };

  });

})();