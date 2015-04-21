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
      id: null,
      name: '',
      // team
      teams: [
      { 
        name: '',
        color: '',
          players: [] // {id, name, number, playing}          
        }
        ],
        chrono: {
          nb_periods: 4,
        minutes_periods: 10, // minutes
        curr_period: 0,
        curr_time: 0, // in secondes
      },
      playbyplay: [], // { time, curr_period, curr_time, teamid, playerid, action}
      actions: {
        base: [
          { code:['fg'], label:'Field goal', subactions: true }, 
          { code:['ast'], label:'Assist', subactions: false }, 
          { code:['reb'], label:'Rebound', subactions: true }, 
          { code:['to'], label:'Turn over', subactions: false },
          { code:['st'], label:'Steal', subactions: false },
          { code:['blk'], label:'Block', subactions: false },
          { code:['pf'], label:'Foul', subactions: false }
        ],
        subs: {
          fg: [
            {code:['fta'], label:'1pt missed'},
            {code:['fga2'], label:'2pts missed'},
            {code:['fga3'], label:'3pts missed'},
            {code:['fta','ftm'], label:'1pt made'},
            {code:['fga2','fgm2'], label:'2pts made'},
            {code:['fga3','fgm3'], label:'3pts made'}
          ],
          reb: [
            {code:['reboff'], label:'Off'},
            {code:['rebdef'], label:'Def'}
          ]
        },
        output: [
          'fta','fga2','fga3',
          'ftm','fgm2','fgm3',
          'ast',
          'rebdef',
          'reboff',
          'to',
          'st',
          'blk',
          'f',
          'pts'
        ]
      },
    };
  });


  /**
  * Game : Parent controller
  *
  * 
  */
  app
  .controller('Game', function ($scope, $filter, config, $indexedDB, gameDatas, GameDatasFact) {

      // init store GameDatasFact into scope
      angular.merge(GameDatasFact, gameDatas);
      $scope.gamedatas = GameDatasFact;

      // are players ready
      $scope.playersready = false;
      var playersready_watch = $scope.$watch(
        function () { return GameDatasFact.teams[0].players; },
        function (newVal, oldVal) {
          var fp = $filter('getCourtPlayers')(GameDatasFact.teams[0].players);
          $scope.playersready = (fp.length == 5);
          if ($scope.playersready) { playersready_watch(); }
        },
        true
        );

      // Saving current game state
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
  app.controller('Plays', function ($scope, $filter, GameDatasFact) {



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


    // return an array of empty player spot 
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
    $scope.selectAction = function(code, subactions) {
      // no subactions :
      if (subactions === false) {
        $scope.play.action = code;
        $scope.savePlay(); 
      }
      // subactions :
      else {
        $scope.play.action = code[0];
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
      $scope.saveGameDatasFact();
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
        $scope.play.action = ['out'];
        $scope.savePlay();
      }
      
      // set as playing
      var index_player = GameDatasFact.teams[$scope.teamid].players.indexOf(player);
      GameDatasFact.teams[$scope.teamid].players[index_player].playing = true;
      $scope.selectPlayer(player);
      $scope.play.action = ['in'];
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
      if (player.id===id) {
        return '#'+player.number + ' ' + player.name;
      }
    }
  };
});



  /**
  * Output
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
          // Toto update stats
          var i = (newVal.length-oldVal.length);
          for (;i<newVal.length;i++) {
            var play = $scope.plays[i];
            $scope.updateplayerStats(play.playerid);
          }
        },
        true
        );

      // update $scope.stats { playerid: {code:..., code:... } }
      $scope.updateplayerStats = function (playerid) {
        var updateall = (typeof playerid === 'undefined');
        // reset all/playerid stats
        var players = [];
        if (updateall) {
          players = GameDatasFact.teams[0].players;
        }
        else {
          players.push({ id:playerid });
        }
        // init empty statsheet for each players :
        console.log('player',players);
        var playerlength = players.length;
        for (var i = 0; i < playerlength; i++) {
          var playerid = players[i].id;          
          $scope.stats[playerid] = {};
          var actionsoutput = GameDatasFact.actions.output, actionsoutputlength = actionsoutput.length;
          for (var j = 0; j < actionsoutputlength; j++) {
            $scope.stats[playerid][actionsoutput[j]] = 0;
          };
        }

        // insert stats :
        var playbyplay = GameDatasFact.playbyplay, playslength = playbyplay.length;
        for (var i = 0; i < playslength; i++) {
          var play = playbyplay[i];
          if (play.playerid === playerid || updateall) {
              for (var j=0; j<play.action.length; j++) {
              var code = play.action[j];
              if (typeof $scope.stats[play.playerid][code] !== 'undefined') {
                $scope.stats[play.playerid][code]++;
              }              
            }

          }
        }
      };

      // init 
      // 
      $scope.stats = {};
      $scope.updateplayerStats();


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
  app.controller('Chrono', function ($scope, $interval, GameDatasFact) {

    $scope.timer = null;
    $scope.periodisrunning = GameDatasFact.chrono.curr_time>0;


      // watch play
      $scope.$watch(
        function () { return GameDatasFact.chrono; },
        function (newVal, oldVal) {
          $scope.gamestarted = !(GameDatasFact.chrono.curr_time === 0 && GameDatasFact.chrono.curr_period === 0);
        },
        true
        );

      $scope.nextPeriod = function() {
        GameDatasFact.chrono.curr_period += 1;
        GameDatasFact.chrono.curr_time = 60 * GameDatasFact.chrono.minutes_periods;
        $scope.periodisrunning = true;
      };

      $scope.play = function() {
        $scope.clockisrunning = true;
        $scope.timer = $interval(
          function(){
            GameDatasFact.chrono.curr_time -= 0.1;
            if (GameDatasFact.chrono.curr_time <=0) {
              GameDatasFact.chrono.curr_time = 0;
              $scope.periodisrunning = false;
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
    output +=   (ot) ? ' OT' : ' Qt';
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