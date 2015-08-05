var Ajwain = require('./ajwain/index.js');
var Logger = require('./hot-sauce/index.js').Logger;
var os = require('os');

var config = {
    hotSauceHost: 'http://localhost:3000',
    apiKey: 'ajwain-test',
    pollInterval: 1000,
    logger: {
        console: {enabled: true, options: {level: 'debug'}},
        file: {enabled: false, options: {level: 'debug', filename: "ajwain.log"}}
    }
}

var ajwain = new Ajwain(config);

var codes = [];
for(var i=0; i<60; i++){
    codes.push('code_' + i);
    codes.push('code2_' + i);
}

var options = {
    jobCodes: codes,
    caller: os.hostname()
};

var logger = new Logger(config.logger);

ajwain.registerJobHandler(options, function(job){
    logger.debug('found a job ' + JSON.stringify(job));

    var sleepTime = Math.random() * (1000) + 15000;
    logger.debug('sleeping for a '+sleepTime +'seconds');

    setTimeout(function(){
        logger.debug('completing job');
        ajwain.completeJob(job, options);
    }, sleepTime);

});