describe('chives tests', function() {
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
        var Chives = require('../../index.js');
        var doIt = function() {
            new Chives();
        };

        expect(doIt).to.throw('config must be specified');
    });

    it('should throw error when pollInterval is not configured', function() {
        var Chives = require('../../index.js');
        var doIt = function() {
            new Chives({});
        };

        expect(doIt).to.throw('pollIntervals must be specified');
    });

    it('should throw error when pollIntervals is not an object', function() {
        var Chives = require('../../index.js');
        var doIt = function() {
            new Chives({
                pollIntervals: 'not object'
            });
        };

        expect(doIt).to.throw('pollIntervals must be an object');
    });

    it('should throw error when pollInterval for generateInstances is not specified', function() {
        var Chives = require('../../index.js');
        var doIt = function() {
            var config = {
                pollIntervals: {}
            };
            new Chives(config);
        };

        expect(doIt).to.throw('generateInstances must be specified');
    });

    it('should throw error when pollInterval for generateInstances is not a number', function() {
        var Chives = require('../../index.js');
        var doIt = function() {
            var config = {
                pollIntervals: {}
            };
            config.pollIntervals.generateInstances = 'nan';
            new Chives(config);
        };

        expect(doIt).to.throw('generateInstances must be a number');
    });

    it('should throw error when pollInterval for generateInstances is not a positive number', function() {
        var Chives = require('../../index.js');
        var doIt = function() {
            var config = {
                pollIntervals: {}
            };
            config.pollIntervals.generateInstances = -10;
            new Chives(config);
        };

        expect(doIt).to.throw('generateInstances must be greater than 0');
    });

    it('should throw error when pollInterval for unlockJobs is not specified', function() {
        var Chives = require('../../index.js');
        var doIt = function() {
            var config = {
                pollIntervals: {
                    generateInstances: 100
                }
            };
            new Chives(config);
        };

        expect(doIt).to.throw('unlockJobs must be specified');
    });

    it('should throw error when pollInterval for unlockJobs is not a number', function() {
        var Chives = require('../../index.js');
        var doIt = function() {
            var config = {
                pollIntervals: {}
            };
            config.pollIntervals.generateInstances = 1;
            config.pollIntervals.unlockJobs = 'nan';
            new Chives(config);
        };

        expect(doIt).to.throw('unlockJobs must be a number');
    });

    it('should throw error when pollInterval for unlockJobs is not a positive number', function() {
        var Chives = require('../../index.js');
        var doIt = function() {
            var config = {
                pollIntervals: {}
            };
            config.pollIntervals.generateInstances = 10;
            config.pollIntervals.unlockJobs = -10;
            new Chives(config);
        };

        expect(doIt).to.throw('unlockJobs must be greater than 0');
    });

    it('should throw error when logger is not configured', function() {
        var Chives = require('../../src/chives.js');
        var doIt = function() {
            new Chives({
                pollIntervals: {
                    generateInstances: 1,
                    unlockJobs: 1
                }
            });
        };

        expect(doIt).to.throw('logger must be configured');
    });

    it('should throw error when logger is not an object', function() {
        var Chives = require('../../index.js');
        var doIt = function() {
            new Chives({
                pollIntervals: {
                    generateInstances: 1,
                    unlockJobs: 1
                },
                logger: 'not an object'
            });
        };

        expect(doIt).to.throw('logger must be an object');
    });

    it('should not throw error when config is valid', function() {
        var Chives = require('../../index.js');
        var doIt = function() {
            new Chives({
                pollIntervals: {
                    generateInstances: 1,
                    unlockJobs: 1
                },
                logger: {},
                couchbase: {
                    bucket: {
                        name: 'x',
                        password: 'y'
                    },
                    cluster: []
                }
            });
        };

        expect(doIt).to.not.throw(Error);
    });

    it('should emit UNLOCK_LOCKED_JOBS event on start', function(done) {
        var Chives = require('../../index.js');

        var chives = new Chives({
            pollIntervals: {
                generateInstances: 1,
                unlockJobs: 1
            },
            logger: {},
            couchbase: {
                bucket: {
                    name: 'x',
                    password: 'y'
                },
                cluster: []
            }
        });

        chives.on('unlock-locked-jobs', function() {
            assert.ok(true);
            done();
            chives.stop();
        });

        chives.start();
    });

    it('should emit GENERATE_INSTANCES event on start', function(done) {
        var Chives = require('../../index.js');

        var chives = new Chives({
            pollIntervals: {
                generateInstances: 1,
                unlockJobs: 1
            },
            logger: {},
            couchbase: {
                bucket: {
                    name: 'x',
                    password: 'y'
                },
                cluster: []
            }
        });

        chives.on('generate-instances', function() {
            assert.ok(true);
            done();
            chives.stop();
        });

        chives.start();
    });

    after(function() {
        mockery.disable();
    });
});