(function(){
  'use strict';

  var app = angular.module('bbstats');
 
  
  app.controller('PlayByPlay', function ($scope, $filter, GameDatasFact, GameUIFact, PlayFact) {

    // watch play
    $scope.$watch(
      function () { return GameDatasFact.playbyplay; },
      function (newVal, oldVal) {
        $scope.plays = GameDatasFact.playbyplay;
        // $scope.updateScorebox();
      },
      true
    );

    $scope.tapPlay = function() {

    };

    $scope.clickDeletePlay = function(index){
      index = GameDatasFact.playbyplay.length-1-index;
      GameDatasFact.playbyplay.splice(index, 1);
      $scope.saveGameDatasFact();
    };

    $scope.clickEditPlay = function(index){
      index = GameDatasFact.playbyplay.length-1-index;
      GameUIFact.edit = true;
      PlayFact.edit(index);
      $scope.gotoRecorder();
    };



  })

  .directive('ngPlaybyplayItem', function() {
    return {
      restrict: 'A',
      controller: ['$scope', function($scope){
        //$scope.playid;
        //$scope.play;
        $scope.period = $scope.play[0].curr_period;
        $scope.time = $scope.play[0].curr_time;
        $scope.allowedit = false;
        $scope.allowdelete = false;
        $scope.tap=function(){
          if (!($scope.time>0)) { return; }
          if (!$scope.allowedit && !$scope.allowdelete) { $scope.allowedit = true; }
          else if ($scope.allowedit) { $scope.allowedit = false; $scope.allowdelete = true; }
          else if ($scope.allowdelete) { $scope.allowdelete = false; }
        };
      }]
    }
  })


  .filter('playByPlayLog', function($filter, ActionsDatasFact) {
    return function(play) {
      var output = '';
      for (var i=0; i<play.length; i++) {
        //player
        var player = $filter('playerFromPid')(play[i].playerid);
        if (typeof player === 'undefined') { continue; }
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