# Salt Pepper

SDK to add scheduling mechanisms backed by Hot Sauce API
Included Modules: 
* Logger
Wrapper around the winston logger to provide more context on the log message such as logging file, line number & pid
 

[![Build Status](https://travis-ci.org/GannettDigital/SpiceRack.svg?branch=master)](https://travis-ci.org/GannettDigital/SpiceRack)
[![Coverage Status](https://coveralls.io/repos/GannettDigital/SpiceRack/badge.svg?branch=master&service=github)](https://coveralls.io/github/GannettDigital/SpiceRack?branch=master)
[![NPM](https://nodei.co/npm/salt-pepper.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/salt-pepper/)

## Installation
```npm install salt-pepper```

## Testing
```npm run test```
 
## Code Coverage
Code Coverage provided by Istanbul with hooks for coveralls.  To see coverage report run

```
npm run cover
```


## Logger
### Usage
```javascript
var Logger = require('salt-pepper').Logger;

var config = {
    console: {enabled: true, options: {level: 'debug'}},
    file: {enabled: false, options: {level: 'debug', filename: "mylog.log"}}
}

var logger = new Logger(config.logger);

logger.debug('debug message');
logger.info('info message');
var err = new Error('i did something bad');
logger.warn('warn message', err);   //will log will stack trace
logger.error('error message', err); //will log will stack trace
logger.fatal('error message', err); //will log will stack trace
});

```

All methods also support an optional transactionId parameter so that logical grouping of log messages can be applied. 
e.g. 
```javascript
var transactionId = 'someUniqueId';

//do something
log.debug('i did something', null, transactionId);

//somethig bad happened
log.error('i\'m going to fix error, err, transactionId);

//cleanup
log.info('i cleaned up', null, transactionId);

```