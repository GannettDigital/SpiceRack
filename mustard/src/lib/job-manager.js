'use strict';

module.exports = (function () {
    var couchbase = require('couchbase');
    var ViewQuery = couchbase.ViewQuery;

    function JobManager(config) {
        var manager = {};
        var couchbaseCluster = new couchbase.Cluster(config.couchbase.cluster);

        var bucket = couchbaseCluster.openBucket(config.couchbase.bucket.name, config.couchbase.bucket.password);
        bucket.on('error', function(err) {
            console.log('uh oh, bucket error' + JSON.stringify(err));
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
                afterSave(err, getJob(job.id));
            });
        };

        function addMetadataToJob(job){
            job.locking = {};
            job.schedule = {};
            job.lastModified = new Date();
            return job;
        }

        return manager;
    }

    return JobManager;
})();