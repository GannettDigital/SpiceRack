describe('job-controller: getAll tests', function(){

    var mockery = require('mockery');
    var assert = require('assert');
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

    it('should call jobManager getAllJobs on getAll action', function(done){
        var mockSaltPepper = {
            JobManager: function() {
                return {
                    getAllJobs: function() {
                        assert.ok(true);
                        done();
                    }
                }
            }
        };

        var mockResponse = {
            json: function(){}
        };

        mockery.registerMock('salt-pepper', mockSaltPepper);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.getAll({}, mockResponse, function(){});
    });

    it('should call the next() function with an error & status 404 when couchbase returns error code 13', function(done){
        var mockSaltPepper = {
            JobManager: function() {
                return {
                    getAllJobs: function(callback) {
                        var err = new Error();
                        err.code = 13;
                        callback(err);
                    }
                }
            }
        };

        mockery.registerMock('salt-pepper', mockSaltPepper);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.getAll({}, {}, function(err){
            expect(err.status).to.eql(404);
            done();
        });
    });

    it('should call the next() function with an error without setting status when couchbase returns a non 13 error code', function(done){
        var mockSaltPepper = {
            JobManager: function() {
                return {
                    getAllJobs: function(callback) {
                        var err = new Error();
                        err.code = 14;
                        callback(err);
                    }
                }
            }
        };

        mockery.registerMock('salt-pepper', mockSaltPepper);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.getAll({}, {}, function(err){
            expect(err.status).to.be.empty;
            done();
        });
    });

    it('should call the json handler of the response when couchbase returns successfully', function(done){
        var results = [{key: 'value'}];
        var mockSaltPepper = {
            JobManager: function() {
                return {
                    getAllJobs: function(callback) {
                        callback(null, results);
                    }
                }
            }
        };

        var mockResponse = {
            json: function(cbResult){
                expect(cbResult).deep.eql(results);
                done();
            }
        };

        mockery.registerMock('salt-pepper', mockSaltPepper);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.getAll({}, mockResponse, function(){});
    });

    after(function() {
        mockery.disable();
    });
});