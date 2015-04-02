(function(){
  'use strict';


  angular
    .module('game', ['ngRoute'])
    .config(function ($routeProvider) {
      $routeProvider
      .when('/game/:sheetId', {
        templateUrl: 'game/game.html',
        controller: 'Game',
        resolve: {
          statSheetDatas : function ($route, $q, $indexedDB) {
            var deferred = $q.defer(),
            id = parseInt($route.current.params.sheetId);

            $indexedDB.openStore('statsheets', function(store) {
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

    .controller('Game', function ($scope, $routeParams, statSheetDatas, ChronoFact) {
      $scope.sheetdatas = statSheetDatas;
      ChronoFact.setTime(45);
      ChronoFact.setQuarter(4);
    })

    .controller('Chrono', function ($scope, $routeParams, ChronoFact ) {
      
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
        ChronoFact.play();
      };

      $scope.stop = function() {
        ChronoFact.stop();
      };
    })

  ;

})();