(function(){
  'use strict';


  angular
    .module('bbstats')
    .config(function ($routeProvider) {
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
    })

    .controller('Game', function ($scope, $routeParams, gameDatas, ChronoFact) {
      $scope.gamedatas = gameDatas;
      ChronoFact.setTime(45);
      ChronoFact.setQuarter(4);
      // current time : ChronoFact.time;
    })

    .controller('Chrono', function ($scope, $routeParams, ChronoFact ) {
            
      $scope.isplaying = false;

      $scope.$watch(function () { return ChronoFact.readabletime }, function (newVal, oldVal) {
        if (typeof newVal !== 'undefined') {
          $scope.chrono = ChronoFact.readabletime;
        }
      });

      $scope.$watch(function () { return ChronoFact.quarter }, function (newVal, oldVal) {
        if (typeof newVal !== 'undefined') {
          $scope.qt = ChronoFact.quarter;
        }
      });

      $scope.play = function() {
        $scope.isplaying = true;
        ChronoFact.play();
      };

      $scope.stop = function() {
        $scope.isplaying = false;
        ChronoFact.stop();
      };
    })

  ;

})();