describe('chives: index tests', function() {
    var mockery = require('mockery');
    var expect = require('chai').expect;

    before(function () {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
    });

    beforeEach(function () {
        mockery.deregisterAll();
        mockery.resetCache();
        mockery.registerMock('./src/job-manager.js', function () { return {};});
    });

    after(function() {
        mockery.disable();
    });

    it('should return the chives function on requiring index.js', function(){
        var Chives = require('../../index.js');

        expect(Chives).to.be.a('function');
    });
});