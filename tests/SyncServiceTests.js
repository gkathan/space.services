var winston = require('winston');
var _ = require('lodash');
var config = require('config');

winston.loggers.add('test_log',{
	console:{
		colorize:true,
		prettyPrint:true,
		showLevel:true,
		timestamp:true,
		level:"debug"
	},
    file:{
		filename: 'logs/test.log' ,
		prettyPrint:true,
		showLevel:true,
		level:"debug"
	}
});

var logger = winston.loggers.get('test_log');
var assert = require("assert")


describe('SyncServices', function(){
  describe('getLastSync', function(){
    it('should return last sync info for given syncName', function(done){

      var syncService = require('../services/SyncService');

			syncService.getLastSync("socoutages",function(err,result){
					logger.debug("Outages : "+JSON.stringify(result));
					assert.equal("socoutages", result.name);
					done();
			})

		});
	});

  describe('getLastSyncs', function(){
    it('should return last syncs info for given syncNames', function(done){

      var syncService = require('../services/SyncService');

			var _syncers=[];

			_syncers.push({name:"socoutages",sync:config.sync.socoutages});
			_syncers.push({name:"socservices",sync:config.sync.socservices});

			logger.debug("_syncers: "+JSON.stringify(_syncers));

			syncService.getLastSyncs(_syncers,function(err,result){
				logger.debug("LastSyncs : "+JSON.stringify(result));
				assert.equal(2, result.length);
				assert.equal("socoutages",_.findWhere(result,{"name":"socoutages"}).name);
				done();
			})

		});
	});


})
