describe('jobs router tests', function() {
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

    it('registers job routes on initialize', function() {

        var mockController = function(){
          return {

          }
        };

        var getRoutesRegistered = [];
        var postRoutesRegistered = [];

        var mockApp = {
            get: function(route){
                getRoutesRegistered.push(route);
            },
            post: function(route){
                postRoutesRegistered.push(route);
            }
        };

        mockery.registerMock('../controllers/job.js', mockController);
        var router = require('../../../src/api/routers/job.js');

        router.initialize(mockApp, {});

        expect(getRoutesRegistered).contain('/jobs');
        expect(getRoutesRegistered).contain('/jobs/:id');
        expect(postRoutesRegistered).contain('/jobs');

    });

    after(function() {
        mockery.disable();
    });
});