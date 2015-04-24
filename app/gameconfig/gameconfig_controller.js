(function(){
  'use strict';


  angular.module('bbstats')

  .controller('gameConfig', function ($scope, $state, $filter, config, $stateParams, $indexedDB, gameDatas, GameDatasFact) {

    angular.merge(GameDatasFact, gameDatas);
    
    $scope.gamedatas = GameDatasFact;

    $scope.addPayer = function() {
      var test = true, id;
      // find unique id :
      while (test === true) {
        id = Math.round(Math.random()*10000);
        var f = $filter('filter')($scope.gamedatas.teams[0].players, function (player) {
          return (player.id === id);
        });
        test = !(f.length === 0);
      }
      $scope.gamedatas.teams[0].players.push({id:id, playing:false});
    };

    $scope.removePlayer = function(index) {      
      $scope.gamedatas.teams[0].players.splice(index, 1);
    };

    $scope.save = function() {
      $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
        if ($stateParams.gameId !== 'new') {
          store.upsert(GameDatasFact).then(function(e){console.log(e);});
        }
        else {
          store.insert(GameDatasFact).then(function(e){console.log(e);});
        }
        $state.go('home');
      });
    };

  });

})();