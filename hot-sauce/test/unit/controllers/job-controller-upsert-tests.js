describe('job-controller: upsert tests', function(){

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
    //TODO: validation tests

    it('should call next() with status 400 when body fails validation', function(done){
        var id = 1;
        var mockManager = function(){
            return {
                save: function(job, callback){
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
            checkBody: function(){
                return {
                    isObject: function(){},
                    empty: function(){},
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

        controller.upsert(mockRequest, mockResponse, function(err){
            expect(err.status).to.eql(400);
            done();
        });
    });

    it('should call the jobManager.save when body is valid', function(done){
        var mockManager = function(){
            return {
                save: function(job, callback){
                    callback(null, job);
                    assert.ok(true);
                    done();
                }
            };
        };

        var mockResponse = {
            json: function(job){
                assert.ok(true);
            }
        };

        var mockRequest = {
            checkBody: function(){
                return {
                    isObject: function(){},
                    empty: function(){},
                    notEmpty: function(){}
                }
            },
            validationErrors: function(){
                return null;
            }
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.upsert(mockRequest, mockResponse, function(){
            assert.fail();
        });
    });

    it('should call the json handler of the response when save is successful', function(done){
        var mockManager = function(){
            return {
                save: function(job, callback){
                    callback(null, job);
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
            checkBody: function(){
                return {
                    isObject: function(){},
                    empty: function(){},
                    notEmpty: function(){}
                }
            },
            validationErrors: function(){
                return null;
            }
        };

        mockery.registerMock('../../managers/job-manager.js', mockManager);

        var JobController = require('../../../src/api/controllers/job.js');
        var controller = new JobController({});

        controller.upsert(mockRequest, mockResponse, function(){
            assert.fail();
        });
    });

    after(function() {
        mockery.disable();
    });
});