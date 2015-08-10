var Ajwain = require('./ajwain/index.js');
var Logger = require('./salt-pepper/index.js').Logger;
var os = require('os');

var config = {
    pollInterval: 1000, //time to poll in ms
    couchbase: {
        cluster: ['http://10.84.111.194:8091'],
        bucket: {
            name: 'jobs',
            password: 'password'
        }
    },
    logger: {
        console: {enabled: true, options: {level: 'debug'}},
        file: {enabled: false, options: {level: 'debug', filename: "ajwain.log"}}
    }
}

var ajwain = new Ajwain(config);

//capabilities that this worker understands
var codes = [];
for(var i=0; i<59; i++){
    codes.push('code_'+i);
    codes.push('code2_'+i);
}


var options = {
    jobCodes: codes,
    caller: os.hostname()
};

var logger = new Logger(config.logger);

ajwain.registerErrorHandler(function(err){
        logger.error('i met an error', err);
    }
);

ajwain.registerJobHandler(options, function(job) {
    logger.debug('found a job ' + JSON.stringify(job));

    var sleepTime = Math.random() * (1000) + 15000;
    logger.debug('sleeping for a ' + sleepTime + 'seconds');

    setTimeout(function() {
        logger.debug('completing job');
        ajwain.completeJob(job, options);
    }, sleepTime);

});