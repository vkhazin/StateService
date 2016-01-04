var promise     = require('bluebird');
var config      = require('../config/default.json');
var logger      = require('../logger').create();
var cache       = require('../cache').create(config, logger);
var session     = require('../session').create(config, logger, cache);
var expect      = require('chai').expect;
var uuid        = require('uuid');

describe('session', function() {

    it('Create session with valid xAuthKey and default expiry', function(done) {
        var xAuthKey = config.xAuthKeys[0];
        var data = {
            value: 'dummy'
        };

        session.create(xAuthKey, data)
            .then(function(result){
                expect(result.ttlSec).to.equal(config.defaultTtlSec);
                expect(result.value).to.equal('dummy');
            })
            .catch(function(err){
                throw err   
            })
            .done(function(){
                done();
            });
    });

    it('Fail creating session with invalid xAuthKey', function(done) {
        var xAuthKey = Math.random().toString();
        var data = {
            value: 'dummy'
        };

        session.create(xAuthKey, data)
            .then(function(result){
                throw new Error('Should not have created a session');
            })
            .catch(function(err){
                expect(err.code).to.equal(401);
            })
            .done(function(){
                done();
            });
    });

    it('Create session with valid xAuthKey and custom expiry', function(done) {
        var xAuthKey = config.xAuthKeys[0];
        var ttlSec = 10;
        var data = {
            value: 'dummy',
            ttlSec: ttlSec
        };

        session.create(xAuthKey, data)
            .then(function(result){
                expect(result.ttlSec).to.equal(ttlSec);
                expect(result.value).to.equal('dummy');
            })
            .catch(function(err){
                throw err   
            })
            .done(function(){
                done();
            });
    });

    it('Shall not find non-existing session', function(done) {
        session.get(Math.random().toString())
            .then(function(result){
                throw new Error('Should not have found a session');
            })
            .catch(function(err){
                expect(err.code).to.equal(401);
            })
            .done(function(){
                done();
            });
    });

    it('Create and get session', function(done) {
        var xAuthKey = config.xAuthKeys[0];
        var ttlSec = 10;
        var data = {
            value: 'dummy',
            ttlSec: ttlSec
        };

        session.create(xAuthKey, data)
            .then(function(result){
                return session.get(result.xSessionToken);
            })
            .then(function(result){
                expect(result.ttlSec).to.equal(ttlSec);
                expect(result.value).to.equal('dummy');
            })            
            .catch(function(err){
                throw err   
            })
            .done(function(){
                done();
            });
    });    

    it('Create and get session before expiry', function(done) {
        var xAuthKey = config.xAuthKeys[0];
        var ttlSec = 10;
        var data = {
            value: 'dummy',
            ttlSec: ttlSec
        };

        session.create(xAuthKey, data)
            .delay(100)
            .then(function(result){
                return session.get(result.xSessionToken);
            })
            .then(function(result){
                expect(result.ttlSec).to.equal(ttlSec);
                expect(result.value).to.equal('dummy');
            })            
            .catch(function(err){
                throw err; 
            })
            .done(function(){
                done();
            });
    });

    it('Fail getting session after expiry', function(done) {
        var xAuthKey = config.xAuthKeys[0];
        var ttlSec = 1;
        var data = {
            value: 'dummy',
            ttlSec: ttlSec
        };

        session.create(xAuthKey, data)
            .delay(1001)
            .then(function(result){
                return session.get(result.xSessionToken);
            })
            .then(function(result){
                throw new Error('Should not have found expired session');
            })            
            .catch(function(err){
                expect(err.code).to.equal(401);
            })
            .done(function(){
                done();
            });
    });

    it('Create session with custom expiry and validate', function(done) {
        var xAuthKey = config.xAuthKeys[0];
        var ttlSec = 10;
        var data = {
            value: 'dummy',
            ttlSec: ttlSec
        };
        session.create(xAuthKey, data)
            .then(function(result){
                return session.validate(result.xSessionToken);
            })
            .then(function(result){
                expect(result.ttlSec).to.equal(ttlSec);
                expect(result.isValid).to.equal(true);
            })            
            .catch(function(err){
                throw err   
            })
            .done(function(){
                done();
        });    
    });

    it('Delete session with custom xSessionToken', function(done) {
        var xAuthKey = config.xAuthKeys[0];
        var ttlSec = 10;
        var xSessionToken = uuid.v4();

        var data = {
            xSessionToken: xSessionToken,
            value: 'dummy',
            ttlSec: ttlSec
        };
        
        session.create(xAuthKey, data)
            .then(function(result){
                expect(result.xSessionToken).to.equal(xSessionToken);
                return session.del(result.xSessionToken);
            })
            .then(function(result){
                return session.get(xSessionToken);
            })
            .then(function(result){
                throw new Error('Should not have found deleted session');
            })          
            .catch(function(err){
                return promise.resolve(err);
            })
            .done(function(){
                done();
        });    
    });

    it('Fail deleting non-existent session', function(done) {
        var xAuthKey = config.xAuthKeys[0];
        var ttlSec = 10;
        var xSessionToken = uuid.v4();

        var data = {
            value: 'dummy',
            ttlSec: ttlSec
        };
        
        session.create(xAuthKey, data)
            .then(function(result){
                expect(result.ttlSec).to.equal(ttlSec);
                return session.del(xSessionToken);
            })
            .then(function(result){
                throw new Error('Should not have found session to delete');
                logger.log(result);
            })          
            .catch(function(err){
                expect(err.code).to.equal(404);
                return promise.resolve(err);
            })
            .done(function(){
                done();
        });    
    });    

    it('Update session', function(done) {
        var xAuthKey = config.xAuthKeys[0];
        var data = {
            value: 'dummy'
        };
        var xSessionToken = null;

        session.create(xAuthKey, data)
            .then(function(result){
                xSessionToken = result.xSessionToken;
                expect(result.ttlSec).to.equal(config.defaultTtlSec);
                expect(result.value).to.equal('dummy');
                return promise.resolve(result);
            })
            .then(function(sessionData){
                sessionData.value = 'dummy1';
                return session.update(xSessionToken, sessionData);
            })
            .then(function(result){
                return session.get(xSessionToken);
            })         
            .then(function(sessionData){
                expect(sessionData.value).to.equal('dummy1');
            })
            .catch(function(err){
                throw err;
            })
            .done(function(){
                done();
            });
    });

    it('Fail updating non-existent session', function(done) {
        var xAuthKey = config.xAuthKeys[0];
        var data = {
            value: 'dummy'
        };
        var xSessionToken = null;

        session.create(xAuthKey, data)
            .then(function(result){
                xSessionToken = result.xSessionToken;
                expect(result.value).to.equal('dummy');
                return promise.resolve(result);
            })
            .then(function(sessionData){
                session.value = 'dummy1';
                return session.update(Math.random().toString(), session);
            })      
            .then(function(sessionData){
                throw new Error('Found non-existent session to update');
            })
            .catch(function(err){
                expect(err.code).to.equal(401);;
            })
            .done(function(){
                done();
            });
    });

    it('Patch session', function(done) {
        var xAuthKey = config.xAuthKeys[0];
        var data = {
            value: 'dummy'
        };
        var xSessionToken = null;

        session.create(xAuthKey, data)
            .then(function(result){
                xSessionToken = result.xSessionToken;
                expect(result.value).to.equal('dummy');
                return promise.resolve(result);
            })
            .then(function(sessionData){
                sessionData.value1 = 'dummy1';
                return session.patch(xSessionToken, sessionData);
            })
            .then(function(result){
                return session.get(xSessionToken);
            })         
            .then(function(sessionData){
                expect(sessionData.value).to.equal('dummy');
                expect(sessionData.value1).to.equal('dummy1');
            })
            .catch(function(err){
                throw err;
            })
            .done(function(){
                done();
            });
    });

    it('Fail patching non-existent session', function(done) {
        var xAuthKey = config.xAuthKeys[0];
        var data = {
            value: 'dummy'
        };
        var xSessionToken = null;

        session.create(xAuthKey, data)
            .then(function(result){
                xSessionToken = result.xSessionToken;
                expect(result.value).to.equal('dummy');
                return promise.resolve(result);
            })
            .then(function(sessionData){
                session.value1 = 'dummy1';
                return session.update(Math.random().toString(), session);
            })      
            .then(function(sessionData){
                throw new Error('Found non-existent session to patch');
            })
            .catch(function(err){
                expect(err.code).to.equal(401);;
            })
            .done(function(){
                done();
            });
    });      

});