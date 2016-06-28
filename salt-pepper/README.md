# Salt Pepper

Common utilities used by the various SpiceRack modules

Included Modules: 
* Logger
Wrapper around the winston logger to provide more context on the log message such as logging file, line number & pid
 

[![Build Status](https://travis-ci.org/GannettDigital/SpiceRack.svg?branch=master)](https://travis-ci.org/GannettDigital/SpiceRack)
[![Coverage Status](https://coveralls.io/repos/GannettDigital/SpiceRack/badge.svg?branch=master&service=github)](https://coveralls.io/github/GannettDigital/SpiceRack?branch=master)
[![npm](https://img.shields.io/npm/v/salt-pepper.svg)](https://www.npmjs.com/package/salt-pepper)

## Installation
```npm install salt-pepper```

## Testing
```npm run test```
 
## Code Coverage
Code Coverage provided by Istanbul with hooks for coveralls.  To see coverage report run

```
npm run cover
```

## JobManager

### Job definition and storage
```
var job = {
    id: '1',
    name: 'Hourly Cleanup Task',
    isActive: true,
    code: 'Cleanup1',
    description: 'Cleans up directory content every hour',
    jobData: {directories:['/var/log/node']},
    schedule: {
        expirationThreshold: 10000,
        triggerScheduledDate: null,
        cron: '0 0 * * * *'
    },
    locking: {}
};

var JobManager = require('salt-pepper').JobManager;
var jobManager = new JobManager(config.spicerack);
jobManager.save(state.job, function(err, savedJob) {
    if (err) {
        console.log('job save failed: ' + err.message);
    } else {
        console.log('job saved');
    }
});
```

### Schedule
The schedule of the job can be defined by either cron or triggerScheduledDate. 
If the schedule is set by triggerScheduledDate, it will execute only one time, and will automatically deactivate.
If the schedule is set by cron, it will execute on a regular basis based on the data value set cron specification.
The cron format is:
- seconds (0-59)
- minutes (0-59)
- hours (0-23)
- day of month (1-31)
- month (0-11) note: adjust accordingly for base-0 month
- day of week (0-7) note: both 0 and 7 are sunday

## Configuration
The salt-pepper modules expect a config object to be provided.

### JobManager

```javascript
var config = {
    couchbase: {
        cluster: ['your-cb-dns.development.gannettdigital.com:8091'],
        bucket: {name: 'schedule', password: 'your-password-value'}
    },
    logger: {
        console: {enabled: true, options: {level: 'trace', handleExceptions: true}},
        file: {enabled: true, options: {level: 'error', handleExceptions: true, filename: '/var/log/node/my-app.log'}}
    },
    query: {
        range: {
            startOffset: 0,
            endOffset: 5
        },
        limit: 100
    }
}

var JobManager = require('salt-pepper').JobManager;
var jobManager = new JobManager(config);

```

Some not-so-obvious configuration details:
query: if config.query does not evaluate truthy, it will default to setting a range with a 5 second window and a limit of 100. this behavior was implemented for backward compatibility.
query.range: if config.query.range is truthy, it will apply a range to the query
query.range.startOffset: [default 0] number of seconds by which now() should be adjusted for the start key of the GetJobIfAvailable view.
query.range.endOffset: [default 5] number of seconds by which now() should be adjusted for the end key of the GetJobIfAvailable view.
query.range.query.limit: if a value is set, a ViewQuery.limit will be added to the query with the value specified.

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