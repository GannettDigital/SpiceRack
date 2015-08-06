# Ajwain

SDK to add scheduling mechanisms backed by Hot Sauce API 

[![Build Status](https://travis-ci.org/GannettDigital/SpiceRack.svg?branch=master)](https://travis-ci.org/GannettDigital/SpiceRack)
[![Coverage Status](https://coveralls.io/repos/GannettDigital/SpiceRack/badge.svg?branch=master&service=github)](https://coveralls.io/github/GannettDigital/SpiceRack?branch=master)
[![NPM](https://nodei.co/npm/ajwain.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/ajwain/)

## Installation
```npm install ajwain```

## Testing
```npm run test```
 
## Code Coverage
Code Coverage provided by Istanbul with hooks for coveralls.  To see coverage report run

```
npm run cover
```

## Usage
```javascript
var Ajwain = require('ajwain');
var Logger = require('salt-pepper').Logger;
var os = require('os');

var config = {
    hotSauceHost: 'http://localhost:3000',
    apiKey: 'worker-XXXXX',
    pollInterval: 1000,
    logger: {
        console: {enabled: true, options: {level: 'debug'}},
        file: {enabled: false, options: {level: 'debug', filename: "ajwain.log"}}
    }
}

var ajwain = new Ajwain(config);

//capabilities that this worker understands
var codes = ['code1', 'code2'];

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
```