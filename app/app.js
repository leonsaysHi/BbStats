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
			console.log(config);
			$indexedDBProvider 
				.connection('BbStats')
				.upgradeDatabase(1, function(event, db, tx){
					var objStore = db.createObjectStore(config.indexedDb.gameStore, {keyPath: 'id', autoIncrement:true});
					objStore.createIndex('id', 'id', {unique: true});
				})
			;
		}
	);
	

	app.factory('ChronoFact', function($interval) {
	    return {
	    	quarter : 0,
	    	time : 0, // in secondes
	    	readabletime : "00:00:00",
	    	timer : null,
			play : function() {
				console.log(typeof this.timer);
				var self = this;
				this.timer = $interval(
					function(){
						self.time -= 0.1;
						self.updateReadableTime();
					},
					100
				);
			},
			stop : function() {
				$interval.cancel(this.timer);
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
				var m = Math.floor(t/60);
				var s = Math.floor(t-m*60);
				var ts = Math.floor((t-s-m*60)*10);
				this.readabletime = m + ':' + s + ':' + ts;
			} 
	    }; 
	});



	app.factory('GameFact', function() {
	    return {
	    	quarter : 0,
	    	time : 0, // in secondes
	    	teams : []
	    }; 
	});



	app.factory('TeamFact', function() {
	    return {
	    	players : [],
	    	players_oncourt : [],
	    	plays : [],
			addplay : function(play) {
				this.plays.push(play);
			},
			removeplay : function(id) {
				this.plays.splice(id, 1);
			}
	    }; 
	});



})();