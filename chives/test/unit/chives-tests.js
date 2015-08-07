describe('ajwain tests', function() {
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

    it('should throw error when config is not supplied', function() {
        var Ajwain = require('../../src/chives.js');
        var doIt = function() {
            new Ajwain();
        };

        expect(doIt).throw('config must be specified');
    });

    it('should throw error when pollInterval is not configured', function() {
        var Ajwain = require('../../src/chives.js');
        var doIt = function() {
            new Ajwain({});
        };

        expect(doIt).throw('pollIntervals must be specified');
    });

    it('should throw error when pollInterval for generateInstances is not a number', function() {
        var Ajwain = require('../../src/chives.js');
        var doIt = function() {
            var config = {
                pollIntervals: {}
            };
            config.pollIntervals.generateInstances = 'nan';
            new Ajwain(config);
        };

        expect(doIt).throw('pollInterval must be a number');
    });

    it('should throw error when pollInterval for generateInstances is not a positive number', function() {
        var Ajwain = require('../../src/chives.js');
        var doIt = function() {
            var config = {
                pollIntervals: {}
            };
            config.pollIntervals.generateInstances = -10;
            new Ajwain(config);
        };

        expect(doIt).throw('pollInterval must be greater than 0');
    });

    it('should throw error when pollInterval for unlockJobs is not a number', function() {
        var Ajwain = require('../../src/chives.js');
        var doIt = function() {
            var config = {
                pollIntervals: {}
            };
            config.pollIntervals.generateInstances = 1;
            config.pollIntervals.unlockJobs = 'nan';
            new Ajwain(config);
        };

        expect(doIt).throw('pollInterval must be a number');
    });

    it('should throw error when pollInterval for unlockJobs is not a positive number', function() {
        var Ajwain = require('../../src/chives.js');
        var doIt = function() {
            var config = {
                pollIntervals: {}
            };
            config.pollIntervals.generateInstances = -10;
            config.pollIntervals.unlockJobs = -10;
            new Ajwain(config);
        };

        expect(doIt).throw('pollInterval must be greater than 0');
    });

    it('should throw error when logger is not configured', function() {
        var Ajwain = require('../../src/chives.js');
        var doIt = function() {
            new Ajwain({
                pollIntervals: {
                    generateInstances: 1,
                    unlockJobs: 1
                }
            });
        };

        expect(doIt).throw('logger must be configured');
    });

    it('should throw error when logger is not an object', function() {
        var Ajwain = require('../../src/chives.js');
        var doIt = function() {
            new Ajwain({
                pollIntervals: {
                    generateInstances: 1,
                    unlockJobs: 1
                },
                logger: 'not an object'
            });
        };

        expect(doIt).throw('logger must be an object');
    });

    it('should throw error when apiKey is not configured', function() {
        var Ajwain = require('../../src/chives.js');
        var doIt = function() {
            new Ajwain({
                pollIntervals: {
                    generateInstances: 1,
                    unlockJobs: 1
                },
                logger: {},
                hotSauceHost: 'some.host'
            });
        };

        expect(doIt).throw('apiKey must be configured');
    });

    it('should throw error when hotSauceHost is not configured', function() {
        var Ajwain = require('../../src/chives.js');
        var doIt = function() {
            new Ajwain({
                pollIntervals: {
                    generateInstances: 1,
                    unlockJobs: 1
                },
                logger: {},
                apiKey: 'apiKey'
            });
        };

        expect(doIt).throw('hotSauceHost must be configured');
    });

    after(function() {
        mockery.disable();
    });
});