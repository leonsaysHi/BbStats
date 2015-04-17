(function(){
  'use strict';


  var app = angular.module('bbstats');

  app.config(function ($routeProvider) {
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
  });
  
  app.factory('GameDatasFact', function() {
    return {
      id : null,
      name : '',
      teams : [
        { // 1st team :
          name : '',
          color: '',
          players : [
            // {name, number, playing}
            ]
          }
          ],
          chrono : {
            nb_periods : 4,
          minutes_periods : 10, // minutes
          curr_period : 0,
          curr_time : 0, // in secondes
        }
    };
  });
  
  app.factory('GameStatusesFact', function() {
    return {
      playersready : false,
      gamestarted : false,
      clockisrunning : false,
      periodisrunning : false,
      regulationisover : false
    };
  });


  /**
  * Game
  *
  * 
  */
  app
    .controller('Game', function ($scope, $filter, config, $indexedDB, gameDatas, GameDatasFact, GameStatusesFact) {
      angular.merge(GameDatasFact, gameDatas);

      $scope.gamedatas = GameDatasFact;
      $scope.gamestatuses = GameStatusesFact;

      // ready
      var playersready_watch = $scope.$watch(
        function () { return GameDatasFact.teams[0].players; },
        function (newVal, oldVal) {
          var fp = $filter('getCourtPlayers')(GameDatasFact.teams[0].players);
          GameStatusesFact.playersready = (fp.length == 5);
          if (GameStatusesFact.playersready) { playersready_watch(); }
        },
        true
      );

      // started    
      var gamestarted_watch = $scope.$watch(
        function () { return GameDatasFact.chrono; },
        function (newVal, oldVal) {
          GameStatusesFact.gamestarted = !(GameDatasFact.chrono.curr_time === 0 && GameDatasFact.chrono.curr_period === 0);
          GameStatusesFact.periodisrunning = GameDatasFact.chrono.curr_time > 0;
          GameStatusesFact.regulationisover = (GameDatasFact.chrono.curr_period >= GameDatasFact.chrono.nb_periods);
        },
        true
      );

      $scope.saveGameDatasFact = function() {
        var gamedatas = GameDatasFact;
        $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
          store.upsert (gamedatas).then(function(e){console.log('upsert');});
        });
      };

    })
  ;




  /**
  * Plays
  *
  * 
  */
  app.controller('Plays', function ($scope, $filter, GameDatasFact, GameStatusesFact) {
    
    $scope.init = function(teamid) {
      $scope.teamid = teamid
      $scope.team = GameDatasFact.teams[teamid];
    };

    $scope.getEmptyPlayersSpots = function(){
      var 
        pp = $filter('getCourtPlayers')(GameDatasFact.teams[0].players),
        bp = $filter('getBenchPlayers')(GameDatasFact.teams[0].players)
      ;
      var n = Math.min(bp.length, (5-pp.length));
      return new Array(n);
    }

    $scope.showBench = function() {
      $('#bench').modal('show');
    };

    $scope.selectPlayerFromBench = function(player) {
      $('#bench').modal('hide');
      var index = GameDatasFact.teams[$scope.teamid].players.indexOf(player);
      GameDatasFact.teams[$scope.teamid].players[index].playing = true;
      $scope.saveGameDatasFact();
    };

  });

  app.filter('getBenchPlayers', function () {
    return function (players) {
      var filtered = [];
      for (var i = 0; i < players.length; i++) {
        var player = players[i];
        if (player.playing===false) {
          filtered.push(player);
        }
      }
      return filtered;
    };
  });

  app.filter('getCourtPlayers', function () {
    return function (players) {
      var filtered = [];
      for (var i = 0; i < players.length; i++) {
        var player = players[i];
        if (player.playing===true) {
          filtered.push(player);
        }
      }
      return filtered;
    };
  });

  /**
  * Chrono
  *
  * 
  */
  app.controller('Chrono', function ($scope, $interval, GameDatasFact, GameStatusesFact) {

    $scope.timer = null;
    
    $scope.nextPeriod = function() {
      GameDatasFact.chrono.curr_period += 1;
      GameDatasFact.chrono.curr_time = 60 * GameDatasFact.chrono.minutes_periods;
      GameStatusesFact.periodisrunning = true;
    };

    $scope.play = function() {
      GameStatusesFact.clockisrunning = true;
      $scope.timer = $interval(
        function(){
          GameDatasFact.chrono.curr_time -= 0.1;
          if (GameDatasFact.chrono.curr_time <=0) {
            GameDatasFact.chrono.curr_time = 0;
            GameStatusesFact.periodisrunning = false;
            $scope.stop();
          }
        },
        100
        );
    };

    $scope.stop = function() {
      $interval.cancel($scope.timer);
      $scope.timer = null;
      GameStatusesFact.clockisrunning = false;
      $scope.saveGameDatasFact();
    };


  });

  app.filter('chronoTime', function () {
    return function (time) {
      var t = time;
      var m = Math.floor(t/60);
      var s = Math.floor(t-m*60);
      var ts = Math.floor((t-s-m*60)*10);
      var output =  
      ((m<10) ? '0' + m : m) 
      + ':' 
      + ((s<10) ? '0' + s : s) 
      + ':' 
      + ts
      ;
      return output;
    };
  });

  app.filter('chronoPeriod', function (GameDatasFact) {
    return function (period) {
      var 
      ot = (period > GameDatasFact.chrono.nb_periods),
      output = (ot) ? (period - GameDatasFact.chrono.nb_periods) : period
      ;
      switch (output) {
        case 1:
        output += 'st';
        break;
        case 2:
        output += 'nd';
        break;
        case 3:
        output += 'rd';
        break;
        default:
        output += 'th';
        break;
      }
      if (ot) { output += 'OT'; }
      return output;
    };
  });

})();