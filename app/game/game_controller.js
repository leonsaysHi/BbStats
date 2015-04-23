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
        }, { 
          score: 0,
          player: {id:'opp', name:'Opponent', number:'#'}       
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


  app.factory('PlaysRecordFact', function(GameDatasFact, ActionsDatasFact) {
    return {
      play:[],
      ui: {},
      reset:function(){
        this.play=[];
        this.ui= {
          subaction:false,
          addaction:false,
          oppaction:false,
          edit:false,
          index:0
        };
      },
      edit:function(index){
        var 
        self = this,
        play = GameDatasFact.playbyplay[index]
        ;
        this.play = play;
        this.ui.edit = true;
        this.ui.index = index;
        this.ui.oppaction = (play[0].playerid==='opp');
        console.log(play, play.playerid);
        // set subaction/addaction
        this.ui.subaction = false;
        var action = $.grep(ActionsDatasFact.base, function(e){ return e.id == play[0].action.id; });
        if (action.length===0) {
          angular.forEach(ActionsDatasFact.subactions, function(subactions, id) {
            var i, subactionslength = subactions.length;
            var subaction = $.grep(ActionsDatasFact.subactions[id], function(e){ return e.id == play[0].action.id; });
            if (subaction.length===1) {
              console.log(subaction);
              self.ui.subaction = id;
              self.ui.addaction = subaction[0].addaction;
              return;
            }
          });
        }
      }
    };
  });

app.factory('ActionsDatasFact', function() {
  return {
    base: [
    {id:'fg', refs:false, subaction:'fg', addaction: false },
    {id:'rebdef', refs:['rebdef'], subaction:false, addaction: false }, 
    {id:'to', refs:['to'], subaction:false, addaction: false },
    {id:'st', refs:['st'], subaction:false, addaction: false },
    {id:'blk', refs:['blk'], subaction:false, addaction: false },
    {id:'pf', refs:['pf'], subaction:false, addaction: false }
    ],
    subactions: {
      fg: [
      {id:'fta', refs:['fta'], subaction:false, addaction: 'reboff'},
      {id:'fga2', refs:['fga2'], subaction:false, addaction:'reboff'},
      {id:'fga3', refs:['fga3'], subaction:false, addaction:'reboff'},
      {id:'ftm', refs:['fta','ftm'], subaction:false, addaction: false},
      {id:'fgm2', refs:['fga2','fgm2'], subaction:false, addaction:'ast'},
      {id:'fgm3', refs:['fga3','fgm3'], subaction:false, addaction:'ast'}
      ]
    },
    addactions: {
      'reboff': [{id:'reboff', refs:['reboff'], subaction:false, addaction: false}],
      'ast': [{id:'ast', refs:['ast'], subaction:false, addaction: false}]
    },
    hiddenactions: {
      'in': {id:'in', refs:['in'], subaction:false, addaction: false},
      'out': {id:'out', refs:['out'], subaction:false, addaction: false}
    },
    opponentactions: {
      'opp1': {id:'opp1', refs:['opp1'], subaction:false, addaction: false},
      'opp2': {id:'opp2', refs:['opp2'], subaction:false, addaction: false},
      'opp3': {id:'opp3', refs:['opp3'], subaction:false, addaction: false}
    },
    dictio: {
      'fg': {btnlabel:'Field goal'},
      'fta': {btnlabel:'1pt missed', pplabel:'@: free throw missed.', addtostatsheet:0},
      'fga2': {btnlabel:'2pts missed', pplabel:'@: 2pt shot: missed.', addtostatsheet:0},
      'fga3': {btnlabel:'3pts missed', pplabel:'@: 3pt shot: missed.', addtostatsheet:0},
      'ftm': {btnlabel:'1pt made', pplabel:'@: free throw made.', addtostatsheet:0, class:'text-bold'},
      'fgm2': {btnlabel:'2pts made', pplabel:'@: 2pt shot: made.', addtostatsheet:0, class:'text-bold'},
      'fgm3': {btnlabel:'3pts made', pplabel:'@: 3pt shot: made.', addtostatsheet:0, class:'text-bold'},
      'ast': {btnlabel:'Assist', pplabel:'Assist: @.', addtostatsheet:0},
      'rebdef': {btnlabel:'Defensive rebound', pplabel:'@: defensive rebound.', addtostatsheet:0},
      'reboff': {btnlabel:'Offensive rebound', pplabel:'Offensive rebound: @.', addtostatsheet:0},
      'to': {btnlabel:'Turn over', pplabel:'@: turnover', addtostatsheet:0},
      'st': {btnlabel:'Steal', pplabel:'@: steal.', addtostatsheet:0},
      'blk': {btnlabel:'Block', pplabel:'@: block shoot.', addtostatsheet:0},
      'pf': {btnlabel:'Foul', pplabel:'@: personnal foul.', addtostatsheet:0},
      'pts': {btnlabel:'Points', addtostatsheet:0},
      'playingtime': {addtostatsheet:'array'},
      'out': {pplabel:'@ is removed.'},
      'in': {pplabel:'@ enters the game.'},
      'opp1': {btnlabel:'+1', pplabel:'Opponent scores 1pt', class:'text-muted small'},
      'opp2': {btnlabel:'+2', pplabel:'Opponent scores 2pt', class:'text-muted small'},
      'opp3': {btnlabel:'+3', pplabel:'Opponent scores 3pt', class:'text-muted small'}

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
  * Scoreboard
  *
  * 
  */
  app
  .controller('Scoreboard', function ($scope, GameDatasFact) {

    $scope.$watch(
      function () { return GameDatasFact.teams[1].score; },
      function (newVal, oldVal) {
        console.log('new val', GameDatasFact.teams[1].score);
        $scope.opponentscore = GameDatasFact.teams[1].score;
      },
      true
      );

  });


  /**
  * Plays
  *
  * 
  */
  app.controller('PlayEditor', function ($scope, $filter, GameDatasFact, ActionsDatasFact, PlaysRecordFact) {


    $scope.init = function(teamid) {
      $scope.teamid = teamid
      $scope.team = GameDatasFact.teams[teamid];
      $scope.resetPlay();
      $scope.recorder = PlaysRecordFact;
      $scope.$watch(
        function () { return PlaysRecordFact; },
        function (newVal, oldVal) {
          $scope.recorder = PlaysRecordFact;
        },
        true
        );
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
    // push new action or update into play's actionindex
    $scope.selectPlayer = function(player, actionindex){
      console.log(player);
      var 
        actionindex = (typeof actionindex === 'undefined') ? false : actionindex // no play index : push
        ;
      // push new action :
      if(typeof PlaysRecordFact.play[actionindex] === 'undefined') {
        console.log('push action');
        var
        firstpush = (PlaysRecordFact.play.length===0),
        time = firstpush ? GameDatasFact.chrono.total_time : PlaysRecordFact.play[0].time,
        curr_time = firstpush ? GameDatasFact.chrono.curr_time : PlaysRecordFact.play[0].curr_time,
        curr_period = firstpush ? GameDatasFact.chrono.curr_period : PlaysRecordFact.play[0].curr_period
        ;
        PlaysRecordFact.play.push({
          time: time,
          curr_time: curr_time,
          curr_period: curr_period,
          teamid: $scope.teamid,
          player: false,
          playerid: false,
          action: false
        });
        actionindex = (PlaysRecordFact.play.length-1);
      }

      PlaysRecordFact.play[actionindex].player = player;
      PlaysRecordFact.play[actionindex].playerid = player.id;

      // pregame substitution ?
      if (GameDatasFact.chrono.total_time===0) {
        $scope.substitution();
      }

    };

    // click on action :
    // update into play's action index or play's last action
    $scope.selectAction = function(action) {   
      var 
      actionindex = PlaysRecordFact.play.length-1
      ;

      PlaysRecordFact.ui.subaction = action.subaction;
      PlaysRecordFact.ui.addaction = action.addaction;
      
      // add action to play
      PlaysRecordFact.play[actionindex].action = action;

      // save ?
      if (!PlaysRecordFact.ui.edit && !action.subaction && !action.addaction) {  
        $scope.savePlay(); 
      }
    };
    $scope.noSubaction = function(){
      PlaysRecordFact.ui.subaction = false;
    }

    // click on addaction
    $scope.selectAddAction = function(player, action) {
      $scope.selectPlayer(player, 1);
      PlaysRecordFact.play[1].action = action;

      // save ?
      if (!PlaysRecordFact.ui.edit && !action.subaction && !action.addaction) {  
        $scope.savePlay(); 
      }
    };

    $scope.noAddAction = function(){
      PlaysRecordFact.play.splice(1,1);
      if (!PlaysRecordFact.ui.edit) {
        $scope.savePlay(); 
      };
    };




    $scope.savePlay = function() {
      var play = PlaysRecordFact.play;
      delete play.player;
      if(!PlaysRecordFact.ui.edit) {
        console.log('SAVE', play);
        GameDatasFact.playbyplay.push(play);
      }
      else {
        console.log('EDIT', PlaysRecordFact.ui.index, play);
        GameDatasFact.playbyplay[PlaysRecordFact.ui.index] = play;
      }
      $scope.resetPlay();
      $scope.saveGameDatasFact();
    };
    $scope.resetPlay=function() {
      PlaysRecordFact.reset();
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
      if (PlaysRecordFact.play.length===1) {
        PlaysRecordFact.play[0].action = ActionsDatasFact.hiddenactions.out;
        var index_pp = GameDatasFact.teams[$scope.teamid].players.indexOf(PlaysRecordFact.play[0].player);
        GameDatasFact.teams[$scope.teamid].players[index_pp].playing = false;
      }

      // set as playing
      var index_bp = GameDatasFact.teams[$scope.teamid].players.indexOf(player);
      GameDatasFact.teams[$scope.teamid].players[index_bp].playing = true;
      $scope.selectPlayer(player);
      $scope.selectAction(ActionsDatasFact.hiddenactions.in);

      $('#bench').modal('hide'); 
    };

    // opponent
    $scope.selectOpponent = function() {
      PlaysRecordFact.ui.oppaction = true;
      $scope.selectPlayer({id:'opp'});
    };
    $scope.selectOpponentAction = function(action) {
     PlaysRecordFact.play[0].action = action;
     $scope.savePlay(); 
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
  .controller('Output', function ($scope, $filter, GameDatasFact, ActionsDatasFact, PlaysRecordFact) {

    // watch play
    $scope.$watch(
      function () { return GameDatasFact.playbyplay; },
      function (newVal, oldVal) {
        $scope.plays = GameDatasFact.playbyplay;
        $scope.updateScorebox();
      },
      true
      );

    // update $scope.stats { playerid: {action:..., action:... } }
    $scope.updateScorebox = function () {

      var stats = {}, teamscore = 0, opponentscore = 0;

      // init statsheets values:
      var players = GameDatasFact.teams[0].players, playerlength = players.length;
      for (var h = 0; h < playerlength; h++) {
        var playerid = players[h].id;          
        stats[playerid] = {};
        angular.forEach(ActionsDatasFact.dictio, function(act, id) {
          if (typeof act.addtostatsheet !== 'undefined') {
            stats[playerid][id] = (act.addtostatsheet==='array') ? [] : act.addtostatsheet;
          }
        });
      }

      // calculate statsheets:
      var playbyplay = GameDatasFact.playbyplay, playbyplaylength = playbyplay.length;
      // for each play...
      for (var i = 0; i < playbyplaylength; i++) {        
        var play = playbyplay[i], actionslength = play.length;
        // each action ...
        for (var j = 0; j<actionslength; j++) {
          var action = play[j], playerid = action.playerid, time = action.time, actcodeslength = action.action.refs.length;
          // each action code...
          for (var k = 0; k<actcodeslength; k++) {
            var ref = action.action.refs[k];

            // My team
            if (playerid !== 'opp') {
              // stats
              if (ref==='in') {
                var p = [time, GameDatasFact.chrono.total_time];
                stats[playerid].playingtime.push(p); 
              }
              else if (ref==='out') {
                var lastin = (stats[playerid].playingtime.length-1);
                stats[playerid].playingtime[lastin][1] = time;
              }
              else {
                stats[playerid][ref]++;
              }

              // calculate points
              if (ref==='ftm') {
                stats[playerid].pts += 1;
                teamscore += 1; 
              }
              else if (ref==='fgm2') {
                stats[playerid].pts += 2;
                teamscore += 2;  
              }
              else if (ref==='fgm3') {
                stats[playerid].pts += 3; 
                teamscore += 3; 
              }
            }

            // Opponents's team
            else {
              switch (ref) {
                case 'opp1' : opponentscore += 1; break;
                case 'opp2' : opponentscore += 2; break;
                case 'opp3' : opponentscore += 3; break;
              }
            }

          }
        }
      }

      GameDatasFact.teams[0].score = teamscore;
      GameDatasFact.teams[1].score = opponentscore;
      $scope.stats = stats;

    };

    $scope.deletePlay = function(index){
      index = GameDatasFact.playbyplay.length-1-index;
      GameDatasFact.playbyplay.splice(index, 1);
      $scope.saveGameDatasFact();
      $scope.updateScorebox();
    };

    $scope.editPlay = function(index){
      index = GameDatasFact.playbyplay.length-1-index;
      var play = GameDatasFact.playbyplay[index];
      PlaysRecordFact.edit(index);
    };

    // init 
    // 
    $scope.updateScorebox();


  })
.filter('playByPlay', function($filter, ActionsDatasFact) {
  return function(play) {
    var output = '';
    for (var i=0; i<play.length; i++) {
      var ref, refs = play[i].action.refs;
      if (refs.length === 2) {
        ref = refs[1];
      }
      else {
        ref = refs[0];
      }
      var player = $filter('playerFromPid')(play[i].playerid);
      var descr = ActionsDatasFact.dictio[ref].pplabel + ' ';
      output += descr.replace("@", player.name);
    }
    return output;
  }
})
.filter('playerFromPid', function (GameDatasFact) {
  return function (id) {
    if (id==='opp') { return GameDatasFact.teams[1].player; }
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