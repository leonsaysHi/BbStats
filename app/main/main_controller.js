(function(){
  'use strict';


  angular.module('bbstats')
  .controller('MainCtrl', function ($scope, config, $indexedDB) {
    
    $scope.songs=['Sgt. Peppers Lonely Hearts Club Band','With a Little Help from My Friends','Lucy in the Sky with Diamonds','Getting Better' ,'Fixing a Hole','Shes Leaving Home','Being for the Benefit of Mr. Kite!' ,'Within You Without You','When Im Sixty-Four','Lovely Rita','Good Morning Good Morning','Sgt. Peppers Lonely Hearts Club Band (Reprise)','A Day in the Life'];
    
    // get Games list :
    $scope.getGamesList = function(){
      $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
        store.getAll().then(function(gamesdatas) {
          $scope.gamesdatas = gamesdatas;
        });
      });
    };
    

    $scope.deleteGame = function (id) {
      $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
        store.delete(id);
        $scope.getGamesList();
      });
    };

    $scope.getGamesList();

  });

})();