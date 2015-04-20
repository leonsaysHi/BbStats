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
  
  // Stores Game datas
  app.factory('GameDatasFact', function() {
    return {
      id : null,
      name : '',
      // team
      teams : [
      { 
        name : '',
        color: '',
          players : [] // {id, name, number, playing}          
        }
        ],
        chrono : {
          nb_periods : 4,
        minutes_periods : 10, // minutes
        curr_period : 0,
        curr_time : 0, // in secondes
      },
      playbyplay : []
    };
  });
  
  // Stores UI vars
  app.factory('GameUIFact', function() {
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
  .controller('Game', function ($scope, $filter, config, $indexedDB, gameDatas, GameDatasFact, GameUIFact) {
    angular.merge(GameDatasFact, gameDatas);

    $scope.gamedatas = GameDatasFact;
    $scope.gamestatuses = GameUIFact;

      // watch players
      var playersready_watch = $scope.$watch(
        function () { return GameDatasFact.teams[0].players; },
        function (newVal, oldVal) {
          var fp = $filter('getCourtPlayers')(GameDatasFact.teams[0].players);
          GameUIFact.playersready = (fp.length == 5);
          if (GameUIFact.playersready) { playersready_watch(); }
        },
        true
        );

      // watch play
      $scope.$watch(
        function () { return GameDatasFact.chrono; },
        function (newVal, oldVal) {
          GameUIFact.gamestarted = !(GameDatasFact.chrono.curr_time === 0 && GameDatasFact.chrono.curr_period === 0);
          GameUIFact.periodisrunning = GameDatasFact.chrono.curr_time > 0;
          GameUIFact.regulationisover = (GameDatasFact.chrono.curr_period >= GameDatasFact.chrono.nb_periods);
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
  app.controller('Plays', function ($scope, $filter, GameDatasFact, GameUIFact) {



    $scope.resetPlay = function() {
      $scope.play = {
        time : null,
        curr_time : null,
        curr_period : null,
        teamid : null,
        player : null,
        action : null
      };
    }
    $scope.resetPlay();
    


    $scope.init = function(teamid) {
      $scope.teamid = teamid
      $scope.team = GameDatasFact.teams[teamid];
    };


    // players 
    $scope.getEmptyPlayersSpots = function(){
      var 
      pp = $filter('getCourtPlayers')(GameDatasFact.teams[0].players),
      bp = $filter('getBenchPlayers')(GameDatasFact.teams[0].players)
      ;
      var n = Math.min(bp.length, (5-pp.length));
      return new Array(Math.max(0, n));
    };


    // plays
    $scope.selectPlayer = function(player){
      $scope.play.time = ((GameDatasFact.chrono.curr_period-1)*(GameDatasFact.chrono.minutes_periods*60)) + ((GameDatasFact.chrono.minutes_periods*60) - GameDatasFact.chrono.curr_time);
      $scope.play.curr_time = GameDatasFact.chrono.curr_time;
      $scope.play.curr_period = GameDatasFact.chrono.curr_period;
      $scope.play.teamid = $scope.teamid;
      $scope.play.player = player;
    }
    $scope.selectAction = function(play, save) {
      if (typeof save === 'undefined') { save = true; }
      $scope.play.action = play;
      if(save) {
        $scope.savePlay();
      }
    };
    $scope.savePlay = function() {
      GameDatasFact.playbyplay.push(
        {
          time : $scope.play.time,
          curr_period : $scope.play.curr_period,
          curr_time : $scope.play.curr_time,
          teamid : $scope.teamid,
          playerid : $scope.play.player.id,
          action : $scope.play.action
        }
      );
      $scope.resetPlay();
    };
    $scope.playSubstitution = function(){
      $('#bench').modal('show');
    };


    // bench
    $scope.showBench = function() {
      $('#bench').modal('show');
    };
    $scope.selectPlayerFromBench = function(player) {
      $('#bench').modal('hide');

      // set as not playing
      if ($scope.play.player !== null) {
        var index_pp = GameDatasFact.teams[$scope.teamid].players.indexOf($scope.play.player);
        GameDatasFact.teams[$scope.teamid].players[index_pp].playing = false;
        $scope.play.action = 'out';
        $scope.savePlay();
      }
      
      // set as playing
      var index_player = GameDatasFact.teams[$scope.teamid].players.indexOf(player);
      GameDatasFact.teams[$scope.teamid].players[index_player].playing = true;
      $scope.selectPlayer(player);
      $scope.play.action = 'in';
      $scope.savePlay();
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

  app.filter('playerFromPid', function (GameDatasFact) {
    return function (id) {
      var players = GameDatasFact.teams[0].players;
      for (var i = 0; i < players.length; i++) {
        var player = players[i];
        console.log(id, player.id);
        if (player.id===id) {
          return '#'+player.number + ' ' + player.name;
        }
      }
    };
  });


  /**
  * Play By Play
  *
  * 
  */
  app
    .controller('Output', function ($scope, $filter, GameDatasFact) {
      // watch play
      $scope.$watch(
        function () { return GameDatasFact.playbyplay; },
        function (newVal, oldVal) {
          $scope.plays = GameDatasFact.playbyplay;
        },
        true
      );
    })
    .filter('reverse', function() {
      return function(items) {
        return items.slice().reverse();
      };
    })
  ;

  /**
  * Chrono
  *
  * 
  */
  app.controller('Chrono', function ($scope, $interval, GameDatasFact, GameUIFact) {

    $scope.timer = null;
    
    $scope.nextPeriod = function() {
      GameDatasFact.chrono.curr_period += 1;
      GameDatasFact.chrono.curr_time = 60 * GameDatasFact.chrono.minutes_periods;
      GameUIFact.periodisrunning = true;
    };

    $scope.play = function() {
      GameUIFact.clockisrunning = true;
      $scope.timer = $interval(
        function(){
          GameDatasFact.chrono.curr_time -= 0.1;
          if (GameDatasFact.chrono.curr_time <=0) {
            GameDatasFact.chrono.curr_time = 0;
            GameUIFact.periodisrunning = false;
            $scope.stop();
          }
        },
        100
        );
    };

    $scope.stop = function() {
      $interval.cancel($scope.timer);
      $scope.timer = null;
      GameUIFact.clockisrunning = false;
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
      output +=   (ot) ? ' OT' : 'QT';
      return output;
    };
  });

  app.filter('chronoGotoNextPeriod', function (GameDatasFact) {
    return function (period) {
      var 
      p = period+1,
      output = "Go to "
      ;
      if (p <= GameDatasFact.chrono.nb_periods) {
        output += 'next period';
      }
      else if (p>GameDatasFact.chrono.nb_periods+1) {
        output += 'next overtime';
      }
      else {
        output += 'overtime';
      }
      return output;
    };
  });

})();