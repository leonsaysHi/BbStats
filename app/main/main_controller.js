(function(){
  'use strict';


  angular.module('main',['ngRoute'])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'main/main.html',
        controller: 'MainCtrl'
      })
    ;
  })
  .controller('MainCtrl', function ($scope, $indexedDB) {
    
    $scope.statsheets = [];
    
    // get from indexedDB
    $indexedDB.openStore('statsheets', function(store) {
      store.getAll().then(function(statsheets) {
        $scope.statsheets = statsheets;
      });
    });

  });

})();