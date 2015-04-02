(function(){
	'use strict';

	var app = angular.module(
		'bbstats',
		['ngRoute','indexedDB','main', 'sheetconfig', 'game', 'templates'],
		function ($routeProvider,$indexedDBProvider) {
			// Routes
			$routeProvider
				.otherwise({
					redirectTo: '/'
				})
			;
			// IndexedDB
			$indexedDBProvider 
				.connection('BbStats')
				.upgradeDatabase(1, function(event, db, tx){
					var objStore = db.createObjectStore('statsheets', {keyPath: 'id'});
					objStore.createIndex('name', 'name', {unique: false});
					objStore.createIndex('date', 'date', {unique: false});
				})
			;
		}
	);

})();