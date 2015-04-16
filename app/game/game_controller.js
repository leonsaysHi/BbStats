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

  .controller('Game', function ($scope, config, $indexedDB, gameDatas, GameFact) {
    angular.merge(GameFact, gameDatas);
    $scope.gamedatas = GameFact;

    $scope.saveGameFact = function() {
      var gamedatas = GameFact;
      $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
        store.upsert (gamedatas).then(function(e){console.log('upsert');});
      });
    };

  })

  .controller('Team', function ($scope, GameFact) {
    console.log($scope.teamid);
    $scope.init = function(teamid) {
      $scope.teamid = teamid
      $scope.team = GameFact.teams[teamid];
    };
    $scope.showBench = function() {
      $('#bench').modal('show');
    };
    $scope.benchPlayerSelected = function(player) {
      $('#bench').modal('hide')
      player.playing = true;
      $scope.saveGameFact();
    }
  })

  .controller('Chrono', function ($scope, $interval, GameFact ) {

    $scope.timer = null;
    $scope.clockisrunning = false;
    $scope.periodisrunning = (GameFact.chrono.curr_time >0);
    $scope.gameisover = (GameFact.chrono.curr_period >= GameFact.chrono.nb_periods);
    $scope.chronodatas = GameFact.chrono;

    $scope.nextPeriod = function() {
      GameFact.chrono.curr_period += 1;
      GameFact.chrono.curr_time = 60 * GameFact.chrono.minutes_periods;
      $scope.periodisrunning = true;
    };

    $scope.play = function() {
      $scope.clockisrunning = true;
      $scope.timer = $interval(
        function(){
          GameFact.chrono.curr_time -= 0.1;
          if (GameFact.chrono.curr_time <=0) {
            GameFact.chrono.curr_time = 0;
            $scope.periodisrunning = false;
            if (GameFact.chrono.curr_period >= GameFact.chrono.nb_periods) {
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
      $scope.saveGameFact();
    };


  })

;

})();