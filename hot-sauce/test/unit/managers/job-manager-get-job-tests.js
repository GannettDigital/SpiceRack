describe('job-manager: getJob tests', function() {

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

    it('should throw if id is not passed to getJob', function() {
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
                        }
                    };
                };

                return self;
            }
        };

        mockery.registerMock('couchbase', mockCouchbase);

        var JobManager = require('../../../src/managers/job-manager.js');
        var manager = new JobManager(mockConfig);
        var doIt = function() {
            manager.getJob(null, function() {
            })
        };

        expect(doIt).to.throw('id is required to get a specific job');
    });

    it('should throw if id is not passed to getJob', function() {
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
                        }
                    };
                };

                return self;
            }
        };

        mockery.registerMock('couchbase', mockCouchbase);

        var JobManager = require('../../../src/managers/job-manager.js');
        var manager = new JobManager(mockConfig);
        var doIt = function() {
            manager.getJob(null, function() {
            });
        };

        expect(doIt).to.throw('id is required to get a specific job');
    });

    it('should throw if afterGet is not passed to getJob', function() {
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
                        }
                    };
                };

                return self;
            }
        };

        mockery.registerMock('couchbase', mockCouchbase);

        var JobManager = require('../../../src/managers/job-manager.js');
        var manager = new JobManager(mockConfig);
        var doIt = function() {
            manager.getJob(1, null);
        };

        expect(doIt).to.throw('afterGet is required');
    });

    it('should throw if afterGet is not a function', function() {
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
                        }
                    };
                };

                return self;
            }
        };

        mockery.registerMock('couchbase', mockCouchbase);

        var JobManager = require('../../../src/managers/job-manager.js');
        var manager = new JobManager(mockConfig);
        var doIt = function() {
            manager.getJob(1, {});
        };

        expect(doIt).to.throw('afterGet must be a function');
    });

    it('should call afterGet with an error when couchbase returns an error', function(done) {
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
                        get: function(id, callback){
                            callback(new Error(), null);
                        }
                    };
                };

                return self;
            }
        };

        mockery.registerMock('couchbase', mockCouchbase);

        var JobManager = require('../../../src/managers/job-manager.js');
        var manager = new JobManager(mockConfig);

        manager.getJob(1, function(err, result){
            expect(err).to.not.be.null;
            expect(result).to.be.null;
            done();
        });
    });

    it('should call afterGet with result when couchbase call succeeds', function(done) {
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
                        get: function(id, callback){
                            callback(null, {value: {job: 'data'}});
                        }
                    };
                };

                return self;
            }
        };

        mockery.registerMock('couchbase', mockCouchbase);

        var JobManager = require('../../../src/managers/job-manager.js');
        var manager = new JobManager(mockConfig);

        manager.getJob(1, function(err, result){
            expect(err).to.be.null;
            expect(result).to.not.be.null;
            done();
        });
    });

    after(function() {
        mockery.disable();
    });
});