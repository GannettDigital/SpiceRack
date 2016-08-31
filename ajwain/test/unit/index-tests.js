describe('ajwain: index tests', function() {
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

    it('should return the ajwain function on requiring index.js', function(){
        var Ajwain = require('../../index.js');

        expect(Ajwain).to.be.a('function');
    });
});