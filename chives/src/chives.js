'use strict';
module.exports = (function() {
    var EventEmitter = require('events').EventEmitter;
    var SaltPepper = require('salt-pepper');

    var util = require('util');
    var request = require('request');
    var format = require('string-format');
    var ms = require('ms');
    var os = require('os');

    var events = {
        UNLOCK_LOCKED_JOBS: 'unlock-locked-jobs',
        GENERATE_INSTANCES: 'generate-instances',
        PROCESS_UNLOCKS: 'process-unlocks',
        PROCESS_GENERATE_INSTANCES: 'process-generate-instances',
        PROCESS_SAVE: 'process-save'
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
            if(pollInterval === null || pollInterval === undefined) throw new Error(format('{0} must be specified', name));
            if(typeof(pollInterval) !== 'number') throw new Error(format('{0} must be a number', name));
            if(pollInterval < 0) throw new Error(format('{0} 0 or greater', name));
        }

        function unlockLockedJobsHandler(){
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
        }

        function generateInstancesHandler() {
            _logger.debug('begin generate instances job');
            //TODO: how to handle locked jobs close to expiration

            var baseDateTime = new Date().getTime();
            _jobManager.getUnlockedJobs(function(err, jobs) {
                if(err) {
                    _logger.error('error with generate instances job', err);
                } else if(!jobs || jobs.length == 0) {
                    _logger.info('no jobs found to work on');
                } else {
                    self.emit(events.PROCESS_GENERATE_INSTANCES, baseDateTime, jobs);
                }
                _logger.debug('end generate instances jobs');
            });
        }

        self.start = function() {
            if(config.pollIntervals.unlockJobs > 0) {
                self.on(events.UNLOCK_LOCKED_JOBS, unlockLockedJobsHandler);

                _lockedJobsInterval = setInterval(function() {
                    _logger.debug('starting unlock jobs process');
                    self.emit(events.UNLOCK_LOCKED_JOBS);
                }, config.pollIntervals.unlockJobs);
            }

            if(config.pollIntervals.generateInstances > 0) {
                self.on(events.GENERATE_INSTANCES, generateInstancesHandler);
                _generateInstancesInterval = setInterval(function() {
                    _logger.debug('starting generate instances process');
                    self.emit(events.GENERATE_INSTANCES);
                }, config.pollIntervals.generateInstances);
            }
        };

        self.stop = function() {
            if(_lockedJobsInterval) {
                _logger.debug('stopping unlock jobs process');
                clearInterval(_lockedJobsInterval);
            }
            if(_generateInstancesInterval) {
                _logger.debug('stopping generate instances process');
                clearInterval(_generateInstancesInterval);
            }
        };

        self.on(events.PROCESS_UNLOCKS, function(jobs) {
            var baseDateTime = new Date().getTime();
            for(var i = 0; i < jobs.length; i++) {
                var job = jobs[i];
                if(!job.schedule.expirationThreshold){
                    _logger.warn(format('Job: {0} does not have an expiration threshold. Moving on...', job.id));
                    continue;
                }

                var expirationDiff = baseDateTime - new Date(job.locking.lockedOn).getTime();
                if(expirationDiff > job.schedule.expirationThreshold){
                    //expired job even though it is locked. unlock it!
                    _logger.warn(format('Job: {0} is locked, and has exceeded the expiration threshold by {1}. Forcefully unlocking', job.id, ms(expirationDiff - job.schedule.expirationThreshold)));
                    _jobManager.unlock(job.id, format('{0}-{1}', os.hostname(), 'chives'), function(err){
                        if(err){
                            _logger.error('Error unlocking job', err);
                        } else {
                            _logger.debug(format('Job: {0} forcefully unlocked. ', job.id));
                        }
                    });
                } else {
                    //locked job within acceptable threshold
                    _logger.info(format('Job: {0} is locked, but may be forcefully unlocked in {1}', job.id, ms(job.schedule.expirationThreshold - expirationDiff)));
                }

            }
        });



        self.on(events.PROCESS_GENERATE_INSTANCES, function(baseDateTime, jobs){
            for(var i = 0; i < jobs.length; i++) {
                var job = jobs[i];

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
                    self.emit(events.PROCESS_SAVE, job);
                }
            }
        });

        self.on(events.PROCESS_SAVE, function(job){
            _jobManager.save(job, function(err, job){
                if(!err) {
                    _logger.info(format('job {0} resaved. ', job.id));
                } else {
                    _logger.info(format('error resaving job {0}. ', err));
                }
            });
        });

        return self;
    };

    util.inherits(Chives, EventEmitter);
    return Chives;
})();