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
			teams : [
				{ // 1st team :
					name : '',
					color: '',
					players : [
						// {name, number, playing}
						]
					}
					],
					chrono : {
						nb_periods : 4,
    			minutes_periods : 10, // minutes
    			curr_period : 0,
		    	curr_time : 0, // in secondes
		    }
		};
	});

	app.filter('getBenchPlayers', function () {
		return function (players) {
			var filtered = [];
			for (var i = 0; i < players.length; i++) {
				var player = players[i];
				if (player.playing===false) {
					filtered.push(player);
				}
			}
			return filtered;
		};
	});

	app.filter('getCourtPlayers', function () {
		return function (players) {
			var filtered = [];
			for (var i = 0; i < players.length; i++) {
				var player = players[i];
				if (player.playing===true) {
					filtered.push(player);
				}
			}
			return filtered;
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