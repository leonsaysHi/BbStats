(function(){
  'use strict';

  var app = angular.module('bbstats');
 
  
  /**
  * Output
  *
  * 
  */
  app.controller('ScoreBox', function ($scope, $filter, GameDatasFact, ActionsDatasFact, PlayFact) {

    // update $scope.stats { playerid: {action:..., action:... } }
    $scope.updateScorebox = function () {

      var stats = {}, teamscore = 0, opponentscore = 0;

      // init statsheets values:
      var h = 0, players = GameDatasFact.teams[0].players, playerlength = players.length;
      for (; h < playerlength; h++) {
        var playerid = players[h].id;          
        stats[playerid] = {};
        angular.forEach(ActionsDatasFact.dictio, function(act, id) {
          if (typeof act.addtostatsheet !== 'undefined') {
            stats[playerid][id] = (act.addtostatsheet==='array') ? [] : act.addtostatsheet;
          }
        });
      }

      // calculate statsheets:
      var i = 0,  playbyplay = GameDatasFact.playbyplay, playbyplaylength = playbyplay.length;
      // for each play...
      for (; i < playbyplaylength; i++) {        
        var j = 0, play = playbyplay[i], actionslength = play.length;
        // each action ...
        for (; j<actionslength; j++) {
          var k = 0, action = play[j], playerid = action.playerid, time = action.time, refslength = action.action.refs.length;
          // each action code...
          for (; k<refslength; k++) {
            var ref = action.action.refs[k];

            // My team
            if (playerid !== 'opp' && typeof stats[playerid] !== 'undefined') {
              // stats
              if (ref==='in') {
                stats[playerid].playingtime.push([time]); 
                stats[playerid].plusminus.push([teamscore-opponentscore]); 
              }
              else if (ref==='out') {
                var lastin = (stats[playerid].playingtime.length-1);
                stats[playerid].playingtime[lastin].push(time);
                stats[playerid].plusminus[lastin].push(teamscore-opponentscore);
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
            else if (playerid == 'opp') {
              switch (ref) {
                case 'opp1' : opponentscore += 1; break;
                case 'opp2' : opponentscore += 2; break;
                case 'opp3' : opponentscore += 3; break;
              }
            }

          }
        }
      }

      // closing playingminutes and plusminus values :
      var l = 0, players = GameDatasFact.teams[0].players, playerlength = players.length;
      for (; l < playerlength; l++) {
        var playerid = players[l].id, lastin = (stats[playerid].playingtime.length-1);
        if (lastin > -1 && stats[playerid].playingtime[lastin].length<2) {
          stats[playerid].playingtime[lastin].push(GameDatasFact.chrono.total_time);
          stats[playerid].plusminus[lastin].push(teamscore-opponentscore);
        }
      }

      GameDatasFact.teams[0].score = teamscore;
      GameDatasFact.teams[1].score = opponentscore;
      $scope.stats = stats;

    };

    // init 
    // 
    $scope.updateScorebox();

  })

  .filter('statsPlayingMinutes', function() {
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
  .filter('statsPlusMinus', function() {
    return function(inout) {
      var pm=0, i=0, inoutlength = inout.length;
      for (;i<inoutlength;i++) {
        var a = inout[i];
        pm += a[1] - a[0];
      }
      return pm;
    }
  }); 


})();


