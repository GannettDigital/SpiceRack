describe('ajwain: handler tests', function() {
    var mockery = require('mockery');
    var expect = require('chai').expect;
    var assert = require('assert');

    before(function() {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
    });

    beforeEach(function() {
        mockery.deregisterAll();
        mockery.resetCache();
    });

    it('should call error handler if jobManager returns error', function(done){
        var mockJobManager = function(){
            return {
                findAvailableJob: function(codes, caller, callback){
                    var err = new Error('oops');
                    callback(err, null);
                }
            }

        };
        mockery.registerMock('./src/job-manager.js', mockJobManager);


        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 100,
            logger: {},
            couchbase: {
                bucket:{
                    name: 'name',
                    password: '123'
                },
                cluster:['http://host:8091']
            }
        });

        var options = {
            caller: 'tester',
            jobCodes: ['one']
        };

        var errorHandler = function(err){
            expect(err).to.not.be.null;
            ajwain.shutdown();
            done();
        };

        ajwain.registerErrorHandler(errorHandler);
        ajwain.registerJobHandler(options, function(){});

    });

    it('should not error when findAvailableJob returns no error & no job', function(done){
        var called = false;
        var mockJobManager = function(){
            return {
                findAvailableJob: function(codes, caller, callback){
                    //if no eligible jobs & no error, this is expected
                    var doIt = function(){
                        callback(null, null);
                    };
                    expect(doIt).to.not.throw();
                    if(!called) {
                        done();
                        called = true;
                    }
                }
            }

        };
        mockery.registerMock('./src/job-manager.js', mockJobManager);


        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 100,
            logger: {},
            couchbase: {
                bucket:{
                    name: 'name',
                    password: '123'
                },
                cluster:['http://host:8091']
            }
        });

        var options = {
            caller: 'tester',
            jobCodes: ['one']
        };

        var errorHandler = function(err){
            assert.fail('should not have errored');
            done();
        };

        ajwain.registerErrorHandler(errorHandler);
        ajwain.registerJobHandler(options, function(){});

    });

    it('should not error when unlock is successful', function(done){
        var job = {id: 1};
        var called = false;
        var mockJobManager = function(){
            return {
                unlock: function(id, caller, callback){
                    //if no eligible jobs & no error, this is expected
                    var doIt = function(){
                        callback(null);
                    };
                    expect(doIt).to.not.throw();
                    if(!called) {
                        done();
                        called = true;
                    }
                }
            }

        };
        mockery.registerMock('./src/job-manager.js', mockJobManager);


        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 100,
            logger: {},
            couchbase: {
                bucket:{
                    name: 'name',
                    password: '123'
                },
                cluster:['http://host:8091']
            }
        });

        var options = {
            caller: 'tester',
            jobCodes: ['one']
        };

        var errorHandler = function(err){
            assert.fail('should not have errored');
            done();
        };

        ajwain.completeJob(job, options);

    });

    it('should call jobManager.unlock when job is successfully completed', function(done){
        var job = {id: 1};
        var mockJobManager = function(){
            return {
                unlock: function(job, options){
                    expect(job).to.not.be.null;
                    done();
                }
            }

        };
        mockery.registerMock('./src/job-manager.js', mockJobManager);

        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 100,
            logger: {},
            couchbase: {
                bucket:{
                    name: 'name',
                    password: '123'
                },
                cluster:['http://host:8091']
            }
        });

        var options = {
            caller: 'tester',
            jobCodes: ['one']
        };

        ajwain.completeJob(job, options);
    });

    it('should call log error if job could not be unlocked', function(done){
        var job = {id: 1};
        var mockJobManager = function(){
            return {
                unlock: function(job, options, callback){
                    var err = new Error('oops');
                    callback(err);
                }
            }
        };
        mockery.registerMock('./src/job-manager.js', mockJobManager);

        var mockLogger = function(){
            return {
                error: function(msg, err){
                    expect(msg).to.eql('error unlocking job: 1');
                    expect(err).to.not.be.null;
                    done();
                }
            }
        };
        mockery.registerMock('./src/logger.js', mockLogger);


        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 100,
            logger: {},
            couchbase: {
                bucket:{
                    name: 'name',
                    password: '123'
                },
                cluster:['http://host:8091']
            }
        });

        var options = {
            caller: 'tester',
            jobCodes: ['one']
        };

        ajwain.completeJob(job, options);
    });

    after(function() {
        mockery.disable();
    });
});