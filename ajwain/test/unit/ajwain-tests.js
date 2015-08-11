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
        mockery.deregisterAll();
        mockery.resetCache();
    });

    it('should register a job-found listener on initialize', function(done){
        var mockRequest = function(){};
        mockery.registerMock('request', mockRequest);

        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 200,
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
            jobCodes: ['one'],
            caller: 'tester'
        };
        ajwain.registerJobHandler(options, function(){});

        expect(ajwain.listeners('job-found').length).to.eql(1);
        ajwain.shutdown();
        done();
    });

    it('should emit a get-job event on register', function(done){
        var mockRequest = function(){};
        mockery.registerMock('request', mockRequest);

        var mockEventHandler = function() {
            return {
                sendEvent: function(){},
                watchEvent: function(eventType) {
                    if(eventType === 'get-job'){
                        assert.ok(true);
                        done();
                    }
                }
            }
        };
        mockery.registerMock('./src/event-handler.js', mockEventHandler);

        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 200,
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
            jobCodes: ['one'],
            caller: 'tester'
        };
        ajwain.registerJobHandler(options, function(){});
    });

    it('should emit a job-complete event when completeJob method is called', function(done){
        var mockRequest = function(){};
        mockery.registerMock('request', mockRequest);

        var mockEventHandler =  function() {
            return {
                watchEvent: function() {
                },
                sendEvent: function(eventType) {
                    expect(eventType).to.eql('job-complete');
                    done();
                }
            }
        };
        mockery.registerMock('./src/event-handler.js', mockEventHandler);

        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 200,
            logger: {},
            couchbase: {
                bucket:{
                    name: 'name',
                    password: '123'
                },
                cluster:['http://host:8091']
            }
        });

        var callerOptions = {
            caller: 'tester',
            jobCodes: ['one']
        };
        var completedJob = {
            id: 1
        };
        ajwain.completeJob(completedJob, callerOptions);

    });

    it('should register a job-error handler when registerErrorHandler is called', function(done){
        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 500,
            logger: {},
            couchbase: {
                bucket:{
                    name: 'name',
                    password: '123'
                },
                cluster:['http://host:8091']
            }
        });

        ajwain.registerErrorHandler(function(err){
            //do something
        });

        //lack of config & options should trigger an error
        expect(ajwain.listeners('job-error')).to.have.length(1);
        done();

    });

    it('should trigger registered handler when a job is found', function(done){
        var mockRequest = function(){};
        mockery.registerMock('request', mockRequest);
        var options = {
            jobCodes: ['one'],
            caller: 'tester'
        };

        var foundJob = {
            id: 1,
            code: options.jobCodes[0],
            jobData: {}
        };
        var mockJobManager = function(){
            return {
                findAvailableJob: function(jobCodes, caller, afterGet){
                    afterGet(null, foundJob);
                }
            }
        };
        //mock just the job manager. this is how its called from within salt-pepper
        mockery.registerMock('./src/job-manager.js', mockJobManager);

        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 200,
            logger: {},
            couchbase: {
                bucket:{
                    name: 'name',
                    password: '123'
                },
                cluster:['http://host:8091']
            }
        });

        ajwain.registerJobHandler(options, function(job){
            expect(foundJob.id).to.eql(job.id);
            ajwain.shutdown();
            done();
        });
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

    it('should throw error when couchbase is not configured', function(){
        var Ajwain = require('../../src/ajwain.js');
        var doIt = function(){
            new Ajwain({
                pollInterval: 1,
                logger: {},
            });
        };

        expect(doIt).throw('couchbase must be specified');
    });

    it('should throw error when couchbase.cluster is not configured', function(){
        var Ajwain = require('../../src/ajwain.js');
        var doIt = function(){
            new Ajwain({
                pollInterval: 1,
                logger: {},
                couchbase:{
                }
            });
        };

        expect(doIt).throw('couchbase.cluster must be specified');
    });

    it('should throw error when config is not an object', function(){
        var Ajwain = require('../../src/ajwain.js');
        var doIt = function(){
            new Ajwain('text');
        };

        expect(doIt).throw('config must be an object');
    });

    it('should throw error when couchbase.bucket is not an specified', function(){
        var Ajwain = require('../../src/ajwain.js');
        var doIt = function(){
            new Ajwain({
                pollInterval: 1,
                logger: {},
                couchbase:{
                    cluster: []
                }
            });
        };

        expect(doIt).throw('couchbase.bucket must be specified');
    });

    it('should throw error when couchbase is not an object', function(){
        var Ajwain = require('../../src/ajwain.js');
        var doIt = function(){
            new Ajwain({
                pollInterval: 1,
                logger: {},
                couchbase:'test'
            });
        };

        expect(doIt).throw('couchbase must be an object');
    });

    it('should throw error when config is not passed in', function(){
        var Ajwain = require('../../src/ajwain.js');
        var doIt = function(){
            new Ajwain();
        };

        expect(doIt).throw('config must be specified');
    });

    it('should throw error when config is not an object', function(){
        var Ajwain = require('../../src/ajwain.js');
        var doIt = function(){
            new Ajwain('text');
        };

        expect(doIt).throw('config must be an object');
    });

    it('should throw error when options.caller is not set', function(done){
        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 1,
            logger: {},
            couchbase: {
                bucket:{
                    name: 'name',
                    password: '123'
                },
                cluster:['http://host:8091']
            }
        });

        var options = {};
        var doIt = function(){
            ajwain.registerJobHandler(options, function(job){});
        };

        expect(doIt).to.throw('caller must be specified in options');
        done();
    });

    it('should throw error when options.jobCodes is not set', function(){
        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 1,
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
            caller: 'tester'
        };
        var doIt = function(){
            ajwain.registerJobHandler(options, function(job){});
        };

        expect(doIt).to.throw('jobCodes must be specified in options');
    });

    it('should throw error when options.caller is not an array', function(){
        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 1,
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
            jobCodes: 'test'
        };
        var doIt = function(){
            ajwain.registerJobHandler(options, function(job){});
        };

        expect(doIt).to.throw('jobCodes must be an array');
    });

    it('should throw error when options.jobCodes is empty', function(){
        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 1,
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
            jobCodes: []
        };
        var doIt = function(){
            ajwain.registerJobHandler(options, function(job){});
        };

        expect(doIt).to.throw('at least one jobCode must be specified');
    });

    it('should throw error when handler is not a function', function(){
        var Ajwain = require('../../src/ajwain.js');
        var ajwain = new Ajwain({
            pollInterval: 1,
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
        var doIt = function(){
            ajwain.registerJobHandler(options, 'not a function');
        };

        expect(doIt).to.throw('handler must be a function');
    });

    after(function() {
        mockery.disable();
    });
});