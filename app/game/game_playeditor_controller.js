(function(){
  'use strict';

  var app = angular.module('bbstats');

  app.controller('PlayEditor', function ($scope, $filter, GameDatasFact, ActionsDatasFact, GameUIFact, PlayFact) {

    
      $scope.teamid = 0
      $scope.team = GameDatasFact.teams[0];
      $scope.opponent = GameDatasFact.teams[1];
      $scope.recorder = PlayFact;
      
      $scope.$watch(
        function () { return PlayFact; },
        function (newVal, oldVal) {
          $scope.recorder = PlayFact;
        },
        true
      );

      $scope.$watch(
        function () { return GameUIFact; },
        function (newVal, oldVal) {
          console.log(GameUIFact, GameDatasFact.chrono.total_time>0, !GameUIFact.oppaction, PlayFact.play.length>0, GameUIFact.addaction);
          $scope.subaction = GameUIFact.subaction;
          $scope.addaction = GameUIFact.addaction;
          $scope.edit = GameUIFact.edit;
        },
        true
      );


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

    $scope.doAddStarter = false;

    $scope.showplayers = function() {
      return (PlayFact.play.length===0);
    };
    $scope.showactions = function() {
      return (GameDatasFact.chrono.total_time>0 && !GameUIFact.oppaction && PlayFact.play.length>0 && PlayFact.play[0].playerid && !GameUIFact.subaction);
    };
    $scope.showsubactions = function() {
      return (GameDatasFact.chrono.total_time>0 && !GameUIFact.oppaction && PlayFact.play.length>0 && GameUIFact.subaction && !GameUIFact.addaction);
    };
    $scope.showaddactions = function() {
      return (GameDatasFact.chrono.total_time>0 && !GameUIFact.oppaction && PlayFact.play.length>0 && GameUIFact.addaction);
    };
    $scope.playIsSavable = function() {
      return (PlayFact.play[0] && PlayFact.play[0].playerid && PlayFact.play[0].action && !PlayFact.play[0].action.subaction);
    };


    $scope.selectPlayer = function(player, isaddaction) {
      if(typeof isaddaction === 'undefined' || !isaddaction) {
        $scope.edit = false;
        GameUIFact.subaction = false;
        GameUIFact.addaction = false;
        GameUIFact.oppaction = (player.id ==='opp');
        PlayFact.init($scope.teamid, player);
      }
    };

    $scope.selectAction = function(action, isaddaction) {
      if(typeof isaddaction === 'undefined' || !isaddaction) {
        GameUIFact.subaction = action.subaction;
        GameUIFact.addaction = action.addaction; 
        PlayFact.selectAction(action, isaddaction);        
      }
    };
    $scope.removeAction = function (isaddaction) {
      PlayFact.removeAction(isaddaction);
      if(typeof isaddaction === 'undefined' || !isaddaction) {
        GameUIFact.subaction = false;
        GameUIFact.addaction = false;
      }
    };

    // Subaction
    $scope.selectSubAction = function(action) {
      $scope.removeAction(true);
      GameUIFact.addaction = action.addaction; 
      // add action to play
      PlayFact.selectAction(action);
    };

    // Bench
    $scope.addStarter = function() {
      $scope.addStarter = true;
      PlayFact.init($scope.teamid);
      PlayFact.selectAction(ActionsDatasFact.hiddenactions.in);
      $scope.toggleBench(true);
    };
    $scope.substitution = function() {
      //PlayFact.init($scope.teamid);
      PlayFact.selectAction(ActionsDatasFact.hiddenactions.out);
      $scope.toggleBench(true);
    };
    $scope.selectBenchPlayer = function(player) {
      $scope.setPlayerPlayingStatus(player.id, true); // Todo: move to Factory
      // select starters
      if ($scope.doAddStarter) {
        PlayFact.selectPlayer(player);
        $scope.doAddStarter = false;
        $scope.savePlay(); // Todo: move to Factory
      }
      else {
        $scope.setPlayerPlayingStatus(PlayFact.play[0].playerid, false); // Todo: move to Factory
        PlayFact.initAddAction();
        PlayFact.selectPlayer(player, true);
        PlayFact.selectAction(ActionsDatasFact.hiddenactions.in, true);
      }
      $scope.toggleBench(false);
    };
    $scope.toggleBench = function(toggle) {
      $('#bench').foundation('reveal', (toggle) ? 'open' : 'close');      
    }

    // Addaction    
    $scope.selectAddAction = function(player, action) {
      PlayFact.initAddAction();
      PlayFact.selectPlayer(player, true);
      PlayFact.selectAction(action, true);
    };

    // Opponnent
    $scope.selectOpponent = function() {
      PlayFact.init($scope.teamid);
      $scope.selectPlayer(GameDatasFact.teams[1].player);
      GameUIFact.oppaction = true;
    };



    // Save
    $scope.removePreview = function(n) {
      if (n==0) {
        $scope.removeAction();
      } 
      else if (n==1) {
        PlayFact.removeAction(true);
      }
    };    
    $scope.savePlay = function() {
      var play = PlayFact.play;
      //delete play.player;
      if(!$scope.edit) {
        GameDatasFact.playbyplay.push(play);
      }
      else {
        GameDatasFact.playbyplay[$scope.index] = play;
      }
      $scope.resetPlay();
      $scope.saveGameDatasFact();
    };
    $scope.resetPlay=function() {
      PlayFact.reset();
      $scope.edit = false;
      GameUIFact.subaction = false;
      GameUIFact.addaction = false;
      GameUIFact.oppaction = false;
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