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
	

	app.factory('GameFact', function() {
		return {
			id : null,
			name : '',
			teams : [],
			chrono : {
				nb_periods : 4,
    			minutes_periods : 10, // minutes
    			curr_period : 0,
		    	curr_time : 0, // in secondes
		    }
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


	app.filter('chronoTime', function () {
		return function (time) {
			var t = time;
			var m = Math.floor(t/60);
			var s = Math.floor(t-m*60);
			var ts = Math.floor((t-s-m*60)*10);
			var output =  
				((m<10) ? '0' + m : m) 
				+ ':' 
				+ ((s<10) ? '0' + s : s) 
				+ ':' 
				+ ts
			;
			return output;
		};
	});

	app.filter('chronoPeriod', function (GameFact) {
		return function (period) {
			var 
				ot = (period > GameFact.chrono.nb_periods),
				output = (ot) ? (period - GameFact.chrono.nb_periods) : period
			;
			switch (output) {
				case 1:
				output += 'st';
				break;
				case 2:
				output += 'nd';
				break;
				case 3:
				output += 'rd';
				break;
				default:
				output += 'th';
				break;
			}
			if (ot) { output += 'OT'; }
			return output;
		};
	});



})();