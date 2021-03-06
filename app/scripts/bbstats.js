(function(){
	'use strict';

	var app = angular.module(
		'bbstats',
		[
			'templates',
			'ui.router',
			'ngAnimate',
			'indexedDB'
		]
	)

	.constant('config', {
		indexedDb : {
			gameStore : 'games'
		}
	})

	.config(['config', '$stateProvider', '$urlRouterProvider', '$indexedDBProvider', '$animateProvider', function (config, $stateProvider, $urlRouterProvider, $indexedDBProvider, $animateProvider) {// Routes

		$urlRouterProvider.otherwise('/');

	    $stateProvider

		    .state({
		    	name: 'home',
		        url: '/',
		        templateUrl: 'main/main.html',
		        controller: 'MainCtrl'
		    })

		    .state('gameconfig', {
		        url : '/gameconfig/:gameId',
		        templateUrl: 'gameconfig/gameconfig.html',
		        controller: 'gameConfig',
		        resolve: {
		          gameDatas : ['config', '$stateParams', '$q', '$indexedDB', function(config, $stateParams, $q, $indexedDB) {
		            var id = $stateParams.gameId;
		            if(id == 'new') {
		              return {
		                id : new Date().valueOf()
		              };
		            }
		            else {
		              var deferred = $q.defer();
		              $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
		                store.find(parseInt(id)).then(function(data) {
		                  deferred.resolve(data);
		                });
		              });
		              return deferred.promise;
		            }
		          }]
		        }
		    })

		    .state('game', {
		        url : '/game/:gameId',
		        templateUrl: 'game/game.html',
		        controller:  'Game',
		        resolve: {
		          gameDatas : ['config', '$stateParams', '$q', '$indexedDB', function(config, $stateParams, $q, $indexedDB) {
		            var
			            deferred = $q.defer(),
			            id = $stateParams.gameId
		            ;
		            $indexedDB.openStore(config.indexedDb.gameStore, function(store) {
		              store.find(parseInt(id)).then(function(data) {
		                deferred.resolve(data);
		              });
		            });
		            return deferred.promise;
		          }]
		        }
		    })
	    ;

	    // animate
	    // $animateProvider.classNameFilter(/animated/);

		// IndexedDB
		$indexedDBProvider
			.connection('BbStats')
			.upgradeDatabase(1, function(event, db, tx){
				var objStore = db.createObjectStore(config.indexedDb.gameStore, {keyPath: 'id', autoIncrement:true});
				objStore.createIndex('id', 'id', {unique: true});
			})
		;
	}]);

})();
