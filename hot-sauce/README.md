# Hot Sauce

Couchbase Backed Job Scheduling Management API 

[![Build Status](https://travis-ci.org/GannettDigital/SpiceRack.svg?branch=master)](https://travis-ci.org/GannettDigital/SpiceRack)
[![Coverage Status](https://coveralls.io/repos/GannettDigital/SpiceRack/badge.svg?branch=master&service=github)](https://coveralls.io/github/GannettDigital/SpiceRack?branch=master)

Installation
------------
```npm install hot-sauce```

Testing
-------------
```npm run test```
 
Code Coverage
-------------

Code Coverage provided by Istanbul with hooks for coveralls.  To see coverage report run

```
npm run cover
```

Usage
-------------

This module is designed to be incorporated into an existing application with applicable start/stop commands

```javascript
var HotSauce = require('./hot-sauce/index.js');

var config = {
    port: 3000,
    couchbase: {
        cluster: ['http://couchbase.host:8091'],
        bucket: {
            name: 'bucket_name',
            password: 'p@$$w0rd'
        }
    }
};

var hotSauce = new HotSauce(config);

hotSauce.start();
```