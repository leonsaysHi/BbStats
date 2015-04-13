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

  .controller('Chrono', function ($scope, $interval, config, $routeParams, $indexedDB, GameFact ) {

    $scope.timer = null;
    $scope.clockisrunning = false;
    $scope.periodisrunning = (GameFact.ds.chrono.curr_time >0);
    $scope.gameisover = (GameFact.ds.chrono.curr_period >= GameFact.ds.chrono.nb_periods);
    $scope.chronodatas = GameFact.ds.chrono;

    $scope.nextPeriod = function() {
      GameFact.ds.chrono.curr_period += 1;
      GameFact.ds.chrono.curr_time = 60 * GameFact.ds.chrono.minutes_periods;
      $scope.periodisrunning = true;
    };

    $scope.play = function() {
      $scope.clockisrunning = true;
      $scope.timer = $interval(
        function(){
          GameFact.ds.chrono.curr_time -= 0.1;
          if (GameFact.ds.chrono.curr_time <=0) {
            GameFact.ds.chrono.curr_time = 0;
            $scope.periodisrunning = false;
            if (GameFact.ds.chrono.curr_period >= GameFact.ds.chrono.nb_periods) {
              $scope.gameisover = true;
            }
            $scope.stop();
          }
        },
        100
        );
    };

    $scope.stop = function() {
      $interval.cancel($scope.timer);
      $scope.timer = null;
      $scope.clockisrunning = false;
      $scope.save();
    };

    $scope.save = function() {
      var gamedatas = GameFact.getDatas();
      $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
        store.upsert (gamedatas).then(function(e){console.log('upsert');});
      });
    };

    // init chrono
    $scope.$watch(
      function() { return GameFact.ds.chrono.curr_time; }, 
      function(value) { GameFact.fs.chrono.updateReadables(); }
    );


  })

;

})();