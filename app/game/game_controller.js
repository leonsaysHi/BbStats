(function(){
  'use strict';


  angular
  .module('bbstats')
  .config(function ($routeProvider) {
    $routeProvider
    .when('/game/:gameId', {
      templateUrl: 'game/game.html',
      controller:  'Game',
      resolve: {
        gameDatas : function ($route, config, $q, $indexedDB) {
          var deferred = $q.defer(),
          id = parseInt($route.current.params.gameId);
          $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
            store.find(id).then(function(data) {
              deferred.resolve(data);
            });
          });
          return deferred.promise;
        }
      }
    })
    ;
  })

  .controller('Game', function ($scope, $routeParams, gameDatas, GameFact) {
    GameFact.setDatas(gameDatas);
    $scope.gamedatas = GameFact.getDatas();
  })

  .controller('Chrono', function ($scope, config, $routeParams, $indexedDB, GameFact ) {

    // init chrono
    $scope.isplaying = false;
    GameFact.fs.chrono.updateReadableTime();

    $scope.$watch(function () { return GameFact.ds.chrono.curr_time }, function (newVal, oldVal) {
      if (typeof newVal !== 'undefined') {
        $scope.chrono = GameFact.ds.chrono.readabletime;
        $scope.qt = GameFact.ds.chrono.curr_period;
      }
    });

    $scope.play = function() {
      $scope.isplaying = true;
      GameFact.fs.chrono.play();
    };

    $scope.stop = function() {
      $scope.isplaying = false;
      GameFact.fs.chrono.stop();
      $scope.save();
    };

    $scope.save = function() {
      var gamedatas = GameFact.getDatas();
      $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
          store.upsert (gamedatas).then(function(e){console.log('upsert');});
      });
    };


  })

  ;

})();