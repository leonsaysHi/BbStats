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
          total_time: 0 // in secondes
        },
      playbyplay: [], // { time, curr_period, curr_time, teamid, playerid, action}
    };
  });


  app.factory('ActionsDatasFact', function() {
    return {
      base: [
      {code:false, subaction:'fg', label:'Field goal', addaction: false },
      {code:['rebdef'], subaction:false, label:'Defensive rebound', addaction: false }, 
      {code:['to'], subaction:false, label:'Turn over', addaction: false },
      {code:['st'], subaction:false, label:'Steal', addaction: false },
      {code:['blk'], subaction:false, label:'Block', addaction: false },
      {code:['pf'], subaction:false, label:'Foul', addaction: false }
      ],
      subactions: {
        fg: [
        {code:['fta'], subaction:false, label:'1pt missed', addaction: false},
        {code:['fga2'], subaction:false, label:'2pts missed', addaction:'reboff'},
        {code:['fga3'], subaction:false, label:'3pts missed', addaction:'reboff'},
        {code:['fta','ftm'], subaction:false, label:'1pt made', addaction: false},
        {code:['fga2','fgm2'], subaction:false, label:'2pts made', addaction:'ast'},
        {code:['fga3','fgm3'], subaction:false, label:'3pts made', addaction:'ast'}
        ]
      },
      addactions: {
        'reboff': [{code:['reboff'], subaction:false, label:'Offemsive rebound', addaction: false}],
        'ast': [{code:['ast'], subaction:false, label:'Assist', addaction: false}]
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
  app.controller('Plays', function ($scope, $filter, GameDatasFact, ActionsDatasFact) {


    $scope.resetRecorder = function() {
      $scope.recorder = []; 
    };

    $scope.init = function(teamid) {
      $scope.actionsdata = ActionsDatasFact;
      $scope.teamid = teamid
      $scope.team = GameDatasFact.teams[teamid];
      $scope.resetRecorder();
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


    // click on player :
    $scope.selectPlayer = function(player, code, subaction, addaction){
      // init action : 
      if ($scope.recorder.length === 0) {
        $scope.recorder.push({
          time: GameDatasFact.chrono.total_time,
          curr_time: GameDatasFact.chrono.curr_time,
          curr_period: GameDatasFact.chrono.curr_period,
          teamid: $scope.teamid,
          player: player,
          playerid: player.id,
          action: false
        });
        // pregame substitution :
        if (GameDatasFact.chrono.total_time===0) {
          $scope.substitution();
        }

      }
      // addaction : 
      else {
        console.log('player addaction');
        $scope.recorder.push({
          time: $scope.recorder[0].time,
          curr_time: $scope.recorder[0].curr_time,
          curr_period: $scope.recorder[0].curr_period,
          teamid: $scope.recorder[0].teamid,
          player: player,
          playerid: player.id,
          action: false
        });
      }
      // follow with addaction if necessary args
      if (typeof code !== 'undefined' && typeof subaction !== 'undefined' && typeof addaction !== 'undefined') {
        $scope.selectAction(code, subaction, addaction);
      }
    };

    // click on action
    $scope.selectAction = function(code, subaction, addaction) {   
      var actionindex = ($scope.recorder.length-1);
      $scope.subaction = subaction;
      $scope.addaction = addaction;
      if (code) {
        $scope.recorder[actionindex].action = code;
      }
      // save ?
      if (!subaction && !addaction) {  
        $scope.savePlay(); 
      }
    };

    $scope.savePlay = function() {
      console.log('SAVE', $scope.recorder);
      GameDatasFact.playbyplay.push($scope.recorder);
      $scope.resetRecorder();
      $scope.saveGameDatasFact();
    };
    $scope.substitution = function(){
      $('#bench').modal('show');
    };


    // bench
    $scope.showBench = function() {
      $('#bench').modal('show');
    };
    $scope.selectPlayerFromBench = function(player) {
      // set as not playing
      if ($scope.recorder.length===1) {
        $scope.recorder[0].action = ['out'];
        var index_pp = GameDatasFact.teams[$scope.teamid].players.indexOf($scope.recorder[0].player);
        GameDatasFact.teams[$scope.teamid].players[index_pp].playing = false;
      }

      // set as playing
      var index_bp = GameDatasFact.teams[$scope.teamid].players.indexOf(player);
      GameDatasFact.teams[$scope.teamid].players[index_bp].playing = true;
      console.log ('... >', $scope.recorder);  
      $scope.selectPlayer(player, ['in'], false, false); // full record 
      console.log ('selectPlayer >', $scope.recorder); 

      $('#bench').modal('hide'); 
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
  * Output
  *
  * 
  */
  app
  .controller('Output', function ($scope, $filter, GameDatasFact, ActionsDatasFact) {

    // watch play
    $scope.$watch(
      function () { return GameDatasFact.playbyplay; },
      function (newVal, oldVal) {
        $scope.plays = GameDatasFact.playbyplay;
        // Toto update stats
        var i = (newVal.length-oldVal.length);
        if (i === 0) { return; }
        for (i = newVal.length - i;i<newVal.length;i++) {
          var play = $scope.plays[i];
          $scope.updateScorebox();
        }
      },
      true
      );

    // update $scope.stats { playerid: {code:..., code:... } }
    $scope.updateScorebox = function () {

      // init statsheets:
      var players = GameDatasFact.teams[0].players, playerlength = players.length;
      for (var i = 0; i < playerlength; i++) {
        var playerid = players[i].id;          
        $scope.stats[playerid] = {};
        var actionsoutputs = ActionsDatasFact.output, actionsoutputslength = actionsoutputs.length;
        for (var j = 0; j < actionsoutputslength; j++) {
          $scope.stats[playerid][actionsoutputs[j]] = 0;
        }
        // record minutes :
        $scope.stats[playerid].playingtime = [];
      }

      // calculate statsheets:
      // for each play...
      var playbyplay = GameDatasFact.playbyplay, playslength = playbyplay.length;
      for (var i = 0; i < playslength; i++) {

        // for each actions...
        var actions = playbyplay[i], actionslength = actions.length;
        for (var j = 0; j<actionslength; j++) {
          var action = actions[j], playerid = action.playerid;
          // each codes ...
          var codes = action.action, codeslength = codes.length;
          for (var k = 0; k<codeslength; k++) {

            // use code:
            var code = codes[k];
            if (typeof $scope.stats[playerid][code] !== 'undefined') {
              $scope.stats[playerid][code]++;
            }
            // extra stats
            switch(code) {
              // points
              case 'ftm' : $scope.stats[playerid].pts += 1; break;
              case 'fgm2' : $scope.stats[playerid].pts += 2; break;
              case 'fgm3' : $scope.stats[playerid].pts += 3; break;
              // minutes
              case 'in' : 
              $scope.stats[playerid].playingtime.push([action.time, GameDatasFact.chrono.total_time]); 
              break;
              case 'out' : 
              var lastin = ($scope.stats[playerid].playingtime.length-1);
              $scope.stats[playerid].playingtime[lastin][1] = action.time;
              break;
            }

          }

        }
      }
    };

    // init 
    // 
    $scope.stats = {};
    $scope.updateScorebox();


  })
.filter('playByPlay', function(GameDatasFact) {
  return function(play) {
    var output = '';
      //console.log(play);
      /*for (i=0; i<play.length; i++) {
        var code = play[i].code;
        var player = $filter('playerFromPid')(play[i].playerid);
      }*/
      return 'log';
    }
  })
.filter('playerFromPid', function (GameDatasFact) {
  return function (id) {
    var players = GameDatasFact.teams[0].players;
    for (var i = 0; i < players.length; i++) {
      var player = players[i];
      if (player.id===id) {
        return player;
      }
    }
  };
})
.filter('statsPlayingMinutes', function(GameDatasFact) {
  return function(inout) {
    var t=0, i=0, inoutlength = inout.length;
    for (;i<inoutlength;i++) {
      var a = inout[i];
      t += a[1] - a[0];
    }
    var m = Math.floor(t/60);
    var s = Math.floor(t-m*60);
    var output =  
    ((m<10) ? '0' + m : m) 
    + ':' 
    + ((s<10) ? '0' + s : s)
    ;
    return output;
  }
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
          $scope.gamestarted = (GameDatasFact.chrono.curr_period > 0);
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
            GameDatasFact.chrono.total_time += 0.1;
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