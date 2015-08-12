describe('chives: unlock handler tests', function() {
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
    });

    afterEach(function() {
        mockery.deregisterAll();
    });

    it('should not configure a listener for UNLOCK_JOBS if pollInterval is set to 0', function() {
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

        expect(chives.listeners('unlock-jobs')).to.have.length(0);

        chives.stop();

    });

    it('should emit UNLOCK_LOCKED_JOBS event on start', function(done) {
        var Chives = require('../../index.js');

        var chives = new Chives({
            pollIntervals: {
                generateInstances: 0,
                unlockJobs: 100
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

        chives.on('unlock-locked-jobs', function() {
            assert.ok(true);
            done();
            chives.stop();
        });

        chives.start();
    });

    it('should log a message when no locked jobs were found to unlock', function(done) {
        var mockJobManager = function(){
            return {
                getLockedJobs: function(callback){
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
                generateInstances: 0,
                unlockJobs: 100
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

    it('should emit PROCESS_UNLOCKS event when a jobs are found to unlock', function(done) {
        var jobsToUnlock = [
            {id: 1, schedule: {expirationThreshold: 20000}, locking: {lockedOn: new Date()}},
            {id: 2, schedule: {expirationThreshold: 20000}, locking: {lockedOn: new Date()}}
        ];
        var mockJobManager = function(){
            return {
                getLockedJobs: function(callback){
                    callback(null, jobsToUnlock);
                },
                getUnlockedJobs: function(){}
            }
        };

        mockery.registerMock('./src/job-manager.js', mockJobManager);

        var Chives = require('../../index.js');

        var chives = new Chives({
            pollIntervals: {
                generateInstances: 0,
                unlockJobs: 100
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

        chives.on('process-unlocks', function(jobs){
            chives.stop();
            expect(jobs).to.eql(jobsToUnlock);
            done();
        });

        chives.start();
    });

    it('should log a warning when expirationThreshold is missing', function(done) {
        var jobsToUnlock = [
            {id: 1, schedule: {}, locking: {lockedOn: new Date()}}
        ];
        var mockJobManager = function(){
            return {
                getLockedJobs: function(callback){
                    callback(null, jobsToUnlock);
                },
                getUnlockedJobs: function(){}
            }
        };

        var mockLogger = function(){
            return {
                debug: function(){},
                warn: function(msg){
                    expect(msg).to.eql('Job: 1 does not have an expiration threshold. Moving on...');
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
                generateInstances: 0,
                unlockJobs: 100
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

    it('should call jobManager.unlock if job is eligible for unlocking', function(done) {
        var baseDate = new Date();
        var lockedDate = new Date();
        lockedDate.setMinutes(baseDate.getMinutes() - 20);
        var jobsToUnlock = [
            {id: 1, schedule: {expirationThreshold: 1000}, locking: {lockedOn: lockedDate}}
        ];
        var mockJobManager = function(){
            return {
                getLockedJobs: function(callback){
                    callback(null, jobsToUnlock);
                },
                getUnlockedJobs: function(){},
                unlock: function(id, caller, callback){
                    chives.stop();
                    expect(id).to.eql(jobsToUnlock[0].id);
                    expect(caller).to.eql(os.hostname() + '-chives');
                    expect(callback).to.be.a('function');
                    done();

                }
            }
        };

        mockery.registerMock('./src/job-manager.js', mockJobManager);

        var Chives = require('../../index.js');

        var chives = new Chives({
            pollIntervals: {
                generateInstances: 0,
                unlockJobs: 100
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

    it('should log error if unlocking results in error', function(done) {
        var baseDate = new Date();
        var lockedDate = new Date();
        lockedDate.setMinutes(baseDate.getMinutes() - 20);
        var jobsToUnlock = [
            {id: 1, schedule: {expirationThreshold: 1000}, locking: {lockedOn: lockedDate}}
        ];

        var expectedError = new Error('oops');
        var mockJobManager = function(){
            return {
                getLockedJobs: function(callback){
                    callback(null, jobsToUnlock);
                },
                getUnlockedJobs: function(){},
                unlock: function(id, caller, callback){
                    chives.stop();
                    callback(expectedError);
                }
            }
        };

        var mockLogger = function(){
            return {
                debug: function(){},
                warn: function(){},
                error: function(msg, err){
                    expect(msg).to.not.be.null;
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
                generateInstances: 0,
                unlockJobs: 100
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

    it('should log debug if unlocking is successful', function(done) {
        var baseDate = new Date();
        var lockedDate = new Date();
        lockedDate.setMinutes(baseDate.getMinutes() - 20);
        var jobsToUnlock = [
            {id: 1, schedule: {expirationThreshold: 1000}, locking: {lockedOn: lockedDate}}
        ];

        var mockJobManager = function(){
            return {
                getLockedJobs: function(callback){
                    callback(null, jobsToUnlock);
                },
                getUnlockedJobs: function(){},
                unlock: function(id, caller, callback){
                    chives.stop();
                    callback(null);
                }
            }
        };

        var called = false;
        var mockLogger = function(){
            return {
                warn: function(){},
                debug: function(msg){
                    expect(msg).to.not.be.null;
                    if(!called) {
                        called = true;
                        //thanks to closure scopes, this is possible
                        chives.stop();
                        done();
                    }
                }
            }
        };

        mockery.registerMock('./src/job-manager.js', mockJobManager);
        mockery.registerMock('./src/logger.js', mockLogger);

        var Chives = require('../../index.js');

        var chives = new Chives({
            pollIntervals: {
                generateInstances: 0,
                unlockJobs: 100
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