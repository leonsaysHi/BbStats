(function(){
  'use strict';

  var app = angular.module('bbstats');
 
  
  app.controller('PlayByPlay', function ($scope, $filter, GameDatasFact, PlaysRecordFact) {

    // watch play
    $scope.$watch(
      function () { return GameDatasFact.playbyplay; },
      function (newVal, oldVal) {
        $scope.plays = GameDatasFact.playbyplay;
        // $scope.updateScorebox();
      },
      true
    );

    $scope.deletePlay = function(index){
      index = GameDatasFact.playbyplay.length-1-index;
      GameDatasFact.playbyplay.splice(index, 1);
      $scope.saveGameDatasFact();
    };

    $scope.editPlay = function(index){
      index = GameDatasFact.playbyplay.length-1-index;
      PlaysRecordFact.edit(index);
      $scope.gotoEditTab();
    };



  })
  .filter('playByPlayLog', function($filter, ActionsDatasFact) {
    return function(play) {
      var output = '';
      for (var i=0; i<play.length; i++) {
        //player
        var player = $filter('playerFromPid')(play[i].playerid);
        // action
        if (play[i].action) {
          var ref, refs = play[i].action.refs;
          if (refs.length === 2) {
            ref = refs[1];
          }
          else {
            ref = refs[0];
          }
          if(typeof ref !== 'undefined') {
            var descr = ActionsDatasFact.dictio[ref].pplabel + ' ';
            output += descr.replace("@", player.name);
          }
        }
        else {
          output += player.name + '... ';
        }

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
  .filter('reverse', function() {
    return function(items) {
      return items.slice().reverse();
    };
  });


})();