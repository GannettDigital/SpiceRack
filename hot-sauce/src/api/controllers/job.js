'use strict';
module.exports = (function () {

    var JobsManager = require('salt-pepper').JobManager;

    var JobsController = function(config) {
        var self = {};
        var jobsManager = new JobsManager(config);

        self.getAll = function(req, res, next) {
            jobsManager.getAllJobs(function(err, jobs) {
                if(err) {
                    if(err.code === 13) {
                        err.status = 404;
                    }
                    return next(err);
                } else {
                    res.json(jobs);
                }
            });
        };

        self.unlock = function(req, res, next){
            req.checkParams('id', 'is required').notEmpty();
            req.checkQuery('caller', 'is required').notEmpty();
            var validationErrors = req.validationErrors();
            if (validationErrors) {
                var error = new Error();
                error.status = 400;
                error.errors = validationErrors;
                return next(error);
            }

            jobsManager.unlock(req.params.id, req.query.caller, function(err, job){
                if(err){
                    return next(err);
                } else {
                    if(job){
                        res.json(job);
                    } else {
                        res.status(404).json({message: 'Job not found'});
                    }
                }
            });
        };

        self.getAvailable = function(req, res, next){
            req.checkQuery('codes', 'is required').notEmpty();
            req.checkQuery('caller', 'is required').notEmpty();
            var validationErrors = req.validationErrors();
            if (validationErrors) {
                var error = new Error();
                error.status = 400;
                error.errors = validationErrors;
                return next(error);
            }

            var parsedCodes = req.query.codes.split(',');

            jobsManager.findAvailableJob(parsedCodes, req.query.caller, function(err, job){
                if(err){
                    return next(err);
                } else {
                    if(job){
                        res.json(job);
                    } else {
                        res.status(404).json({message: 'available job not found'});
                    }
                }
            });
        };

        self.getById = function(req, res, next) {
           jobsManager.getJob(req.params.id, function(err, job) {
                if(err) {
                    if(err.code === 13) {
                        err.status = 404;
                    }
                    return next(err);
                } else {
                    res.json(job);
                }
            });
        };

        self.upsert = function(req, res, next){
            req.checkBody('id', 'is required').notEmpty();
            req.checkBody('name', 'is required').notEmpty();
            req.checkBody('code', 'is required').notEmpty();
            req.checkBody('description', 'is required').notEmpty();
            req.checkBody('jobData', 'is required').notEmpty();
            req.checkBody('jobData', 'must be an object').isObject();
            req.checkBody('schedule', 'is required').notEmpty();
            req.checkBody('schedule', 'must be an object').isObject();
            req.checkBody('schedule.cron', 'is required').notEmpty();
            req.checkBody('locking', 'may not be updated through the api').empty();

            var validationErrors = req.validationErrors();
            if (validationErrors) {
                var error = new Error();
                error.status = 400;
                error.errors = validationErrors;
                return next(error);
            } else {
                var job = req.body;
                jobsManager.save(job, function(err, job){
                    res.json(job);
                });
            }
        };
        return self;
    };

    return JobsController;
})();
