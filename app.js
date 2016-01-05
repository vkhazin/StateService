/*********************************************************************************
Dependencies
**********************************************************************************/
var uuid           = require('uuid');
var restify 	   = require('restify');
var config 		   = require('config');
var logger         = require('./logger').create();
var cache          = require('./cache').create(config, logger);
var session        = require('./session').create(config, logger, cache);
/*********************************************************************************/

/**********************************************************************************
Configuration
**********************************************************************************/
var appInfo 		= require('./package.json');
var port 			= process.env.PORT || 3000;
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
server.get({path: '/', flags: 'i'}, echo);
server.get({path: '/echo', flags: 'i'}, echo);
server.get({path: routePrefix, flags: 'i'}, echo);
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
server.post({path: routePrefix, flags: 'i'}, function (req, res, next) {
    var key = req.headers[headerKey];
    var input = parseRequest(req);

    session.create(key, input)
        .then(function(result){
            res.send(result);
        })
        .catch(function(err){
            if (err.code == 401) {
                return res.send(401, err.msg);
            } else {
                return res.send(500, err);
            }
        })
        .done(function(){
            return next();
        });
});

//Get Session validated by x-session-token
server.get({path: routePrefix + '/:xSessionToken', flags: 'i'}, function (req, res, next) {

    var xSessionToken = req.params.xSessionToken;

    session.get(xSessionToken)
        .then(function(sessionData){
            return res.send(sessionData);
        })
        .catch(function(err){
            if (err.code == 401) {
                return res.send(401, err);
            } else {
                return res.send(500, err);
            }
        })
        .done(function(){
            return next();
        });
});

//Validate session by x-session-token
server.get({path: routePrefix + '/:xSessionToken/validate', flags: 'i'}, function (req, res, next) {

    var xSessionToken = req.params.xSessionToken;

    session.validate(xSessionToken)
        .then(function(sessionData){
            return res.send(sessionData);
        })
        .catch(function(err){
            if (err.code == 401) {
                return res.send(401, err);
            } else {
                return res.send(500, err);
            }
        })
        .done(function(){
            return next();
        });
});

//Update Session validate by x-session-token
server.put({path: routePrefix + '/:xSessionToken', flags: 'i'}, function (req, res, next) {

    var xSessionToken = req.params.xSessionToken;
    var input = parseRequest(req);

    session.update(xSessionToken, input)
        .then(function(result){
console.info(result);
            return res.send(result);
        })
        .catch(function(err){
            if (err.code == 401) {
                return res.send(401, err.msg);
            } else {
                return res.send(500, err);
            }
        })
        .done(function(){
            return next();
        });
});

//Delete Session validated by x-session-token
server.del({path: routePrefix + '/:xSessionToken', flags: 'i'}, function (req, res, next) {

    var xSessionToken = req.params.xSessionToken;
    
    session.del(xSessionToken)
        .then(function(result){
            return res.send({ deleted: true});  
        })
        .catch(function(err){
            if (err.code == 404) {
                return res.send(404, { deleted: false});
            } else {
                return res.send(500, err);
            }
        })
        .done(function(){
            return next();
        });    
});

//Patch Session validate by-x-session-token
server.patch({path: routePrefix + '/:xSessionToken', flags: 'i'}, function (req, res, next) {

    var xSessionToken = req.params.xSessionToken;
    var input = parseRequest(req);

    session.patch(xSessionToken, input)
        .then(function(result){
            return res.send(result);
        })
        .catch(function(err){
            if (err.code == 401) {
                return res.send(401, err.msg);
            } else {
                return res.send(500, err);
            }
        })
        .done(function(){
            return next();
        });
});
/********************************************************************************/

/*********************************************************************************
Utilities
*********************************************************************************/
function parseRequest(req) {
    var output = {};
    if (typeof req.body == 'string') {
        output = JSON.parse(req.body);
    } else {
        output = req.body || {};
    }
    return output;
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