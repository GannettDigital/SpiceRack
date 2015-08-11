'use strict';
module.exports = (function() {
    var EventEmitter = require('events').EventEmitter;
    var util = require('util');
    var request = require('request');
    var format = require('string-format');
    var SaltPepper = require('salt-pepper');

    var events = {
        UNLOCK_LOCKED_JOBS: 'unlock-locked-jobs',
        GENERATE_INSTANCES: 'generate-instances',
        PROCESS_UNLOCKS: 'process-unlocks'
    };

    var Chives = function(config) {
        validateConfig(config);
        var self = this;
        var _logger = new SaltPepper.Logger(config.logger);
        var _jobManager = new SaltPepper.JobManager(config);

        var _lockedJobsInterval = null;
        var _generateInstancesInterval = null;

        function validateConfig(config) {
            if(!config) throw new Error('config must be specified');
            if(typeof(config) !== 'object') throw new Error('config must be an object');
            if(!config.pollIntervals) throw new Error('pollIntervals must be specified');
            if(typeof(config.pollIntervals) !== 'object') throw new Error('pollIntervals must be an object');
            validatePollInterval(config.pollIntervals.generateInstances, 'generateInstances');
            validatePollInterval(config.pollIntervals.unlockJobs, 'unlockJobs');

            if(!config.logger) throw new Error('logger must be configured');
            if(typeof(config.logger) !== 'object') throw new Error('logger must be an object');

            if(!config.couchbase) throw new Error('couchbase must be specified');
            if(typeof(config.couchbase) !== 'object') throw new Error('couchbase must be an object');

            if(!config.couchbase.cluster) throw new Error('couchbase.cluster must be specified');
            if(!config.couchbase.bucket) throw new Error('couchbase.bucket must be specified');
        }

        function validatePollInterval(pollInterval, name) {
            if(!pollInterval) throw new Error(format('{0} must be specified', name));
            if(typeof(pollInterval) !== 'number') throw new Error(format('{0} must be a number', name));
            if(pollInterval <= 0) throw new Error(format('{0} must be greater than 0', name));
        }

        self.start = function() {
            _logger.debug('starting unlock jobs process');
            _lockedJobsInterval = setInterval(function() {
                self.emit(events.UNLOCK_LOCKED_JOBS);
            }, config.pollIntervals.unlockJobs);

            _logger.debug('starting generate instances process');
            _generateInstancesInterval = setInterval(function() {
                self.emit(events.GENERATE_INSTANCES);
            }, config.pollIntervals.generateInstances);

        };

        self.stop = function() {
            _logger.debug('stopping unlock jobs process');
            clearInterval(_lockedJobsInterval);
            _logger.debug('stopping generate instances process');
            clearInterval(_generateInstancesInterval);
        };

        self.on(events.UNLOCK_LOCKED_JOBS, function() {
            _logger.debug('begin unlock jobs');

            _jobManager.getLockedJobs(function(err, jobs) {
                if(err) {
                    _logger.error('error with unlock job', err);
                }
                else if(!jobs || jobs.length == 0) {
                    _logger.info('no jobs found to work on');
                } else {
                    self.emit(events.PROCESS_UNLOCKS, jobs);
                }
                _logger.debug('end unlock jobs');
            });
        });

        self.on(events.GENERATE_INSTANCES, function() {
            _logger.debug('begin generate instances job');
            //TODO: how to handle locked jobs close to expiration

            var baseDateTime = new Date().getTime();
            _jobManager.getUnlockedJobs(url, function(err, jobs) {
                if(err) {
                    _logger.error('error with generate instances job', err);
                } else if(!jobs || jobs.length == 0) {
                    _logger.info('no jobs found to work on');
                } else {
                    _logger.debug(jobs);
                    var regenerateEligibleJobs = [];
                    for(var i = 0; i < results.length; i++) {
                        var job = results[i].value;

                        //assume instances are always needed
                        var needsInstances = true;

                        for(var j = 0; j < job.schedule.future_instances.length; j++) {
                            var parsedDate = new Date(job.schedule.future_instances[j]);
                            if(parsedDate.getTime() > baseDateTime) {
                                needsInstances = false;
                                break;
                            }
                        }

                        if(needsInstances) {
                            regenerateEligibleJobs.push(job);
                        }
                    }
                }
                _logger.debug('end generate instances jobs');
            });
        });

        return self;
    };

    util.inherits(Chives, EventEmitter);
    return Chives;
})();