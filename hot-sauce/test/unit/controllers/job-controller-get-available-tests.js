describe('job-controller: getAvailable tests', function(){

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

    it('should call jobManager findAvailableJob on getAvailable action', function(done){
        var expectedCodes = ['somecode'];
        var mockManager = function(){
            return {
                findAvailableJob: function(codes){
                    expect(codes).to.eql(expectedCodes);
                    done();
                }
            };
        };

        var mockResponse = {
            json: function(){}
        };
        var mockRequest = {
            checkQuery: function(){
                return {
                    notEmpty: function(){}
                }
            },
            validationErrors: function(){},
            query: {
                codes: expectedCodes[0]
            }
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.getAvailable(mockRequest, mockResponse, function(){});
    });

    it('should split codes into an array before calling findAvailableJob', function(done){
        var expectedCodes = ['code1', 'code2'];
        var mockManager = function(){
            return {
                findAvailableJob: function(codes){
                    expect(codes).to.eql(expectedCodes);
                    done();
                }
            };
        };

        var mockResponse = {
            json: function(){}
        };
        var mockRequest = {
            checkQuery: function(){
                return {
                    notEmpty: function(){}
                }
            },
            validationErrors: function(){},
            query: {
                codes: 'code1,code2'
            }
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.getAvailable(mockRequest, mockResponse, function(){});
    });

    it('should return result using the json method of the response', function(done){
        var job = {
            found: 'me'
        };
        var mockManager = function(){
            return {
                findAvailableJob: function(codes, caller, callback){
                    callback(null, job);
                }
            };
        };

        var mockResponse = {
            json: function(response) {
                expect(response).to.eql(job);
                done();
            }
        };

        var mockRequest = {
            checkQuery: function(){
                return {
                    notEmpty: function(){}
                }
            },
            validationErrors: function(){},
            query: {
                codes: 'code1,code2'
            }
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.getAvailable(mockRequest, mockResponse, function(){});
    });

    it('should call next with err when findAvailableJob gets an error', function(done){
        var error = new Error('uh oh');
        var mockManager = function(){
            return {
                findAvailableJob: function(codes, caller, callback){
                    callback(error, null);
                }
            };
        };

        var mockResponse = {

        };

        var mockRequest = {
            checkQuery: function(){
                return {
                    notEmpty: function(){}
                }
            },
            validationErrors: function(){},
            query: {
                codes: 'code1,code2'
            }
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.getAvailable(mockRequest, mockResponse, function(err) {
            expect(err).to.eql(error);
            done();
        });
    });

    it('should set statuscode to 404 when available job is not found', function(done){
        var expectedCodes = ['code1', 'code2'];
        var mockManager = function(){
            return {
                findAvailableJob: function(codes, caller, callback){
                    callback(null);
                }
            };
        };

        var mockResponse = {
            status: function(value){
                expect(value).to.eql(404);
                return {
                    json: function(response){
                        expect(response.message).to.eql('available job not found');
                        done();
                    }
                }
            }
        };
        var mockRequest = {
            checkQuery: function(){
                return {
                    notEmpty: function(){}
                }
            },
            validationErrors: function(){},
            query: {
                codes: 'code1,code2'
            }
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.getAvailable(mockRequest, mockResponse, function(){});
    });

    it('should call next on validation error', function(done){
        var expectedCodes = ['somecode'];
        var mockManager = function(){
            return {
                findAvailableJob: function(codes){
                    assert.fail('should not be called');
                    done();
                }
            };
        };

        var mockResponse = {
            json: function(){}
        };
        var mockRequest = {
            checkQuery: function(){
                return {
                    notEmpty: function(){}
                }
            },
            validationErrors: function(){
                return [{
                    param: 'codes',
                    error: 'is required'
                }]
            },
            query: {
            }
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.getAvailable(mockRequest, mockResponse, function(err){
            expect(err).to.not.be.null;
            done();
        });
    });

    it('should trigger the GET_AND_LOCK event on finding a job', function(done){
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
            code: 'test-job',
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
                    return {
                        range: function(startKey, endKey){
                            return {
                                limit: function(){
                                    return {
                                        stale: function(){
                                            return {};
                                        }
                                    };
                                }
                            };
                        }
                    }
                },
                Update: {
                    BEFORE: 0
                }
            },
            Cluster: function() {
                var self = {};

                self.openBucket = function() {
                    return {
                        on: function() {
                        },
                        getAndLock: function(id, options, callback) {
                            expect(options.cas).to.not.be.null;
                            expect(id).to.not.be.null;
                            done();
                        },
                        upsert: function(id, job, options, callback){

                        },
                        query: function(q, callback) {
                            callback(null, [{
                                id: lockedJob.id,
                                value:lockedJob.code,
                                cas: 123
                            }]);
                        }
                    };
                };

                return self;
            }
        };

        mockery.registerMock('couchbase', mockCouchbase);

        var JobManager = require('../../../../salt-pepper/src/job-manager.js');
        var manager = new JobManager(mockConfig);

        manager.findAvailableJob([lockedJob.code], 'tester', function(err, result) {});
    });

    after(function() {
        mockery.disable();
    });
});