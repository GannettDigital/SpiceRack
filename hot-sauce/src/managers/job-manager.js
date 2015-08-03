'use strict';

module.exports = (function () {
    var Logger = require('../lib/logger.js');
    var couchbase = require('couchbase');
    var ScheduleManager = require('./schedule-manager.js');
    var format = require('string-format');
    var ViewQuery = couchbase.ViewQuery;
    var EventHandler = require('../lib/event-handler.js');

    //control how far out to generate occurrences.
    //TODO: this will be a problem for annual tasks
    var MAX_MONTHS = 3;

    function JobManager(config) {
        var logger = new Logger(config.logger);
        var manager = {};
        var couchbaseCluster = new couchbase.Cluster(config.couchbase.cluster);
        var scheduleManager = new ScheduleManager(config);
        var eventHandler = new EventHandler();
        var jobEvents = {
            QUERY_AVAILABLE_JOBS: 'query-available-jobs',
            GET_AND_LOCK: 'get-lock-job',
            LOCK_JOB: 'lock-job',
            HANDLE_RESPONSE: 'handle-response'
        };

        manager.getAllJobs = function(afterGet) {
            //todo: limit, skip
            var query = ViewQuery.from('jobs', 'GetAllJobs');
            var bucket = getOpenedBucket();
            bucket.query(query, function(err, results){
                var rows = null;
                if(!err){
                    rows = results.map(function(row){
                        return row.value;
                    });
                }
                afterGet(err, rows);
            });
        };

        manager.findAvailableJob = function(jobCodes, afterGet) {
            var bucket = getOpenedBucket();
            eventHandler.sendEvent(jobEvents.QUERY_AVAILABLE_JOBS, bucket, jobCodes, afterGet);
        };

        manager.getJob = function(id, afterGet) {
            if(!id) throw new Error('id is required to get a specific job');
            if(!afterGet) throw new Error('afterGet is required');
            if(!(afterGet instanceof Function)) throw new Error('afterGet must be a function');
            var bucket = getOpenedBucket();
            bucket.get(id, function(err, result) {
                afterGet(err, result ? result.value : null);
            });
        };

        manager.save = function(job, afterSave){
            var jobToSave = addMetadataToJob(job);
            var bucket = getOpenedBucket();
            bucket.upsert(job.id, jobToSave, function(err){
                afterSave(err, err ? null : jobToSave);
            });
        };

        var getOpenedBucket = function(){
            var bucket = couchbaseCluster.openBucket(config.couchbase.bucket.name, config.couchbase.bucket.password);
            bucket.on('error', function(err) {
                logger.error('Bucket Error: ', err);
            });

            bucket.on('connect', function() {
                logger.info('Connected to bucket');
            });

            return bucket;
        };

        function addMetadataToJob(job){
            job.locking = {};
            job.lastModified = new Date();

            //add instance information
            var base = new Date();
            base.setMilliseconds(0);

            var options = {
                currentDate: base
            };

            var instances = scheduleManager.generateFutureInstances(job.schedule.cron, options);
            if(instances.length == 0){
                //Should fail loudly or something
                logger.warn(format('{0} generated 0 occurrences.', job.schedule.cron));
            } else {
                job.schedule.future_instances = instances;
            }
            return job;
        }

        eventHandler.watchEvent(jobEvents.QUERY_AVAILABLE_JOBS, function(bucket, jobCodes, afterGet){
            var now = new Date();
            var end = new Date(now);
            end.setUTCSeconds(now.getUTCSeconds() + 5);
            //margin of error is 5s

            //because javascript getMonth() is 0 based, +1 the month
            var startKey = [now.getUTCFullYear(), now.getUTCMonth()+1, now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()];
            var endKey =   [end.getUTCFullYear(), end.getUTCMonth()+1, end.getUTCDate(), end.getUTCHours(), end.getUTCMinutes(), end.getUTCSeconds()];

            var query = ViewQuery
                .from('jobs', 'GetJobIfAvailable')
                .range(startKey, endKey)
                .limit(100)
                .stale(ViewQuery.Update.BEFORE);
            logger.info(format('job view query: {0}', JSON.stringify(query)));
            bucket.query(query, function(err, results) {
                if(!err) {
                    eventHandler.sendEvent(jobEvents.GET_AND_LOCK, results, jobCodes, bucket, afterGet);
                } else {
                    eventHandler.sendEvent(jobEvents.HANDLE_RESPONSE, afterGet, err);
                }
            });
        });

        eventHandler.watchEvent(jobEvents.GET_AND_LOCK, function(results, jobCodes, bucket, afterGet){
            if(results.length > 0) {
                var jobId;
                logger.info(jobCodes);
                for(var i=0; i<jobCodes.length; i++) {
                    for(var j=0; j<results.length; j++) {
                        logger.info(JSON.stringify(results[j]));
                        if(results[j].value.toUpperCase() === jobCodes[i].toUpperCase()) {
                            jobId = results[j].id;
                            break;
                        }
                    }
                }
                if(!jobId){
                    logger.warn('unable to find matching job in results');
                    eventHandler.sendEvent(jobEvents.HANDLE_RESPONSE, afterGet);
                    return;
                }

                bucket.getAndLock(jobId, {lockTime: 30}, function(err, result){
                    if(err){
                        eventHandler.sendEvent(jobEvents.HANDLE_RESPONSE, afterGet, err);
                    }
                    eventHandler.sendEvent(jobEvents.LOCK_JOB, result, bucket, afterGet);
                });
            } else {
                logger.info('no eligible jobs found');
                eventHandler.sendEvent(jobEvents.HANDLE_RESPONSE, afterGet);
            }
        });

        eventHandler.watchEvent(jobEvents.LOCK_JOB, function(result, bucket, afterGet){
            //lock info to be used to unlock the job
            var cas = result.cas;
            var job = result.value;

            var lockInfo = job.locking || {};
            lockInfo.locked = true;
            lockInfo.lockedOn = new Date();

            lockInfo.lockedBy = 'someone';

            job.locking = lockInfo;
            bucket.upsert(job.id, job, {cas: cas}, function(err){
                bucket.unlock(job.id, cas, function(){
                    emitter.emit(jobEvents.HANDLE_RESPONSE, afterGet, err, job);
                });
            });
        });

        eventHandler.watchEvent(jobEvents.HANDLE_RESPONSE, function(afterGet, err, job){
            afterGet(err, job);
        });

        return manager;
    }

    return JobManager;
})();
