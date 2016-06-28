'use strict';

module.exports = (function () {
    var couchbase = require('couchbase');
    var format = require('string-format');

    var Logger = require('./logger.js');
    var EventHandler = require('./event-handler.js');
    var ScheduleManager = require('./schedule-manager.js');
    var ViewQuery = couchbase.ViewQuery;

    function JobManager(config) {
        var manager = {};
        var _logger = new Logger(config.logger);
        var _couchbaseCluster = new couchbase.Cluster(config.couchbase.cluster);
        var _scheduleManager = new ScheduleManager(config);
        var _eventHandler = new EventHandler(config);
        var _events = {
            QUERY_AVAILABLE_JOBS: 'query-available-jobs',
            GET_AND_LOCK: 'get-lock-job',
            LOCK_JOB: 'lock-job',
            UNLOCK_JOB: 'unlock-job',
            HANDLE_RESPONSE: 'handle-response'
        };

        var _bucket = getOpenedBucket();

        manager.getAllJobs = function(afterGet) {
            //todo: limit, skip
            var query = ViewQuery.from('jobs', 'GetAllJobs');
            _bucket.query(query, function(err, results){
                var rows = null;
                if(!err){
                    rows = results.map(function(row){
                        return row.value;
                    });
                }
                afterGet(err, rows);
            });
        };

        manager.findAvailableJob = function(jobCodes, caller, afterGet) {
            _eventHandler.sendEvent(_events.QUERY_AVAILABLE_JOBS, jobCodes, caller, afterGet);
        };

        manager.getJob = function(id, afterGet) {
            if(!id) throw new Error('id is required to get a specific job');
            if(!afterGet) throw new Error('afterGet is required');
            if(!(afterGet instanceof Function)) throw new Error('afterGet must be a function');

            _bucket.get(id, function(err, result) {
                afterGet(err, result ? result.value : null);
            });
        };

        manager.save = function(job, afterSave){
            var jobToSave = addMetadataToJob(job);
            _bucket.upsert(job.id, jobToSave, function(err){
                afterSave(err, err ? null : jobToSave);
            });
        };

        manager.unlock = function(id, caller, afterUnlock){
            _bucket.getAndLock(id, {lockTime: 30}, function(err, result){
               if(err){
                   _eventHandler.sendEvent(_events.HANDLE_RESPONSE, afterUnlock, err);
               } else {
                   _eventHandler.sendEvent(_events.UNLOCK_JOB, result, caller, afterUnlock);
               }
            });
        };

        manager.getLockedJobs = function(afterGet) {
            var startKey = [true];
            var endKey = {};

            var query = ViewQuery
                .from('jobs', 'GetJobsMaintenance')
                .range(startKey, endKey);
            _bucket.query(query, function(err, results){
                var rows = null;
                if(!err){
                    rows = results.map(function(row){
                        return row.value;
                    });
                }
                _eventHandler.sendEvent(_events.HANDLE_RESPONSE, afterGet, err, rows);
            });
        };

        manager.getUnlockedJobs = function(afterGet) {
            // cb sorts values in the following order:
            // null, false, true, Numbers ...
            // since unlocked jobs are defined as those that have never  been locked or
            // have locked=false, querying from null to true (but not inclusive_end) should suffice
            var startKey = [null];
            var endKey = [true];

            var query = ViewQuery
                .from('jobs', 'GetJobsMaintenance')
                .range(startKey, endKey);
            _bucket.query(query, function(err, results) {
                var rows = null;
                if(!err) {
                    rows = results.map(function(row){
                        return row.value;
                    });
                }
                _eventHandler.sendEvent(_events.HANDLE_RESPONSE, afterGet, err, rows);
            });
        };

        function getOpenedBucket(){
            var bucket = _couchbaseCluster.openBucket(config.couchbase.bucket.name, config.couchbase.bucket.password);
            bucket.on('error', function(err) {
                _logger.error('Bucket Error: ', err);
            });

            bucket.on('connect', function() {
                _logger.info('Connected to bucket');
            });

            return bucket;
        }

        function addMetadataToJob(job){
            job.locking = job.locking || {
                locked: false
            };

            //add instance information
            var base = new Date();
            base.setMilliseconds(0);

            var options = {
                currentDate: base
            };

            if (job.schedule.triggerScheduledDate)
                job.schedule.future_instances = [job.schedule.triggerScheduledDate];
            else
                job.schedule.future_instances = _scheduleManager.generateFutureInstances(job.schedule.cron, options);
            if(job.schedule.future_instances.length == 0){
                //Should fail loudly or something
                _logger.warn(format('{0} generated 0 occurrences.', job.schedule.cron));
            }
            return job;
        }

        _eventHandler.watchEvent(_events.QUERY_AVAILABLE_JOBS, function(jobCodes, caller, afterGet){
            var now = new Date();
            now.setMilliseconds(0);
            var startTime = new Date(now);
            var endTime = new Date(now);
            var startKey, endKey;

            var query = ViewQuery
                .from('jobs', 'GetJobIfAvailable')
                .stale(ViewQuery.Update.BEFORE);

            if (!config.query) {
                //default behavior for backward compatibility
                //margin of error is 5s
                endTime = endTime.getUTCSeconds() + 5;
                startKey = [startTime.getUTCFullYear(), startTime.getUTCMonth()+1, startTime.getUTCDate(), startTime.getUTCHours(), startTime.getUTCMinutes(), startTime.getUTCSeconds()];
                endKey =   [endTime.getUTCFullYear(), endTime.getUTCMonth()+1, endTime.getUTCDate(), endTime.getUTCHours(), endTime.getUTCMinutes(), endTime.getUTCSeconds()];
                query = query
                    .range(startKey, endKey)
                    .limit(100);
            }
            else
            {
                if (config.query.range) {
                    startTime = endTime.getUTCSeconds() + (config.query.range.startOffset || 0);
                    endTime = endTime.getUTCSeconds() + (config.query.range.endOffset || 5);
                    startKey = [startTime.getUTCFullYear(), startTime.getUTCMonth()+1, startTime.getUTCDate(), startTime.getUTCHours(), startTime.getUTCMinutes(), startTime.getUTCSeconds()];
                    endKey = [endTime.getUTCFullYear(), endTime.getUTCMonth()+1, endTime.getUTCDate(), endTime.getUTCHours(), endTime.getUTCMinutes(), endTime.getUTCSeconds()];
                    query = query.range(startKey, endKey);
                }
                if (config.query.limit) {
                    query = query.limit(config.query.limit);
                }
            }

            _bucket.query(query, function(err, results) {
                if(!err) {
                    var options = {
                        results: results,
                        jobCodes: jobCodes,
                        caller: caller,
                        callback: afterGet,
                        baseDate: now
                    };
                    _eventHandler.sendEvent(_events.GET_AND_LOCK, options);
                } else {
                    _eventHandler.sendEvent(_events.HANDLE_RESPONSE, afterGet, err);
                }
            });
        });

        _eventHandler.watchEvent(_events.GET_AND_LOCK, function(options){
            var results = options.results;
            var jobCodes = options.jobCodes;

            if(results.length > 0) {
                var jobId;
                for(var i=0; i<jobCodes.length; i++) {
                    for(var j=0; j<results.length; j++) {
                        if(results[j].value.toUpperCase() === jobCodes[i].toUpperCase()) {
                            jobId = results[j].id;
                            break;
                        }
                    }
                }
                if(!jobId){
                    _logger.warn('unable to find matching job in results');
                    _eventHandler.sendEvent(_events.HANDLE_RESPONSE, options.callback);
                    return;
                }

                _bucket.getAndLock(jobId, {lockTime: 30}, function(err, result){
                    if(err){
                        _eventHandler.sendEvent(_events.HANDLE_RESPONSE, options.callback, err);
                    } else {
                        options.result = result;
                        _eventHandler.sendEvent(_events.LOCK_JOB, options);
                    }
                });
            } else {
                _logger.info('no eligible jobs found');
                _eventHandler.sendEvent(_events.HANDLE_RESPONSE, options.callback);
            }
        });

        _eventHandler.watchEvent(_events.LOCK_JOB, function(options){
            var result = options.result;
            //lock info to be used to unlock the job
            var cas = result.cas;
            var job = result.value;

            var lockInfo = job.locking || {};
            lockInfo.locked = true;
            lockInfo.lockedOn = new Date();

            lockInfo.lockedBy = options.caller;

            job.locking = lockInfo;
            job.lastModified = new Date();

            if (job.schedule.triggerScheduledDate) {
                job.isActive = false;
            }

            _bucket.upsert(job.id, job, {cas: cas}, function(err){
                _bucket.unlock(job.id, cas, function(){
                    for(var i=0; i<job.schedule.future_instances.length; i++){
                        var date = new Date(job.schedule.future_instances[i]);

                        if(date.getTime() >= options.baseDate.getTime()){
                            job.triggeringOccurrence = date;
                            break;
                        }
                    }
                    _eventHandler.sendEvent(_events.HANDLE_RESPONSE, options.callback, err, job);
                });
            });
        });

        _eventHandler.watchEvent(_events.UNLOCK_JOB, function(result, caller, afterUnlock){
            var cas = result.cas;
            var job = result.value;

            var lockInfo = job.locking || {};

            lockInfo.locked = false;
            delete lockInfo.lockedOn;
            delete lockInfo.lockedBy;
            lockInfo.unlockedBy = caller;

            job.locking = lockInfo;
            job.lastModified = new Date();

            //re-generate occurrences
            addMetadataToJob(job);

            _bucket.upsert(job.id, job, {cas: cas}, function(err){
                _bucket.unlock(job.id, cas, function(){
                    _eventHandler.sendEvent(_events.HANDLE_RESPONSE, afterUnlock, err, job);
                });
            });
        });

        _eventHandler.watchEvent(_events.HANDLE_RESPONSE, function(afterGet, err, job){
            afterGet(err, job);
        });

        return manager;
    }

    return JobManager;
})();
