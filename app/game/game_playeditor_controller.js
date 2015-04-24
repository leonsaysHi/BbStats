(function(){
  'use strict';

  var app = angular.module('bbstats');
 
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
        //$scope.savePlay(); 
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
        //$scope.savePlay(); 
      }
    };

    $scope.noAddAction = function(){
      PlaysRecordFact.play.splice(1,1);
      if (!PlaysRecordFact.ui.edit) {
        //$scope.savePlay(); 
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

})();