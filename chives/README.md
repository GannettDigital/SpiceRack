# Chives
[![Build Status](https://travis-ci.org/GannettDigital/SpiceRack.svg?branch=master)](https://travis-ci.org/GannettDigital/SpiceRack)
[![Coverage Status](https://coveralls.io/repos/GannettDigital/SpiceRack/badge.svg?branch=master&service=github)](https://coveralls.io/github/GannettDigital/SpiceRack?branch=master)
[![npm](https://img.shields.io/npm/v/chives.svg)](https://www.npmjs.com/package/chives)

- Backend application module to unlock expired jobs and generate further instances of scheduled jobs

## Installation
```npm install chives```

## Testing
```npm run test```
 
## Code Coverage
Code Coverage provided by Istanbul with hooks for coveralls.  To see coverage report run

```
npm run cover
```

## Usage
```javascript
var Chives = require('chives');
var Logger = require('salt-pepper').Logger;
var os = require('os');

var config = {
    couchbase: {
        cluster: ['http://couchbase.host:8091'],
        bucket: {
            name: 'bucket_name',
            password: 'p@$$w0rd'
        }
    },
    logger: {
        console: {enabled: true, options: {level: 'debug'}},
        file: {enabled: false, options: {level: 'debug', filename: "chives.log"}}
    },
    pollIntervals:{
        generateInstances: 50000,   // use 0 to turn off polling for this job
        unlockJobs: 2000            // use 0 to turn off polling for this job
    }
};

var chives = new Chives(config);

chives.start();

setTimeout(function(){
    chives.stop();
}, 60000);

```
