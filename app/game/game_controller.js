(function(){
  'use strict';


  var app = angular.module('bbstats');
 
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
      'plusminus': {addtostatsheet:'array'},
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
      $scope.gametab = 0;

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

      $scope.gotoEditTab = function() {
        $scope.gametab = 0;
      };

      // Saving current game state
      $scope.saveGameDatasFact = function() {
        var gamedatas = GameDatasFact;
        $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
          store.upsert (gamedatas).then(function(e){console.log('upsert');});
        });
      };

    })
    .directive('playEditor', function(){
        return {
            restrict: 'E',
            templateUrl: 'game/game.playeditor.html',
            controller: 'PlayEditor'
        };
    })
    .directive('playByPlay', function(){
        return {
            restrict: 'E',
            templateUrl: 'game/game.playbyplay.html',
            controller: 'PlayByPlay'
        };
    })
    .directive('scoreBox', function(){
        return {
            restrict: 'E',
            templateUrl: 'game/game.scorebox.html',
            controller: 'ScoreBox'
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