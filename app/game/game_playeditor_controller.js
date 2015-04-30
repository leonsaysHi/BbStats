(function(){
  'use strict';

  var app = angular.module('bbstats');

  app.controller('PlayEditor', function ($scope, $filter, GameDatasFact, ActionsDatasFact, PlaysRecordFact) {

    $scope.init = function(teamid) {
      $scope.teamid = teamid
      $scope.team = GameDatasFact.teams[teamid];
      $scope.opponent = GameDatasFact.teams[1].player;
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
    $scope.setPlayerPlayingStatus = function(playerid, isplaying) {   
      var 
      player = $filter('playerFromPid')(playerid),
      index_bp = GameDatasFact.teams[$scope.teamid].players.indexOf(player)
      ;
      GameDatasFact.teams[$scope.teamid].players[index_bp].playing = isplaying;
    };

    // Actions
    $scope.getStepAnim = function(step) {
      if ($scope.showplayers()) { 
        return 'up';
      }
      else if ($scope.showactions()) {
        switch(step) {
          case 'players' : return 'down'; break;
          default : return 'up';
        }
      }
      else if ($scope.showsubactions()) {        
        switch(step) {
          case 'players' :
          case 'actions' :
          case 'subactions' : return 'down'; break;
          default : return 'up';
        }
      }
      else if ($scope.showaddactions()) {                
        return 'down';
      }
    };
    $scope.showplayers = function() {
      return (PlaysRecordFact.play.length===0);
    };
    $scope.showactions = function() {
      return (GameDatasFact.chrono.total_time>0 && !PlaysRecordFact.ui.oppaction && PlaysRecordFact.play.length>0 && PlaysRecordFact.play[0].playerid && !PlaysRecordFact.ui.subaction);
    };
    $scope.showsubactions = function() {
      return (GameDatasFact.chrono.total_time>0 && !PlaysRecordFact.ui.oppaction && PlaysRecordFact.play.length>0 && PlaysRecordFact.ui.subaction && !PlaysRecordFact.ui.addaction);
    };
    $scope.showaddactions = function() {
      return (GameDatasFact.chrono.total_time>0 && !PlaysRecordFact.ui.oppaction && PlaysRecordFact.play.length>0 && PlaysRecordFact.ui.addaction);
    };
    $scope.playIsSavable = function() {
      return (PlaysRecordFact.play[0] && PlaysRecordFact.play[0].playerid && PlaysRecordFact.play[0].action && !PlaysRecordFact.play[0].action.subaction);
    };


    $scope.playInsert = function(player) {
      if (PlaysRecordFact.play.length>0) {
        $scope.selectPlayer(player);
        return;
      }
      var
      time = GameDatasFact.chrono.total_time,
      curr_time = GameDatasFact.chrono.curr_time,
      curr_period = GameDatasFact.chrono.curr_period
      ;
      $scope.resetPlay();
      PlaysRecordFact.play.push({
        time: time,
        curr_time: curr_time,
        curr_period: curr_period,
        teamid: $scope.teamid,
        player: false,
        playerid: false,
        action: false
      });
      // pregame substitution ?
      if (typeof player !== 'undefined') {
        $scope.selectPlayer(player);
      }
    };
    $scope.selectPlayer = function(player) {
      PlaysRecordFact.play[0].player = player;
      PlaysRecordFact.play[0].playerid = player.id;
      PlaysRecordFact.ui.oppaction = (player.id ==='opp');
    };

    $scope.selectAction = function(action) {
      // ui
      PlaysRecordFact.ui.subaction = action.subaction;
      PlaysRecordFact.ui.addaction = action.addaction;      
      // add action to play
      PlaysRecordFact.play[0].action = action;
    };
    $scope.removeAction = function () {
      $scope.removeAddAction();
      PlaysRecordFact.play[0].action = false;
      PlaysRecordFact.ui.subaction = false;
      PlaysRecordFact.ui.addaction = false;
    };

    // Subaction
    $scope.selectSubAction = function(action) {
      $scope.removeAddAction();
      PlaysRecordFact.ui.addaction = action.addaction; 
      // add action to play
      PlaysRecordFact.play[0].action = action;
    };

    // Bench
    $scope.addStarter = function() {
      $scope.playInsert();
      PlaysRecordFact.play[0].action = ActionsDatasFact.hiddenactions.in;
      $scope.toggleBench(true);
    };
    $scope.substitution = function() {
      // add action to play
      PlaysRecordFact.play[0].action = ActionsDatasFact.hiddenactions.out;
      $scope.toggleBench(true);
    };
    $scope.selectBenchPlayer = function(player) {
      $scope.setPlayerPlayingStatus(player.id, true);
      // select starters
      if (PlaysRecordFact.play[0].action.id === 'in') {
        $scope.selectPlayer(player);
        $scope.savePlay();
      }
      else {
        $scope.setPlayerPlayingStatus(PlaysRecordFact.play[0].playerid, false);
        $scope.selectAddPlayerAction(player, ActionsDatasFact.hiddenactions.in);
      }
      $scope.toggleBench(false);
    };
    $scope.toggleBench = function(toggle) {
      $('#bench').foundation('reveal', (toggle) ? 'open' : 'close');      
    }

    // Addaction    
    $scope.insertAddAction = function() {
      var
      time = PlaysRecordFact.play[0].time,
      curr_time = PlaysRecordFact.play[0].curr_time,
      curr_period = PlaysRecordFact.play[0].curr_period
      ;
      $scope.removeAddAction();
      PlaysRecordFact.play.push({
        time: time,
        curr_time: curr_time,
        curr_period: curr_period,
        teamid: $scope.teamid,
        player: false,
        playerid: false,
        action: false
      });
    };
    $scope.selectAddPlayerAction = function(player, action) {
      $scope.insertAddAction();
      PlaysRecordFact.play[1].player = player;
      PlaysRecordFact.play[1].playerid = player.id; 
      PlaysRecordFact.play[1].action = action;
    };
    $scope.removeAddAction = function() {
      PlaysRecordFact.play.splice(1,1);
    };

    // Opponnent
    $scope.selectOpponent = function() {
      $scope.playInsert();
      PlaysRecordFact.play[0].player = GameDatasFact.teams[1].player;
      PlaysRecordFact.play[0].playerid = 'opp';
      PlaysRecordFact.ui.oppaction = true;
    };
    $scope.selectOpponentAction = function(action) {
      PlaysRecordFact.play[0].action = action;
    };


    // Save
    $scope.removePreview = function(n) {
      if (n==0) {
        $scope.removeAction();
      } 
      else if (n==1) {
        $scope.removeAddAction();
      }
    };    
    $scope.savePlay = function() {
      var play = PlaysRecordFact.play;
      //delete play.player;
      if(!PlaysRecordFact.ui.edit) {
        GameDatasFact.playbyplay.push(play);
      }
      else {
        GameDatasFact.playbyplay[PlaysRecordFact.ui.index] = play;
      }
      $scope.resetPlay();
      $scope.saveGameDatasFact();
    };
    $scope.resetPlay=function() {
      PlaysRecordFact.play = [];
      PlaysRecordFact.ui.edit = false;
      PlaysRecordFact.ui.subaction = false;
      PlaysRecordFact.ui.addaction = false;
      PlaysRecordFact.ui.oppaction = false;
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


app.filter('playByPlayPreview', function($filter, ActionsDatasFact) {
  return function(action) {
    var output = '';
    if (typeof action === 'undefined') { return '';}
      //player
      var player = $filter('playerFromPid')(action.playerid);
      // action
      if (action.action) {
        var ref, refs = action.action.refs ? action.action.refs : [action.action.subaction];
        if (refs.length === 2) {
          ref = refs[1];
        }
        else {
          ref = refs[0];
        }
        if (typeof ref !== 'undefined') {
          var descr = ActionsDatasFact.dictio[ref].pplabel + ' ';
          output += descr.replace("@", player.name);
        }
      }
      else {
        output += player.name + '... ';
      }

      return output;
    }
  });

})();