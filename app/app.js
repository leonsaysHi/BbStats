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

	app.factory('ChronoFact', function($q, $indexedDB) {
	    return {
	    	quarter : 0,
	    	time : 0, // in minutes
	    	readabletime : "00:00:00",
			play : function() {
				this.time -= 1;
				this.updateReadableTime();
			},
			stop : function() {
				this.updateReadableTime();
			},
			setTime : function(t) {
				this.time = t;
				this.updateReadableTime();
			},
			changeTime : function(t) {
				this.time += t;
				this.updateReadableTime();
			},
			setQuarter : function(n) {
				this.quarter = n;
			},
			changeQuarter : function(n) {
				this.quarter += n;
			},
			updateReadableTime : function() {
				var t = this.time;
				var m = Math.floor(t);
				var s = Math.floor((t % 1)*10);
				this.readabletime = m + ':' + s;
			} 
	    }; 
	});

})();