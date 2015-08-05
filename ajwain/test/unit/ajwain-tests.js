describe('ajwain tests', function() {
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
        mockery.resetCache();
    });

    afterEach(function() {
        mockery.deregisterAll();
    });

    it('should register a job-found listener on initialize', function(done){
        var mockRequest = function(){};
        mockery.registerMock('request', mockRequest);

        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 200,
            logger: {},
            apiKey: 'key',
            hotSauceHost: 'some.host'
        });

        var options = {
            jobCodes: ['one'],
            caller: 'tester'
        };
        ajwain.registerJobHandler(options, function(){});

        expect(ajwain.listeners('job-found').length).to.eql(1);
        done();
    });

    it('should emit a get-job event on register', function(done){
        var mockRequest = function(){};
        mockery.registerMock('request', mockRequest);

        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 200,
            logger: {},
            apiKey: 'key',
            hotSauceHost: 'some.host'
        });

        var options = {
            jobCodes: ['one'],
            caller: 'tester'
        };
        ajwain.registerJobHandler(options, function(){});

        var called = false;
        ajwain.on('get-job', function(){
            assert.ok(true);
            //prevent multiple done calls.
            // ajwain emits the get-job periodically & this will keep firing
            if(!called) {
                called = true;
                done();
            }
        });
    });

    it('should emit a job-complete event when completeJob method is called', function(done){
        var mockRequest = function(){};
        mockery.registerMock('request', mockRequest);

        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 200,
            logger: {},
            apiKey: 'key',
            hotSauceHost: 'some.host'
        });

        var callerOptions = {
            caller: 'tester',
            jobCodes: ['one']
        };
        var completedJob = {
            id: 1
        };

        ajwain.on('job-complete', function(job, options){
            expect(job).to.eql(completedJob);
            expect(options).to.eql(callerOptions);
            done();
        });

        ajwain.completeJob(completedJob, callerOptions);

    });

    it('should emit a job-error event when an error handler is registered', function(done){
        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 200,
            logger: {},
            apiKey: 'key',
            hotSauceHost: 'some.host'
        });

        ajwain.registerErrorHandler(function(err){
            expect(err).to.not.be.null;
            ajwain.shutdown();
            done();

        });

        //lack of config & options should trigger an error
        ajwain.registerJobHandler({jobCodes: ['one'], caller: 'tester'}, function(){});

    });

    it('should trigger registered handler when a job is found', function(done){
        var mockRequest = function(){};
        mockery.registerMock('request', mockRequest);

        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 200,
            logger: {},
            apiKey: 'key',
            hotSauceHost: 'some.host'
        });

        var options = {
            jobCodes: ['one'],
            caller: 'tester'
        };
        var foundJob = {
            id: 1
        };

        ajwain.registerJobHandler(options, function(job){
            expect(job).to.eql(foundJob);
            done();
        });

        ajwain.emit('job-found', foundJob);

    });

    it('should throw error when pollInterval is not configured', function(){
        var Ajwain = require('../../src/ajwain.js');
        var doIt = function(){
            new Ajwain({
            });
        };

        expect(doIt).throw('pollInterval must be specified');
    });

    it('should throw error when pollInterval is not a number', function(){
        var Ajwain = require('../../src/ajwain.js');
        var doIt = function(){
            new Ajwain({
                pollInterval: 'nan'
            });
        };

        expect(doIt).throw('pollInterval must be a number');
    });

    it('should throw error when pollInterval is not a positive number', function(){
        var Ajwain = require('../../src/ajwain.js');
        var doIt = function(){
            new Ajwain({
                pollInterval: -10
            });
        };

        expect(doIt).throw('pollInterval must be greater than 0');
    });

    it('should throw error when logger is not configured', function(){
        var Ajwain = require('../../src/ajwain.js');
        var doIt = function(){
            new Ajwain({
                pollInterval: 1
            });
        };

        expect(doIt).throw('logger must be configured');
    });

    it('should throw error when logger is not an object', function(){
        var Ajwain = require('../../src/ajwain.js');
        var doIt = function(){
            new Ajwain({
                pollInterval: 1,
                logger: 'not an object'
            });
        };

        expect(doIt).throw('logger must be an object');
    });

    it('should throw error when apiKey is not configured', function(){
        var Ajwain = require('../../src/ajwain.js');
        var doIt = function(){
            new Ajwain({
                pollInterval: 1,
                logger: {},
                hotSauceHost: 'some.host'
            });
        };

        expect(doIt).throw('apiKey must be configured');
    });

    it('should throw error when hotSauceHost is not configured', function(){
        var Ajwain = require('../../src/ajwain.js');
        var doIt = function(){
            new Ajwain({
                pollInterval: 1,
                logger: {},
                apiKey: 'apiKey'
            });
        };

        expect(doIt).throw('hotSauceHost must be configured');
    });

    it('should throw error when options.caller is not set', function(){
        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 1,
            logger: {},
            apiKey: 'apiKey',
            hotSauceHost: 'some.host'
        });

        var options = {};
        var doIt = function(){
            ajwain.registerJobHandler(options, function(job){});
        };

        expect(doIt).throw('caller must be specified in options');
    });

    it('should throw error when options.jobCodes is not set', function(){
        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 1,
            logger: {},
            apiKey: 'apiKey',
            hotSauceHost: 'some.host'
        });

        var options = {
            caller: 'tester'
        };
        var doIt = function(){
            ajwain.registerJobHandler(options, function(job){});
        };

        expect(doIt).throw('jobCodes must be specified in options');
    });

    it('should throw error when options.caller is not an array', function(){
        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 1,
            logger: {},
            apiKey: 'apiKey',
            hotSauceHost: 'some.host'
        });

        var options = {
            caller: 'tester',
            jobCodes: 'test'
        };
        var doIt = function(){
            ajwain.registerJobHandler(options, function(job){});
        };

        expect(doIt).throw('jobCodes must be an array');
    });

    it('should throw error when options.jobCodes is empty', function(){
        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 1,
            logger: {},
            apiKey: 'apiKey',
            hotSauceHost: 'some.host'
        });

        var options = {
            caller: 'tester',
            jobCodes: []
        };
        var doIt = function(){
            ajwain.registerJobHandler(options, function(job){});
        };

        expect(doIt).throw('at least one jobCode must be specified');
    });

    it('should throw error when handler is not a function', function(){
        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 1,
            logger: {},
            apiKey: 'apiKey',
            hotSauceHost: 'some.host'
        });

        var options = {
            caller: 'tester',
            jobCodes: ['one']
        };
        var doIt = function(){
            ajwain.registerJobHandler(options, 'not a function');
        };

        expect(doIt).throw('handler must be a function');
    });

    after(function() {
        mockery.disable();
    });
});