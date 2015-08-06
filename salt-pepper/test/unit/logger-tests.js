describe('logger: logging tests', function() {
    var assert = require('assert');
    var expect = require('chai').expect;
    var Logger = require('../../src/logger.js');
    var testConfig = {
        console: {enabled: true},
        file: {enabled: false}
    };

    it('emits log event without args', function(done) {
        var logger = new Logger(testConfig);
        logger.eventEmitter.on(logger.events.LOG_EVENT_RAISED_EVENT, function(level, message, transactionId, caller, args) {
            assert.equal(level, 'info');
            assert.equal(message, 'test message');

            if(args) {
                assert.fail(args, undefined, 'args should be undefined!');
            }
            done();
        });

        logger.info('test message');
    });

    it('emits log event with all parameters', function(done) {
        var logger = new Logger(testConfig);
        logger.eventEmitter.on(logger.events.LOG_EVENT_RAISED_EVENT, function(level, message, transactionId, caller, args) {
            assert.equal(level, 'info');
            assert.equal(message, '%s message');
            assert.equal(args, 'test');
            assert.equal(transactionId, 123);
            expect(caller).to.not.be.null;
            done();
        });

        logger.info('%s message', 'test', 123);
    });

    ['info', 'debug', 'warn', 'error', 'fatal'].forEach(function(level) {
        it('emits log event with ' + level + ' level when ' + level + ' method is used', function(done) {
            var logger = new Logger(testConfig);
            logger.eventEmitter.on(logger.events.LOG_EVENT_RAISED_EVENT, function(emittedLevel) {
                assert.equal(level, emittedLevel);
                done();
            });

            logger[level]("test message");
        })
    });

});