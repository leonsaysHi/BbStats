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
      {id:'fg', action:false, subaction:'fg', addaction: false },
      {id:'rebdef', action:['rebdef'], subaction:false, addaction: false }, 
      {id:'to', action:['to'], subaction:false, addaction: false },
      {id:'st', action:['st'], subaction:false, addaction: false },
      {id:'blk', action:['blk'], subaction:false, addaction: false },
      {id:'pf', action:['pf'], subaction:false, addaction: false }
      ],
      subactions: {
        fg: [
        {id:'fta', action:['fta'], subaction:false, addaction: false},
        {id:'fga2', action:['fga2'], subaction:false, addaction:'reboff'},
        {id:'fga3', action:['fga3'], subaction:false, addaction:'reboff'},
        {id:'ftm', action:['fta','ftm'], subaction:false, addaction: false},
        {id:'fgm2', action:['fga2','fgm2'], subaction:false, addaction:'ast'},
        {id:'fgm3', action:['fga3','fgm3'], subaction:false, addaction:'ast'}
        ]
      },
      addactions: {
        'reboff': [{id:'reboff', action:['reboff'], subaction:false, addaction: false}],
        'ast': [{id:'ast', action:['ast'], subaction:false, addaction: false}]
      },
      dictio: {
        'fg': {btnlabel:'Field goal'},
        'fta': {btnlabel:'1pt missed', pplabel:'@: free throw missed.', addtostatsheet:0},
        'fga2': {btnlabel:'2pts missed', pplabel:'@: 2pt shot: missed.', addtostatsheet:0},
        'fga3': {btnlabel:'3pts missed', pplabel:'@: 3pt shot: missed.', addtostatsheet:0},
        'ftm': {btnlabel:'1pt made', pplabel:'@: free throw made.', addtostatsheet:0, ppbold:true},
        'fgm2': {btnlabel:'2pts made', pplabel:'@: 2pt shot: made.', addtostatsheet:0, ppbold:true},
        'fgm3': {btnlabel:'3pts made', pplabel:'@: 3pt shot: made.', addtostatsheet:0, ppbold:true},
        'ast': {btnlabel:'Assist', pplabel:'Assist: @.', addtostatsheet:0},
        'rebdef': {btnlabel:'Defensive rebound', pplabel:'@: defensive rebound.', addtostatsheet:0},
        'reboff': {btnlabel:'Offemsive rebound', pplabel:'Offensive rebound: @.', addtostatsheet:0},
        'to': {btnlabel:'Turn over', pplabel:'@: turnover', addtostatsheet:0},
        'st': {btnlabel:'Steal', pplabel:'@: steal.', addtostatsheet:0},
        'blk': {btnlabel:'Block', pplabel:'@: block shoot.', addtostatsheet:0},
        'pf': {btnlabel:'Foul', pplabel:'@: personnal foul.', addtostatsheet:0},
        'pts': {btnlabel:'Points', addtostatsheet:0},
        'playingtime': {addtostatsheet:[]},
        'out': {pplabel:'@ substitution replaced by'},
        'in': {pplabel:'@.'},
        
      }
    };
  });

  /**
  * Game : Parent controller
  *
  * 
  */
  app
  .controller('Game', function ($scope, $filter, config, $indexedDB, gameDatas, GameDatasFact, ActionsDatasFact) {

      // init store GameDatasFact into scope
      angular.merge(GameDatasFact, gameDatas);
      $scope.gamedatas = GameDatasFact;
      $scope.actionsdata = ActionsDatasFact;

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


    $scope.resetRecorder = function() {
      $scope.recorder = []; 
    };

    $scope.init = function(teamid) {
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
    $scope.selectPlayer = function(player, action, subaction, addaction){
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
      if (typeof action !== 'undefined' && typeof subaction !== 'undefined' && typeof addaction !== 'undefined') {
        $scope.selectAction(action, subaction, addaction);
      }
    };

    // click on action
    $scope.selectAction = function(action, subaction, addaction) {   
      var actionindex = ($scope.recorder.length-1);
      $scope.subaction = subaction;
      $scope.addaction = addaction;
      if (action) {
        $scope.recorder[actionindex].action = action;
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

    // update $scope.stats { playerid: {action:..., action:... } }
    $scope.updateScorebox = function () {

      // init statsheets:
      var players = GameDatasFact.teams[0].players, playerlength = players.length;
      for (var i = 0; i < playerlength; i++) {
        var playerid = players[i].id;          
        $scope.stats[playerid] = {};
        angular.forEach(ActionsDatasFact.dictio, function(act, id) {
          if (typeof act.addtostatsheet !== 'undefined') {
            $scope.stats[playerid][id] = act.addtostatsheet;
          }
        });
      }

      // calculate statsheets:
      // for each play...
      var playbyplay = GameDatasFact.playbyplay, playslength = playbyplay.length;
      for (var i = 0; i < playslength; i++) {

        // for each actions...
        var plays = playbyplay[i], playslength = plays.length;
        for (var j = 0; j<playslength; j++) {
          var play = plays[j], playerid = play.playerid;
          // each actions ...
          var actions = play.action, actionslength = actions.length;
          for (var k = 0; k<actionslength; k++) {

            // use code:
            var action = actions[k];
            if (typeof $scope.stats[playerid][action] !== 'undefined') {
              $scope.stats[playerid][action]++;
            }
            // extra stats
            switch(action) {
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
.filter('playByPlay', function($filter, ActionsDatasFact) {
  return function(play) {
    var output = '';
    for (var i=0; i<play.length; i++) {
      var action = play[i].action;
      if (action.length === 2) {
        action = action[1];
      }
      else {
        action = action[0];
      }
      var player = $filter('playerFromPid')(play[i].playerid);
      var descr = ActionsDatasFact.dictio[action].pplabel + ' ';
      output += descr.replace("@", player.name);
    }
    return output;
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