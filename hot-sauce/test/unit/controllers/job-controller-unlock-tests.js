describe('job-controller: unlock tests', function(){

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

    it('should call next() with status 400 when body fails validation', function(done){
        var id = 1;
        var mockManager = function(){
            return {
                unlock: function(job, callback){
                    assert.fail();
                }
            };
        };

        var mockResponse = {
            json: function(){
                assert.fail();
            }
        };

        var mockRequest = {
            checkParams: function(){
                return {
                    notEmpty: function(){}
                }
            },
            checkQuery: function(){
                return {
                    notEmpty: function(){}
                }
            },
            validationErrors: function(){
                return [{
                    param: 'id',
                    error: 'is required'
                }];
            }
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.unlock(mockRequest, mockResponse, function(err){
            expect(err.status).to.eql(400);
            done();
        });
    });

    it('should call manager.unlock when request is valid', function(done){
        var id = 1;
        var mockManager = function(){
            return {
                unlock: function(job, callback){
                    assert.ok(true);
                    done();
                }
            };
        };

        var mockResponse = {
            json: function(){
                assert.fail();
            }
        };

        var mockRequest = {
            checkParams: function(){
                return {
                    notEmpty: function(){}
                }
            },
            checkQuery: function(){
                return {
                    notEmpty: function(){}
                }
            },
            validationErrors: function(){
                return null;
            },
            params: {
                id: 1
            },
            query: {
                caller: 'tester'
            }
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.unlock(mockRequest, mockResponse, function(){});
    });

    it('should call the json handler of the response when unlock is successful', function(done){
        var mockManager = function(){
            return {
                unlock: function(id, caller, callback){
                    callback(null, {id: id});
                }
            };
        };

        var mockResponse = {
            json: function(job){
                assert.ok(true);
                done();
            }
        };

        var mockRequest = {
            checkParams: function(){
                return {
                    notEmpty: function(){}
                }
            },
            checkQuery: function(){
                return {
                    notEmpty: function(){}
                }
            },
            validationErrors: function(){
                return null;
            },
            params: {
                id: 1
            },
            query: {
                caller: 'tester'
            }
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.unlock(mockRequest, mockResponse, function(){
            assert.fail();
        });
    });

    it('should call next with err when unlock error occurfs', function(done){
        var mockManager = function(){
            return {
                unlock: function(id, caller, callback){
                    var err = new Error('unlock error');
                    callback(err, null);
                }
            };
        };

        var mockResponse = {};

        var mockRequest = {
            checkParams: function(){
                return {
                    notEmpty: function(){}
                }
            },
            checkQuery: function(){
                return {
                    notEmpty: function(){}
                }
            },
            validationErrors: function(){
                return null;
            },
            params: {
                id: 1
            },
            query: {
                caller: 'tester'
            }
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.unlock(mockRequest, mockResponse, function(err){
            expect(err).to.not.be.null;
            done();
        });
    });

    it('should call json handler with 404 when invalid job is passed to unlock', function(done){
        var mockManager = function(){
            return {
                unlock: function(id, caller, callback){
                    callback(null, null);
                }
            };
        };

        var mockResponse = {
            status: function(code) {
                expect(code).to.eql(404);
                return {
                    json: function(obj) {
                        expect(obj.message).eql('Job not found');
                        done();
                    }
                }
            }
        };

        var mockRequest = {
            checkParams: function(){
                return {
                    notEmpty: function(){}
                }
            },
            checkQuery: function(){
                return {
                    notEmpty: function(){}
                }
            },
            validationErrors: function(){
                return null;
            },
            params: {
                id: 1
            },
            query: {
                caller: 'tester'
            }
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.unlock(mockRequest, mockResponse, function(err){
            assert.fail();
        });
    });

    after(function() {
        mockery.disable();
    });
});