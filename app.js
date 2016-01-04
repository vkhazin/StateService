/*********************************************************************************
Dependencies
**********************************************************************************/
var uuid           = require('uuid');
var restify 	   = require('restify');
var config 		   = require('config');
var logger         = require('./logger').getLogger();
var cache          = require('./cache').create(config, logger);
var session        = require('session').create(config, logger, cache);
/*********************************************************************************/

/**********************************************************************************
Configuration
**********************************************************************************/
var appInfo 		= require('./package.json');
var port 			= process.env.PORT || 1337;
var server 			= restify.createServer();
/*********************************************************************************/

/**********************************************************************************
Constants
**********************************************************************************/
var headerKey                       = 'x-auth-key';
var routePrefix                     = '/v1';
/*********************************************************************************/

/**********************************************************************************
Setup
**********************************************************************************/
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());
server.opts(/.*/, function (req,res,next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", req.header("Access-Control-Request-Method"));
    res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
    res.send(200);
    return next();
});
server.use(restify.gzipResponse());

/**********************************************************************************
End-points
**********************************************************************************/
//Echo
server.get({path: routePrefix + '/echo', flags: 'i'}, echo);

function echo(req, res, next) {
    var info = {
        name: appInfo.name,
        version: appInfo.version,
        description: appInfo.description,
        author: appInfo.author,
        node: process.version
    };
    res.send(info);
    next();
}     

//Create Session validated by x-auth-key
server.post({path: routePrefix, flags: 'i'}, createSession);

function createSession(req, res, next) {
    var key = req.headers[headerKey];
    var input = parseRequest(req);

    session.create(key, input)
        .then(function(result){
            res.send(result);
        })
        .cache(function(err){
            if (err.code == 401) {
                res.send(401, err.msg);
            } else {
                res.send(500, err);
            }
        })
        .done(function(){
            return next();
        });
}

//Validate session by x-session-token
server.get({path: routePrefix + '/:sessionToken/validate', flags: 'i'}, function (req, res, next) {

    getSession(
        req,
        next,
        function(session) {
            setExpiryDate(session);
            repository.updateItem(
                session.xSessionToken,
                session, 
                session.Ttl,
                function(session){
                    res.send({
                        IsValid: true,
                        Expires: session.Expires,
                        Ttl: session.Ttl
                    });        
                },
            function(err) {
                onError(err, next);
            }
            );
        },
        function(err) {
            onError(err, next);
        }
    );
});

//Get Session validated by x-session-token
server.get({path: routePrefix, flags: 'i'}, function (req, res, next) {

    getSession(
        req,
        next,
        function(session) {
            setExpiryDate(session);
            repository.updateItem(
                session.xSessionToken,
                session, 
                session.Ttl,
                function(session){
                    res.send(session);        
                },
                function(err) {
                    onError(err, next);
                }
            );
        },
        function(err) {
            onError(err, next);
        }
    );
});

//Update Session validate by x-session-token
server.put({path: routePrefix, flags: 'i'}, function (req, res, next) {

    var input = parseRequest(req);

    getSession(
        req,
        next,
        function(session) {
            input.xSessionToken = session.xSessionToken;
            input.Ttl = input.Ttl || session.Ttl;
            
            session = input;
            setExpiryDate(session);
            repository.updateItem(
                session.xSessionToken,
                session,
                session.Ttl,
                function(session){
                    res.send(session);        
                },
                function(err) {
                    onError(err, next);
                }
            );
        },
        function(err) {
            onError(err, next);
        }
    );
});

//Delete Session validated by x-session-token
server.del({path: routePrefix, flags: 'i'}, function (req, res, next) {

    var sessionToken = getSessionToken(req);
    repository.deleteItem(
        sessionToken, 
        function(session) {
            res.send({ Deleted: true});        
        },
        function(session) {
            res.statusCode = 404;
            res.send({ Deleted: false});        
        },
        function(err) {
            onError(err, next);
        }
    );
});

//Patch Session validate by-x-session-token
server.patch({path: routePrefix, flags: 'i'}, function (req, res, next) {

    var input = parseRequest(req);

    getSession(
        req,
        next,
        function(session) {
            for (var key in input) {
                session[key] = input[key];    
            }
            setExpiryDate(session);
            repository.updateItem(
                session.xSessionToken,
                session,
                session.Ttl,
                function(session){
                    res.send(session);        
                },
                function(err) {
                    onError(err, next);
                }
            );
        },
        function(err) {
            onError(err, next);
        }
    );
});
/********************************************************************************/

/*********************************************************************************
Utilities
*********************************************************************************/
function validateKey(req, onSuccess, onError) {
    
    var appKey = process.env.APPKEY || config.credentials.key;
    
    var key = req.headers[headerKey];
    if (key == null || key.length <= 0)
        throw (new restify.errors.BadRequestError('Missing x-key header'));

   if (key == appKey) {
        onSuccess();
    } else {
        onError();
    }
}

function setExpiryDate(session){
    var now = new Date();
    var ttl = Number(session.Ttl || config.sessionExpirySec);
    session.Ttl = ttl;
    var expiryDate = new Date(now.setSeconds(now.getSeconds() + ttl));
    session.Expires = expiryDate;
}

function onError (err, next) {
    logger.error(err);
    var msg = (err != null && err.message != null)? err.message: 'Unknown error';
    return next(new restify.errors.InternalServerError(msg));
}

function parseRequest(req) {
    var output = {};
    if (typeof req.body == 'string') {
        output = JSON.parse(req.body);
    } else {
        output = req.body || {};
    }
    return output;
}

function getSessionToken(req, onSuccess) {
    
    var sessionToken = req.headers[headerXSessionToken];
    if (sessionToken == null || sessionToken.length == 0)
        throw new restify.errors.UnauthorizedError('x-session-token header not found');
    return sessionToken;
}

function getSession(req, next, onSuccess, onError) {
    
    var sessionToken = getSessionToken(req);
    var msgNotFound = 'Session with token:\'{sessionToken}\' was not found'
                        .replace('{sessionToken}', sessionToken);

    var onNotFound = function(){
        return next(new restify.errors.UnauthorizedError(msgNotFound));
    };
    
    repository.getItem(
        sessionToken,
        function(session){
            if (session.Expires <= new Date()) {
                onNotFound();
            } else {
                onSuccess(session);
            }
        },
        onNotFound,
        onError
    );
}
/*********************************************************************************/

/**********************************************************************************
Start the server
**********************************************************************************/
server.listen(port, function() {
	var msg = 'Starting service using port \'{port}\' and environment \'{environment}\''
				.replace('{port}', port)
				.replace('{environment}', process.env.NODE_ENV);
	logger.log(msg);
});
/*********************************************************************************/