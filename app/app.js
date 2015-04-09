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
	

	app.factory('GameFact', function($interval) {
	    var o = {ds:{}, fs:{}};
	    o.ds = {
    		id : null,
    		name : '',
    		teams : [],
    		chrono : {
    			nb_periods : 4,
    			minutes_periods : 10,
	    		curr_period : 1,
		    	curr_time : null, // in secondes
		    	readabletime : null
		    }
	    };
	    o.fs = {
    		chrono : {
    			timer : null,
				play : function() {
					var self = this;
					this.timer = $interval(
						function(){
							o.ds.chrono.curr_time -= 0.1;
							o.fs.chrono.updateReadableTime();
						},
						100
					);
				},
				stop : function() {
					$interval.cancel(this.timer);
				},
				setTime : function(t) {
					o.ds.chrono.chrono.curr_time = t;
					o.fs.chrono.updateReadableTime();
				},
				changeTime : function(t) {
					o.ds.chrono.curr_time += t;
					o.fs.chrono.updateReadableTime();
				},
				setQuarter : function(n) {
					o.ds.chrono.quarter = n;
				},
				changeQuarter : function(n) {
					o.ds.chrono.quarter += n;
				},
				updateReadableTime : function() {
					if(o.ds.chrono.curr_time === null) {
						o.ds.chrono.curr_time = 60*o.ds.chrono.minutes_periods;
					}
					var t = o.ds.chrono.curr_time;
					var m = Math.floor(t/60);
					var s = Math.floor(t-m*60);
					var ts = Math.floor((t-s-m*60)*10);
					o.ds.chrono.readabletime = m + ':' + s + ':' + ts;
				}
			}
		};

	    o.setDatas = function(datas) {    		
    		angular.merge(o.ds, datas);
    	};
	    o.getDatas = function() {
    		return o.ds;
    	}; 

	    return o;
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