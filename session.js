var promise				= require('bluebird');
var _					= require('underscore');
var uuid				= require('uuid');

exports.create =  function (cnf, lgr, cch) {
	var config 	= cnf;
	var logger 	= lgr;
	var cache	= cch;

	var handleError = function(err) {
		logger.error('Error using cache');
		logger.error(err);
		return promise.reject(err);
	};

	var validateKey = function(xAuthKey) {

	    if (xAuthKey == null || xAuthKey.length <= 0) {
	    	return promise.reject({ code: 401, msg: 'Missing x-auth-key header'});
	    } else {
	    	var found = _.find(config.xAuthKeys, function(appKey) { return appKey === xAuthKey; });
	    	if (found) {
	    		return promise.resolve(true);
	    	} else {
	    		return promise.reject({ code: 401, msg: 'Invalid x-auth-key: ' + xAuthKey});
	    	}
	    }
	};

	var setExpiryDate = function (session){
	    var now = new Date();
	    session.ttlSec = Number(session.ttlSec || config.defaultTtlSec);
	    session.Expires = new Date(now.setSeconds(now.getSeconds() + session.ttlSec));
	    return session;
	};

	return (function () {
	    return {
	        validateKey: validateKey,
	        create: function (xAuthKey, input) {
	        	var session = null;
	        	return validateKey(xAuthKey)
	        		.then(function(result){
	        			session = JSON.parse(JSON.stringify(input));
			            session.xSessionToken = session.xSessionToken || uuid.v4();
			            session = setExpiryDate(session);
			            return cache.set(session.xSessionToken, session, session.ttlSec);
	        		})
	            	.then(function(result){
	            		return promise.resolve(session);
	            	});
			},
	        get: function (xSessionToken) {
	        	var session = null;
	        	return cache.get(xSessionToken)
					.then(function(result){
						session = setExpiry(result);
						return cache.setExpiry(session.xSessionToken, xSession.ttlSec);
					})
					.then(function(result){
						return promise.resolve(session);
					});
			},			
	        // del: function (key) {
	        // 	return getRedisClient()
	        // 		.then(function(client) {
	        // 			return client.del(key);
	        // 		})
	        // 		.then(function(result){
	        // 			return promise.resolve(result == true);
	        // 		})
	        // 		.catch(function(err){
	        // 			return handleError(err);
	        // 		});
	        // }	        
	    };
	}());
};