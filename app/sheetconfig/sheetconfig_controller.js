(function(){
  'use strict';


  angular.module('sheetconfig',['ngRoute'])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/sheetconfig/:sheetId', {
        templateUrl: 'sheetconfig/sheetconfig.html',
        controller: 'SheetConfig'
      })
    ;
  })
  .controller('SheetConfig', function ($scope, $routeParams, $indexedDB) {
    $scope.sheetdatas = {};
    $scope.sheetdatas.id = $routeParams.sheetId === 'new' ? (new Date()).valueOf() : parseInt($routeParams.sheetId);
    
    // get from indexedDB
    if ($routeParams.sheetId !== 'new') {
      $indexedDB.openStore('statsheets', function(store) {
        store.find($scope.sheetdatas.id).then(function(sheetdatas) {  
          // Update scope
          $scope.sheetdatas = sheetdatas;
        });
      });
    }

    // default sheet
    else {
      $scope.sheetdatas.nb_periods = 4;
      $scope.sheetdatas.periods_time = 10;
    }

    $scope.save = function() {
      $indexedDB.openStore('statsheets', function(store) {
        if ($routeParams.sheetId !== 'new') {
          store.upsert ($scope.sheetdatas).then(function(e){console.log(e);});
        }
        else {
          store.insert ($scope.sheetdatas).then(function(e){console.log(e);});
        }
      });
    };

  });

})();