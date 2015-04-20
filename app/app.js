(function(){
	'use strict'; 

	var app = angular.module( 
		'bbstats',
		['ngRoute','indexedDB', 'templates']
		);

	app.constant('config', {
		indexedDb : {
			gameStore : 'games'
		}
	});


	app.config(function (config, $routeProvider,$indexedDBProvider) {// Routes
		$routeProvider
		.otherwise({
			redirectTo: '/'
		})
		;
			// IndexedDB
			$indexedDBProvider 
			.connection('BbStats')
			.upgradeDatabase(1, function(event, db, tx){
				var objStore = db.createObjectStore(config.indexedDb.gameStore, {keyPath: 'id', autoIncrement:true});
				objStore.createIndex('id', 'id', {unique: true});
			})
			;
		}
	);

	app.directive('showTab', function () {
        return {
            link: function (scope, element, attrs) {
                $(element).on('click', function(e) {
                    e.preventDefault();
                    $(this).tab('show');
                });
            }
        };
    });

})();