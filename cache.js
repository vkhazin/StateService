var promise				= require('bluebird');
var redis		 		= require('promise-redis')(function(resolver) {
						    return new promise(resolver);
						});

exports.create =  function (cnf, lgr) {
	var client 	= null;
	var config 	= cnf;
	var logger 	= lgr;

	var getRedisClient = function () {
		var url = process.env.REDISCLOUD_URL || config.redis.url;
	    if (!client) {
			logger.info('Connecting to ' + url);
    		client = redis.createClient(url);
 		}
		return promise.resolve(client);
	};

	var handleError = function(err) {
		logger.error('Error using cache');
		logger.error(err);
		return promise.reject(err);
	};

	var setExpiry = function(key, ttlSec) {
		return client.expire(key, ttlSec);
	};

	return (function () {
	    return {
	    	setExpiry : setExpiry,
	        get: function (key) {
	        	return getRedisClient()
	        		.then(function(client) {
	        			return client.get(key);
	        		})
	        		.then(function(value){
	        			return promise.resolve(JSON.parse(value));
	        		})
	        		.catch(function(err){
	        			return handleError(err);
	        		});
	        },
	        set: function (key, value, ttlSec) {
	        	return getRedisClient()
	        		.then(function(client) {
	        			value = JSON.stringify(value);
	        			return client.set(key, value);
	        		})
	        		.then(function(result){
        				return setExpiry(key, ttlSec);
        			})
	        		.catch(function(err){
	        			return handleError(err);
	        		});
	        },
	        del: function (key) {
	        	return getRedisClient()
	        		.then(function(client) {
	        			return client.del(key);
	        		})
	        		.then(function(result){
	        			return promise.resolve(result == true);
	        		})
	        		.catch(function(err){
	        			return handleError(err);
	        		});
	        }	        
	    };
	}());
};