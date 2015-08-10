'use strict';
module.exports = (function(){
    var util = require('util');
    var format = require('string-format');
    var Logger = require('salt-pepper').Logger;
    var JobManager = require('salt-pepper').JobManager;
    var EventHandler = require('salt-pepper').EventHandler;

    var events = {
        JOB_FOUND: 'job-found',
        JOB_COMPLETE: 'job-complete',
        GET_JOB: 'get-job',
        JOB_ERROR: 'job-error'
    };

    var Ajwain = function(config){
        validateConfig(config);
        var self = this;
        var _interval = null;

        var _jobManager = new JobManager(config);
        var _eventHandler = new EventHandler(config);
        var _logger = new Logger(config.logger);

        self.registerJobHandler = function(options, fnJobHandler){
            validateRegisterParameters(options, fnJobHandler);
            _eventHandler.watchEvent(events.JOB_FOUND, function(job) {
                fnJobHandler(job);
            });

            _interval = setInterval(function(){
                _eventHandler.sendEvent(events.GET_JOB, options);
            }, config.pollInterval);
        };

        self.registerErrorHandler = function(fnErrorHandler){
            _eventHandler.watchEvent(events.JOB_ERROR, function(err){
                fnErrorHandler(err);
            });
        };

        self.completeJob = function(job, options){
            _eventHandler.sendEvent(events.JOB_COMPLETE, job, options);
        };

        self.shutdown = function(){
            if(!_interval) return;
            clearInterval(_interval);
        };

        function emitError(err){
            _eventHandler.sendEvent(events.JOB_ERROR, err);
        }

        function validateRegisterParameters(options, handlerFunction){
            if(!options.caller) throw new Error('caller must be specified in options');
            if(!options.jobCodes) throw new Error('jobCodes must be specified in options');
            if(!Array.isArray(options.jobCodes)) throw new Error('jobCodes must be an array');
            if(options.jobCodes.length == 0) throw new Error('at least one jobCode must be specified');
            if(typeof(handlerFunction) !== 'function') throw new Error('handler must be a function');
        }

        function validateConfig(config){
            if(!config) throw new Error('config must be specified');
            if(!config.pollInterval) throw new Error('pollInterval must be specified');
            if(typeof(config.pollInterval) !== 'number') throw new Error('pollInterval must be a number');
            if(config.pollInterval <= 0) throw new Error('pollInterval must be greater than 0');

            if(!config.logger) throw new Error('logger must be configured');
            if(typeof(config.logger) !== 'object') throw new Error('logger must be an object');

            if(!config.couchbase) throw new Error('couchbase must be specified');
            if(typeof(config.couchbase) !== 'object') throw new Error('couchbase must be an object');

            if(!config.couchbase.cluster) throw new Error('couchbase.cluster must be specified');
            if(!config.couchbase.bucket) throw new Error('couchbase.bucketmust be specified');
        }

        _eventHandler.watchEvent(events.GET_JOB, function(options){

            _jobManager.findAvailableJob(options.jobCodes, options.caller, function(err, job){
                if(err){
                    emitError(err);
                } else if (job){
                    _logger.info('received job: ' + job.id);
                    var jobToProcess = {
                        id: job.id,
                        code: job.code,
                        jobData: job.jobData,
                        scheduledRun: job.triggeringOccurrence

                    };
                    _eventHandler.sendEvent(events.JOB_FOUND, jobToProcess);
                } else {
                    //no job for now. nothing to do
                }
            });
        });

        _eventHandler.watchEvent(events.JOB_COMPLETE, function(job, options){
            _jobManager.unlock(job.id, options.caller, function(err) {
                if(err) {
                    _logger.error('error unlocking job: ' + job.id, err);
                }
            });
        });

        return self;
    };

    return Ajwain;
})();