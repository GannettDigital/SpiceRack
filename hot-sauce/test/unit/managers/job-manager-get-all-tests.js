describe('job-manager: getAllJobs tests', function() {

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

        var mockCouchbase = require('../mocks/mock-couchbase.js');
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
        mockery.registerMock('../lib/logger.js', mockLogger);

        var JobManager = require('../../../src/managers/job-manager.js');
        var manager = new JobManager(mockConfig);

    });

    it('should load the GetAllJobs view from the jobs bucket', function(done) {
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
                    expect(bucket).to.eql('jobs');
                    expect(view).to.eql('GetAllJobs');
                    done();
                }
            },
            Cluster: function() {
                var self = {};

                self.openBucket = function() {
                    return {
                        on: function() {
                        },
                        query: function(query, callback) {
                        }
                    };
                };

                return self;
            }
        };

        mockery.registerMock('couchbase', mockCouchbase);

        var JobManager = require('../../../src/managers/job-manager.js');
        var manager = new JobManager(mockConfig);

        manager.getAllJobs();
    });

    it('should call the callback with an error if couchbase returns an error', function(done) {
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
                        query: function(query, callback) {
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

        manager.getAllJobs(function(err) {
            expect(err).to.not.be.null;
            done();
        });
    });

    it('should map the couchbase view data into an array of jobs before returning', function(done) {
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
                        query: function(query, callback) {
                            callback(null, [
                                {
                                    meta: 'data',
                                    value: {
                                        name: 'name'
                                    }
                                },
                                {
                                    meta: 'data',
                                    value: {
                                        name: 'name2'
                                    }
                                }
                            ]);
                        }
                    };
                };

                return self;
            }
        };

        mockery.registerMock('couchbase', mockCouchbase);

        var JobManager = require('../../../src/managers/job-manager.js');
        var manager = new JobManager(mockConfig);

        manager.getAllJobs(function(err, results) {
            expect(results).deep.eql([{name: 'name'}, {name: 'name2'}]);
            done();
        });
    });

    after(function() {
        mockery.disable();
    });
});