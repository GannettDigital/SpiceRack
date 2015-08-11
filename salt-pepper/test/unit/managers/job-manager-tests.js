describe('job-manager: tests', function() {

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

    it('should log error when coucbase bucket returns error on connect', function(done){
        var mockConfig = {
            couchbase: {
                cluster: [],
                bucket: {
                    name: 'name',
                    password: '123'
                }
            }
        };

        var mockCouchbase = require('./mocks/mock-couchbase-error.js');
        mockery.registerMock('couchbase', mockCouchbase);

        var mockLogger = function() {
            return {
                error: function(message, err) {
                    expect(message).to.eql('Bucket Error: ');
                    expect(err).to.not.be.null;
                    done();
                }
            }
        };
        mockery.registerMock('./logger.js', mockLogger);

        var JobManager = require('../../../../salt-pepper/src/job-manager.js');
        var manager = new JobManager(mockConfig);

        manager.getJob(1, function(){});

    });

    it('should log info message when coucbase connects successfully', function(done){
        var mockConfig = {
            couchbase: {
                cluster: [],
                bucket: {
                    name: 'name',
                    password: '123'
                }
            }
        };

        var mockCouchbase = require('./mocks/mock-couchbase.js');
        mockery.registerMock('couchbase', mockCouchbase);

        var mockLogger = function() {
            return {
                info: function(message) {
                    expect(message).to.eql('Connected to bucket');
                    done();
                }
            }
        };
        mockery.registerMock('./logger.js', mockLogger);

        var JobManager = require('../../../../salt-pepper/src/job-manager.js');
        var manager = new JobManager(mockConfig);

        manager.getJob(1, function(){});

    });

    it('should call callback on HANDLE_RESPONSE event', function(done){
        var mockConfig = {
            couchbase: {
                cluster: [],
                bucket: {
                    name: 'name',
                    password: '123'
                }
            }
        };


        var lockedJob = {
            id: 1,
            schedule: {
                cron: '* * * * * *'
            },
            jobData: {},
            locking: {
                lockedOn: new Date(),
                lockedBy: 'tester',
                locked: true
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
                            callback(null, {cas: 123, value: lockedJob});
                        },
                        upsert: function(id, job, options, callback){
                            callback(null, job);
                        },
                        unlock: function(id, cas, callback) {
                            callback();
                        }
                    };
                };

                return self;
            }
        };

        mockery.registerMock('couchbase', mockCouchbase);

        var JobManager = require('../../../../salt-pepper/src/job-manager.js');
        var manager = new JobManager(mockConfig);

        manager.unlock(1, 'tester', function(){
            assert.ok(true);
            done();
        })
    });

    after(function() {
        mockery.disable();
    });
});