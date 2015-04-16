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

  .controller('Starter', function ($scope, $filter, GameFact) {
    $scope.playersready = false;

    $scope.$watch(
      function () { return GameFact.teams[0].players; },
      function (newVal, oldVal) {
        var fp = $filter('filter')(GameFact.teams[0].players, {playing:true});
        $scope.playersready = (fp.length == 5);
      },
      true
      );

    $scope.test = function(){
      console.log(GameFact.teams[0].players);
    };

  })

  .controller('Team', function ($scope, GameFact) {
    $scope.init = function(teamid) {
      $scope.teamid = teamid
      $scope.team = GameFact.teams[teamid];
    };
    $scope.showBench = function() {
      $('#bench').modal('show');
    };
    $scope.selectPlayerFromBench = function(player) {
      $('#bench').modal('hide');
      var index = GameFact.teams[$scope.teamid].players.indexOf(player);
      GameFact.teams[$scope.teamid].players[index].playing = true;
      $scope.saveGameFact();
    }
  })

  .controller('Chrono', function ($scope, $interval, GameFact ) {

    $scope.timer = null;
    $scope.clockisrunning = false;
    $scope.gamestarted = !(GameFact.chrono.curr_time === 0 && GameFact.chrono.curr_period === 0);
    $scope.gameisover = (GameFact.chrono.curr_period >= GameFact.chrono.nb_periods);
    $scope.periodisrunning = (GameFact.chrono.curr_time >0);
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