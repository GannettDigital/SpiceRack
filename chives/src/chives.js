'use strict';
module.exports = (function() {
    var EventEmitter = require('events').EventEmitter;
    var util = require('util');
    var request = require('request');
    var format = require('string-format');
    var Logger = require('salt-pepper').Logger;

    var events = {
        UNLOCK_LOCKED_JOBS: 'unlock-locked-jobs',
        GENERATE_INSTANCES: 'generate-instances'
    };

    var Chives = function(config) {
        validateConfig(config);
        var logger = new Logger(config.logger);
        var self = this;
        var lockedJobsInterval = null;
        var generateInstancesInterval = null;


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
            logger.debug('starting unlock jobs process');
            lockedJobsInterval = setInterval(function(){
                self.emit(events.UNLOCK_LOCKED_JOBS);
            }, config.pollIntervals.unlockJobs);

            logger.debug('starting generate instances process');
            generateInstancesInterval = setInterval(function(){
                self.emit(events.GENERATE_INSTANCES);
            }, config.pollIntervals.generateInstances);

        };

        self.stop = function(){
            logger.debug('stopping unlock jobs process');
            clearInterval(lockedJobsInterval);
            logger.debug('stopping generate instances process');
            clearInterval(generateInstancesInterval);
        };

        self.on(events.UNLOCK_LOCKED_JOBS, function(){
            logger.debug('begin unlock jobs');
            logger.debug('end unlock jobs');
        });

        self.on(events.GENERATE_INSTANCES, function(){
            logger.debug('begin generate instances job');
            logger.debug('end generate instances jobs');
        });

        return self;
    };

    util.inherits(Chives, EventEmitter);
    return Chives;
})();