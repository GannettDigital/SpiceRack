describe('job-manager: save tests', function() {

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

    it('should add metadata to job before saving to couchbase', function(done) {
        var mockConfig = {
            couchbase: {
                cluster: [],
                bucket: {
                    name: 'name',
                    password: '123'
                }
            }
        };

        var jobToSave = {
            id: 1,
            schedule: {
                cron: '* * * * *'
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
                        get: function(id, callback) {
                            callback(null, {});
                        },
                        upsert: function(id, job, callback) {
                            expect(job.locking).to.not.be.null;
                            expect(job.schedule.future_instances).to.not.be.null;
                            expect(job.lastModified).to.not.be.null;
                            done();
                        }
                    };
                };

                return self;
            }
        };

        mockery.registerMock('couchbase', mockCouchbase);

        var JobManager = require('../../../src/managers/job-manager.js');
        var manager = new JobManager(mockConfig);

        manager.save(jobToSave, function(err, result) {
        });
    });

    it('should call afterSave with error when couchbase upsert fails', function(done) {
        var mockConfig = {
            couchbase: {
                cluster: [],
                bucket: {
                    name: 'name',
                    password: '123'
                }
            }
        };

        var jobToSave = {
            id: 1,
            schedule: {
                cron: '* * * * *'
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
                        get: function(id, callback) {
                            callback(null, {});
                        },
                        upsert: function(id, job, callback) {
                            callback(new Error());
                        }
                    };
                };

                return self;
            }
        };

        mockery.registerMock('couchbase', mockCouchbase);

        var JobManager = require('../../../src/managers/job-manager.js');
        var manager = new JobManager(mockConfig);

        manager.save(jobToSave, function(err, result) {
            expect(err).to.not.be.null;
            expect(result).to.be.null;
            done();
        });
    });

    it('should call afterSave with job when couchbase upsert succeeds', function(done) {
        var mockConfig = {
            couchbase: {
                cluster: [],
                bucket: {
                    name: 'name',
                    password: '123'
                }
            }
        };

        var jobToSave = {
            id: 1,
            schedule: {
                cron: '* * * * *'
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
                        get: function(id, callback) {
                            callback(null, {});
                        },
                        upsert: function(id, job, callback) {
                            callback(null);
                        }
                    };
                };

                return self;
            }
        };

        mockery.registerMock('couchbase', mockCouchbase);

        var JobManager = require('../../../src/managers/job-manager.js');
        var manager = new JobManager(mockConfig);

        manager.save(jobToSave, function(err, result) {
            expect(err).to.be.null;
            expect(result).to.not.be.null;
            done();
        });
    });

    after(function() {
        mockery.disable();
    });
});