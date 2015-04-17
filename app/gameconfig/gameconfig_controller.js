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
  .controller('gameConfig', function ($scope, $filter, config, $routeParams, $indexedDB, gameDatas, GameDatasFact) {
    angular.merge(GameDatasFact, gameDatas);
    
    $scope.gamedatas = GameDatasFact;

    $scope.addPayer = function() {
      var id = Math.round(Math.random()*10000);
      $scope.gamedatas.teams[0].players.push({id:id, playing:false});
    };

    $scope.removePlayer = function(index) {      
      $scope.gamedatas.teams[0].players.splice(index, 1);
    };

    $scope.save = function() {
      console.log('save', GameDatasFact);
      $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
        if ($routeParams.sheetId !== 'new') {
          store.upsert(GameDatasFact).then(function(e){console.log(e);});
        }
        else {
          store.insert(GameDatasFact).then(function(e){console.log(e);});
        }
      });
    };

  });

})();