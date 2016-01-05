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
	    session.expiresOn = new Date(now.setSeconds(now.getSeconds() + session.ttlSec));
	    return session;
	};

	var get = function (xSessionToken) {
    	var session = null;
    	return cache.get(xSessionToken)
			.then(function(result){
				if (result) {
				session = setExpiryDate(result);
				return cache.setExpiry(session.xSessionToken, session.ttlSec);
				} else {
					return promise.reject({ code: 401, msg: 'Invalid xSessionToken'});
				}
			})
			.then(function(result){
				return promise.resolve(session);
			});
	};

	var save = function(session){
		session = setExpiryDate(session);
		return cache.set(session.xSessionToken, session, session.ttlSec)
			.then(function(result){
				if (result == 1) {
					return promise.resolve(session);
				} else {
					return promise.reject('Failed to save session');
				}

			});
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
			            return save(session);
	        		})
	            	.then(function(result){
	            		return promise.resolve(session);
	            	});
			},
	        get: get,
	        validate: function(xSessionToken){
	        	return get(xSessionToken)
	        		.then(function(result){
	        			return promise.resolve({
	                        isValid: true,
	                        expiresOn: result.expiresOn,
	                        ttlSec: result.ttlSec
	                    });
	        		});
	        },
	        del: function(xSessionToken) {
	        	return cache.del(xSessionToken)
	        		.then(function(result){
	        			if (result != true) {
	        				return promise.reject({ code: 404, msg: 'Invalid xSessionToken: ' + xSessionToken});
	        			} else {
	        				return promise.resolve(result);
	        			}
	        		});
	        },
	        update: function(xSessionToken, sessionData){
	        	return get(xSessionToken)
	        		.then(function(result){
	        			//Prevent token manipulation
	        			sessionData.xSessionToken = xSessionToken;
	        			return save(sessionData);
	        		})
	       	},
	        patch: function(xSessionToken, newData) {
	        	return get(xSessionToken)
	        		.then(function(session){
			            for (var key in newData) {
			                session[key] = newData[key];    
			            }
			            return save(session);
	        		});
	        }
	    };
	}());
};