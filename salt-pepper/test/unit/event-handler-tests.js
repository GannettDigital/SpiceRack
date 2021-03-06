describe('event-handler tests', function() {

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

    it('should register the handler for the specified event type on watchEvent', function(done){
        var EventHandler = require('../../src/event-handler.js');
        var eventHandler = new EventHandler({
            logger: {}
        });

        eventHandler.watchEvent('some-type', function(arg1, arg2){
            expect(arg1).to.eql('arg1');
            expect(arg2).to.eql('arg2');
            done();
        });

        eventHandler.sendEvent('some-type', 'arg1', 'arg2');
    });

    it('should log a warning when an unregistered eventType is supplied to sendEvent', function(done){
        var mockLogger = function() {
            return {
                warn: function(msg) {
                    expect(msg).to.eql('No handler registered for: unknown event');
                    done();
                }
            }
        };

        mockery.registerMock('./logger.js', mockLogger);

        var EventHandler = require('../../src/event-handler.js');
        var eventHandler = new EventHandler({
            logger: {}
        });


        eventHandler.sendEvent('unknown event', 'arg1', 'arg2');
    });

    it('should return an array of registered listeners in the listeners method', function(){
        var EventHandler = require('../../src/event-handler.js');
        var eventHandler = new EventHandler({
            logger: {}
        });

        var eventType = 'some-event';
        eventHandler.watchEvent(eventType, function(){});

        expect(eventHandler.listeners(eventType)).to.be.a('array');
    });

    after(function() {
        mockery.disable();
    });
});