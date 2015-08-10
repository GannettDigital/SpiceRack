'use strict';
module.exports = (function() {
    var EventEmitter = require('events').EventEmitter;
    var util = require('util');
    var request = require('request');
    var format = require('string-format');
    var Logger = require('salt-pepper').Logger;
    var JobsManager = require('./lib/jobs-manager.js');

    var events = {
        UNLOCK_LOCKED_JOBS: 'unlock-locked-jobs',
        GENERATE_INSTANCES: 'generate-instances',
        PROCESS_UNLOCKS: 'process-unlocks'
    };

    var Chives = function(config) {
        validateConfig(config);
        var self = this;
        var _logger = new Logger(config.logger);

        var _lockedJobsInterval = null;
        var _generateInstancesInterval = null;
        var _jobsManager = new JobsManager(config);

        function validateConfig(config){
            if(!config) throw new Error('config must be specified');
            if(!config.pollIntervals) throw new Error('pollIntervals must be specified');
            if(typeof(config.pollIntervals) !== 'object') throw new Error('pollIntervals must be an object');
            validatePollInterval(config.pollIntervals.generateInstances);
            validatePollInterval(config.pollIntervals.unlockJobs);

            if(!config.logger) throw new Error('logger must be configured');
            if(typeof(config.logger) !== 'object') throw new Error('logger must be an object');

            if(!config.hotSauceHost) throw new Error('hotSauceHost must be configured');
            if(!config.apiKey) throw new Error('apiKey must be configured for access to HotSauce');
        }

        function validatePollInterval(pollInterval){
            if(!pollInterval) throw new Error('pollInterval must be specified');
            if(typeof(pollInterval) !== 'number') throw new Error('pollInterval must be a number');
            if(pollInterval <= 0) throw new Error('pollInterval must be greater than 0');
        }

        self.start = function(){
            _logger.debug('starting unlock jobs process');
            _lockedJobsInterval = setInterval(function(){
                self.emit(events.UNLOCK_LOCKED_JOBS);
            }, config.pollIntervals.unlockJobs);

            _logger.debug('starting generate instances process');
            _generateInstancesInterval = setInterval(function(){
                self.emit(events.GENERATE_INSTANCES);
            }, config.pollIntervals.generateInstances);

        };

        self.stop = function(){
            _logger.debug('stopping unlock jobs process');
            clearInterval(_lockedJobsInterval);
            _logger.debug('stopping generate instances process');
            clearInterval(_generateInstancesInterval);
        };

        self.on(events.UNLOCK_LOCKED_JOBS, function(){
            _logger.debug('begin unlock jobs');
            var url = format('{0}/jobs/?apiKey={1}&locked=true',
                config.hotSauceHost,
                config.apiKey);
            _jobsManager.queryJobs(url, function(err, jobs){
                if(err){
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

        self.on(events.GENERATE_INSTANCES, function(){
            _logger.debug('begin generate instances job');
            //TODO: how to handle locked jobs close to expiration
            var url = format('{0}/jobs/?apiKey={1}&locked=false',
                config.hotSauceHost,
                config.apiKey);

            _jobsManager.queryJobs(url, function(err, jobs){
                if(err){
                    _logger.error('error with generate instances job', err);
                }
                else if(!jobs || jobs.length == 0) {
                    _logger.info('no jobs found to work on');
                } else {
                    _logger.debug(jobs);
                }
                _logger.debug('end generate instances jobs');
            });
        });

        return self;
    };

    util.inherits(Chives, EventEmitter);
    return Chives;
})();