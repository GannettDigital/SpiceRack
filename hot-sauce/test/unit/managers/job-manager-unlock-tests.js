describe('job-manager: unlock tests', function() {

    var mockery = require('mockery');
    var expect = require('chai').expect;

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

    it('should supply error to callback when getAndLock returns an error', function(done) {
        var mockConfig = {
            couchbase: {
                cluster: [],
                bucket: {
                    name: 'name',
                    password: '123'
                }
            }
        };

        var mockCouchbase = {
            ViewQuery: {
                from: function(bucket, view) {
                }
            },
            Cluster: function() {
                var self = {};

                self.openBucket = function() {
                    return {
                        on: function() {
                        },
                        getAndLock: function(id, options, callback) {
                            var err = new Error('some err');
                            callback(err, null);
                        },
                        upsert: function(id, job, callback) {

                        }
                    };
                };

                return self;
            }
        };

        mockery.registerMock('couchbase', mockCouchbase);

        var JobManager = require('../../../src/managers/job-manager.js');
        var manager = new JobManager(mockConfig);

        manager.unlock(1, 'tester', function(err, result) {
            expect(err).to.not.be.null;
            done();
        });
    });

    it('should send the UNLOCK_JOB event when getAndLock returns without error', function(done) {
        var mockConfig = {
            couchbase: {
                cluster: [],
                bucket: {
                    name: 'name',
                    password: '123'
                }
            }
        };
        var mockEventHandler = function(){
            return {
                sendEvent: function(eventType){
                    expect(eventType).to.eql('unlock-job');
                    done();
                },
                watchEvent: function(){}
            }
        };

        var mockCouchbase = {
            ViewQuery: {
                from: function(bucket, view) {
                }
            },
            Cluster: function() {
                var self = {};

                self.openBucket = function() {
                    return {
                        on: function() {
                        },
                        getAndLock: function(id, options, callback) {
                            callback(null, {id: id, jobData: {}});
                        },
                        get: function(id, job, callback) {

                        }
                    };
                };

                return self;
            }
        };

        mockery.registerMock('couchbase', mockCouchbase);
        mockery.registerMock('../lib/event-handler.js', mockEventHandler);

        var JobManager = require('../../../src/managers/job-manager.js');
        var manager = new JobManager(mockConfig);

        manager.unlock(1, 'tester', function(err, result) {
        });
    });

    after(function() {
        mockery.disable();
    });
});