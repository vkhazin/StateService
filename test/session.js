var promise     = require('bluebird');
var config      = require('../config/default.json');
var logger      = require('../logger').create();
var cache       = require('../cache').create(config, logger);
var session     = require('../session').create(config, logger, cache);
var expect      = require('chai').expect;

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


    // it('Must not find value with different key', function(done) {
    //     var key = Math.random().toString();
    //     var value = { value: Math.random().toString()};
    //     var ttlSec = 0;

    //     cache.set(key, value, ttlSec)
    //         .then(function(result){
    //             key = Math.random().toString();
    //             return cache.get(key);
    //         })
    //         .then(function(result){
    //             if (result != null) {
    //                 throw new Error('Invalid value');
    //             }
    //             return promise.resolve(result);
    //         })
    //         .catch(function(err){
    //             throw err
    //         })
    //         .done(function(){
    //             done();
    //         });
    // });

    // it('Must find value before expiry', function(done) {
    //     var key = Math.random().toString();
    //     var value = {value: Math.random().toString()};
    //     var ttlSec = 1;

    //     cache.set(key, value, ttlSec)
    //         .delay(100)
    //         .then(function(result){
    //             return promise.resolve(cache.get(key));
    //         })
    //         .then(function(result){
    //             value = JSON.stringify(value);
    //             result = JSON.stringify(result);
    //             if (result != value) {
    //                 logger.error('Exected value: ' + value);
    //                 logger.error('Actual value: ' + result);
    //                 throw new Error('Invalid value');
    //             }
    //             return promise.resolve(result);
    //         })
    //         .catch(function(err){
    //             throw err
    //         })
    //         .done(function(){
    //             done();
    //         });
    // });

    // it('Must not find value after expiry', function(done) {
    //     var key = Math.random().toString();
    //     var value = { value: Math.random().toString()};
    //     var ttlSec = 1;

    //     cache.set(key, value, ttlSec)
    //         .delay(1001)
    //         .then(function(result){
    //             return promise.resolve(cache.get(key));
    //         })
    //         .then(function(result){
    //             if (result != null) {
    //                 throw new Error('Invalid value');
    //             }
    //             return promise.resolve(result);
    //         })
    //         .catch(function(err){
    //             throw err
    //         })
    //         .done(function(){
    //             done();
    //         });
    // });

    // it('Must not find value after deleting', function(done) {
    //     var key = Math.random().toString();
    //     var value = { value: Math.random().toString()};
    //     var ttlSec = 1;

    //     cache.set(key, value, ttlSec)
    //         .then(function(result){
    //             return promise.resolve(cache.get(key));
    //         })
    //         .then(function(result){
    //             if (!result) {
    //                 throw new Error('Could not find value');
    //             } else {
    //                 return cache.del(key);
    //             }
    //         })
    //         .then(function(result){
    //             return cache.get(key);
    //         })
    //         .then(function(result){
    //             if (result != null) {
    //                 throw new Error('Invalid value');
    //             }
    //             return promise.resolve(result);
    //         })
    //         .catch(function(err){
    //             throw err
    //         })
    //         .done(function(){
    //             done();
    //         });
    // });

    // it('Must fail deleting non-existing key', function(done) {
    //     var key = Math.random().toString();

    //     cache.del(key)
    //         .then(function(result){
    //             if (result == true) {
    //                 throw new Error('Found non existing key to delete');
    //             } else {
    //                 return promise.resolve(result);
    //             }
    //         })
    //         .catch(function(err){
    //             return promise.resolve(err);
    //         })
    //         .done(function(){
    //             done();
    //         });
    // });

});