'use strict';
module.exports = (function(){
    var EventEmitter = require('events').EventEmitter;
    var util = require('util');
    var request = require('request');
    var format = require('string-format');
    var Logger = require('salt-pepper').Logger;

    var events = {
        JOB_FOUND: 'job-found',
        JOB_COMPLETE: 'job-complete',
        GET_JOB: 'get-job',
        JOB_ERROR: 'job-error'
    };

    var Ajwain = function(config){
        validateConfig(config);
        var logger = new Logger(config.logger);
        var self = this;
        var interval = null;

        self.registerJobHandler = function(options, fnJobHandler){
            validateRegisterParameters(options, fnJobHandler);
            self.on(events.JOB_FOUND, function(job) {
                fnJobHandler(job, function() {
                    self.emit(events.JOB_COMPLETE, job);
                });
            });

            interval = setInterval(function(){
                self.emit(events.GET_JOB, options);
            }, config.pollInterval);
        };

        self.registerErrorHandler = function(fnErrorHandler){
            self.on(events.JOB_ERROR, function(err){
                fnErrorHandler(err);
            });
        };

        self.completeJob = function(job, options){
            self.emit(events.JOB_COMPLETE, job, options);
        };

        self.shutdown = function(){
            if(!interval) return;
            clearInterval(interval);
        };

        function emitError(err){
            if(self.listeners(events.JOB_ERROR).length == 0){
                logger.warn('error encountered, but no error handler registered ' + err);
            } else {
                self.emit(events.JOB_ERROR, err);
            }
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

            if(!config.hotSauceHost) throw new Error('hotSauceHost must be configured');
            if(!config.apiKey) throw new Error('apiKey must be configured for access to HotSauce');

        }

        self.on(events.GET_JOB, function(options){
            var url = format('{3}/api/jobs/available?apiKey={2}&codes={0}&caller={1}',
                options.jobCodes.join(),
                options.caller,
                config.apiKey,
                config.hotSauceHost);

            request(url, function(error, response, body){
                if(error){
                    emitError(error);

                } else if(response.statusCode != 200 && response.statusCode != 404) {
                    var err = new Error();
                    err.message = 'Unexpected status code ' + response.statusCode;
                    err.statusCode = response.statusCode;
                    emitter.emit(events.JOB_ERROR, err);
                } else if(response.statusCode != 404){
                    try {
                        var job = JSON.parse(body);
                        logger.info('received job: ' + job.id);
                        if(job.jobData) {
                            var jobToProcess = {
                                id: job.id,
                                code: job.code,
                                jobData: job.jobData,
                                scheduledRun: job.triggeringOccurrence

                            };
                            emitter.emit(events.JOB_FOUND, jobToProcess);
                        }
                    } catch (err){
                        emitter.emit(events.JOB_ERROR, err);
                    }
                } else {
                    //no job found, so just move on. nothing to see here
                }
            });
        });

        self.on(events.JOB_COMPLETE, function(job, options){
            var url = format('{3}/api/jobs/{0}/unlock?apiKey={2}&caller={1}',
                job.id,
                options.caller,
                config.apiKey,
                config.hotSauceHost);
            request(url, function(err, response, body){
                if(err){
                    emitError(err);
                } else if(response.statusCode != 200 && response.statusCode != 404) {
                    var err = new Error();
                    err.message = 'Unexpected status code ' + response.statusCode;
                    err.statusCode = response.statusCode;
                    emitError(err);
                } else {
                    logger.info('unlocked job: ' + JSON.parse(body).id);
                }
            });
        });


        return self;
    };

    util.inherits(Ajwain, EventEmitter);

    return Ajwain;
})();