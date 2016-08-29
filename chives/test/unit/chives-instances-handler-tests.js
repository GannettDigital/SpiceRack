describe('chives: instances handler tests', function() {
    var mockery = require('mockery');
    var expect = require('chai').expect;
    var assert = require('assert');
    var os = require('os');

    before(function() {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
    });

    beforeEach(function() {
        mockery.resetCache();
        mockery.registerMock('./src/job-manager.js', function () { return {};});
    });

    afterEach(function() {
        mockery.deregisterAll();
    });

    it('should not configure a listener for GENERATE_INSTANCES if pollInterval is set to 0', function() {
        var Chives = require('../../index.js');

        var chives = new Chives({
            pollIntervals: {
                generateInstances: 0,
                unlockJobs: 0
            },
            logger: {},
            couchbase: {
                bucket: {
                    name: 'x',
                    password: 'y'
                },
                cluster: []
            }
        });

        chives.start();

        expect(chives.listeners('generate-instances')).to.have.length(0);

        chives.stop();

    });

    it('should emit GENERATE_INSTANCES event on start', function(done) {
        var Chives = require('../../index.js');

        var chives = new Chives({
            pollIntervals: {
                generateInstances: 100,
                unlockJobs: 0
            },
            logger: {},
            couchbase: {
                bucket: {
                    name: 'x',
                    password: 'y'
                },
                cluster: []
            }
        });

        chives.on('generate-instances', function() {
            assert.ok(true);
            done();
            chives.stop();
        });

        chives.start();
    });

    it('should log a message when no locked jobs were found to generate instances for', function(done) {
        var mockJobManager = function(){
            return {
                getUnlockedJobs: function(callback){
                    callback(null, null);
                }
            }
        };
        var mockLogger = function(){
            return {
                debug: function(){},
                info: function(msg){
                    expect(msg).to.eql('no jobs found to work on');
                    //thanks to closure scopes, this is possible
                    chives.stop();
                    done();
                }
            }
        };

        mockery.registerMock('./src/job-manager.js', mockJobManager);
        mockery.registerMock('./src/logger.js', mockLogger);


        var Chives = require('../../index.js');

        var chives = new Chives({
            pollIntervals: {
                generateInstances: 100,
                unlockJobs: 0
            },
            logger: {},
            couchbase: {
                bucket: {
                    name: 'x',
                    password: 'y'
                },
                cluster: []
            }
        });

        chives.start();
    });

    it('should emit PROCESS_GENERATE_INSTANCES event when a jobs are found to generate instances for', function(done) {
        var jobs = [
            {
                id: 1, schedule: {expirationThreshold: 20000, future_instances: []}, locking: {}
            }
        ];
        var mockJobManager = function(){
            return {
                getUnlockedJobs: function(callback){
                    callback(null, jobs);
                },
                save: function(){}
            }
        };

        mockery.registerMock('./src/job-manager.js', mockJobManager);

        var Chives = require('../../index.js');

        var chives = new Chives({
            pollIntervals: {
                generateInstances: 100,
                unlockJobs: 0
            },
            logger: {},
            couchbase: {
                bucket: {
                    name: 'x',
                    password: 'y'
                },
                cluster: []
            }
        });

        chives.on('process-generate-instances', function(jobs){
            chives.stop();
            expect(jobs).to.eql(jobs);
            done();
        });

        chives.start();
    });

    it('should log an error when getUnlockedJobs encounters an error', function(done) {
        var expectedError = new Error('uh oh');
        var mockJobManager = function(){
            return {
                getUnlockedJobs: function(callback){
                    callback(expectedError, null);
                }
            }
        };

        var mockLogger = function(){
            return {
                debug: function(){},
                error: function(msg, err){
                    expect(msg).to.eql('error with generate instances job');
                    expect(err).to.eql(expectedError);
                    //thanks to closure scopes, this is possible
                    chives.stop();
                    done();
                }
            }
        };

        mockery.registerMock('./src/job-manager.js', mockJobManager);
        mockery.registerMock('./src/logger.js', mockLogger);

        var Chives = require('../../index.js');

        var chives = new Chives({
            pollIntervals: {
                generateInstances: 100,
                unlockJobs: 0
            },
            logger: {},
            couchbase: {
                bucket: {
                    name: 'x',
                    password: 'y'
                },
                cluster: []
            }
        });

        chives.start();
    });

    after(function() {
        mockery.disable();
    });
});