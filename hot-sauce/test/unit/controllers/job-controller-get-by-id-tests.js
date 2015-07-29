describe('job-controller: getById tests', function(){

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

    it('should call jobManager getJob on getById action', function(done){
        var id = 1;
        var mockManager = function(){
            return {
                getJob: function(id){
                    expect(id).to.eql(id);
                    done();
                }
            };
        };

        var mockResponse = {
            json: function(){}
        };
        var mockRequest = {
            params: {
                id: id
            }
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.getById(mockRequest, mockResponse, function(){});
    });

    it('should call the next() function with an error & status 404 when couchbase returns error code 13', function(done){
        var id = 1;
        var mockManager = function(){
            return {
                getJob: function(id, callback){
                    var err = new Error();
                    err.code = 13;
                    callback(err);
                }
            };
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        var mockRequest = {
            params: {
                id: id
            }
        };

        controller.getById(mockRequest, {}, function(err){
            expect(err.status).to.eql(404);
            done();
        });
    });

    it('should call the next() function with an error without setting status when couchbase returns a non 13 error code', function(done){
        var id = 1;
        var mockManager = function(){
            return {
                getJob: function(id, callback){
                    var err = new Error();
                    err.code = 14;
                    callback(err);
                }
            };
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        var mockRequest = {
            params: {
                id: id
            }
        };

        controller.getById(mockRequest, {}, function(err){
            expect(err.status).to.be.empty;
            done();
        });
    });

    it('should call the json handler of the response when couchbase returns successfully', function(done){
        var id = 1;
        var result = {key: 'value'};
        var mockManager = function(){
            return {
                getJob: function(id, callback){
                    callback(null, result);
                }
            };
        };

        var mockResponse = {
            json: function(cbResult){
                expect(cbResult).deep.eql(result);
                done();
            }
        };

        var mockRequest = {
            params: {
                id: id
            }
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.getById(mockRequest, mockResponse, function(){});
    });

    after(function() {
        mockery.disable();
    });
});