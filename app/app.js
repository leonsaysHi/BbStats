(function(){
	'use strict';

	angular.module('bbstats', [ 'ngRoute','indexedDB','main', 'sheetconfig','templates'])
	.config(function ($routeProvider,$indexedDBProvider) {
		$routeProvider
			.otherwise({
				redirectTo: '/'
			})
		;
		$indexedDBProvider 
		.connection('BbStats')
		.upgradeDatabase(1, function(event, db, tx){
			var objStore = db.createObjectStore('statsheets', {keyPath: 'id'});
			objStore.createIndex('name', 'name', {unique: false});
			objStore.createIndex('date', 'date', {unique: false});
		});
	});


})();