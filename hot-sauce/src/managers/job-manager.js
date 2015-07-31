'use strict';

module.exports = (function () {
    var Logger = require('../lib/logger.js');
    var couchbase = require('couchbase');
    var ScheduleManager = require('./schedule-manager.js');
    var format = require('string-format');
    var dateFormat = require('dateformat');
    var ViewQuery = couchbase.ViewQuery;
    //control how far out to generate occurrences.
    //TODO: this will be a problem for annual tasks
    var MAX_MONTHS = 3;

    function JobManager(config) {
        var logger = new Logger(config.logger);
        var manager = {};
        var couchbaseCluster = new couchbase.Cluster(config.couchbase.cluster);
        var scheduleManager = new ScheduleManager(config);

        var bucket = couchbaseCluster.openBucket(config.couchbase.bucket.name, config.couchbase.bucket.password);
        bucket.on('error', function(err) {
            logger.error('Bucket Error: ', err);
        });

        manager.getAllJobs = function(afterGet) {
            //todo: limit, skip
            var query = ViewQuery.from('jobs', 'GetAllJobs');
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

        manager.getAvailableJob = function(jobCode, afterGet) {
            //TODO: add date & code for startkey
            var now = new Date();
            var startKey = [jobCode, now.getFullYear(), now.getMonth, now.getDate()];
            var endKey = [jobCode, now.getFullYear(), now.getMonth, now.getDate()+1];
            var query = ViewQuery.from('jobs', 'GetJobIfAvailable').range(startKey, endKey).limit(10);
            bucket.query(query, function(err, results) {
                if(!err) {
                    if(results.length > 0) {
                        //only expecting 1
                        //TODO: loop to find first one that can be locked with cas
                        // concurrent requests may get same list & 1 will lock first
                        var jobId = results[0].id;
                        logger.info(JSON.stringify(results));
                        bucket.getAndLock(jobId, {lockTime: 30}, function(err, result){
                            logger.info(JSON.stringify(result));
                            //lock info to be used to unlock the job
                            var cas = result.cas;
                            var job = err ? null : result.value;

                            var lockInfo = job.locking || {};
                            lockInfo.locked = true;
                            lockInfo.lockedOn = new Date();

                            lockInfo.lockedBy = 'someone';

                            job.locking = lockInfo;
                            bucket.upsert(job.id, job, {cas: cas}, function(err){
                                bucket.unlock(job.id, cas, function(){
                                    afterGet(err, job);
                                });
                            });
                        });
                    }
                }
            });
        };

        manager.getJob = function(id, afterGet) {
            if(!id) throw new Error('id is required to get a specific job');
            if(!afterGet) throw new Error('afterGet is required');
            if(!(afterGet instanceof Function)) throw new Error('afterGet must be a function');

            bucket.get(id, function(err, result) {
                afterGet(err, result ? result.value : null);
            });
        };

        manager.save = function(job, afterSave){
            var jobToSave = addMetadataToJob(job);
            bucket.upsert(job.id, jobToSave, function(err){
                afterSave(err, err ? null : jobToSave);
            });
        };

        function addMetadataToJob(job){
            job.locking = {};
            job.lastModified = new Date();

            //add instance information
            var base = new Date();
            base.setMilliseconds(0);
            var endDate = new Date(base);
            endDate.setMonth(base.getMonth() + MAX_MONTHS);

            var options = {
                currentDate: base,
                endDate: endDate
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

        return manager;
    }

    return JobManager;
})();
