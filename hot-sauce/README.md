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

Usage - built-in start/stop methods
-------------

This module can be incorporated into an existing application with applicable start/stop commands

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
    },
    logger: {
        console: {enabled: true, options: {level: 'debug'}},
        file: {enabled: false, options: {level: 'debug', filename: "hot-sauce.log"}}
    }
};

var hotSauce = new HotSauce(config);

hotSauce.start();
```

Usage - subapp in existing app
-------------

This module can be incorporated into an existing application as a sub-app
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
    },
    logger: {
        console: {enabled: true, options: {level: 'debug'}},
        file: {enabled: false, options: {level: 'debug', filename: "hot-sauce.log"}}
    }
};

var hotSauce = new HotSauce(config);

var app = express();
//require an apiKey on all routes
app.all('*', function(req, res, next) {
    if(req.query.apiKey) {
        next();
    } else {
        res.status(400).json({error: 'apiKey is required'});
    }
});

//mount the hot sauce app at /api/
app.use('/api', hotSauce.app);

//start server
var server = http.createServer(app);
server.listen(config.port);
```

Configuration
-------------
```
{
    port: 3000, //port for server to listen on
    couchbase: { 
        cluster: ['http://couchbase.host:8091'],  //array of cochbase cluster nodes
        bucket: {
            name: 'bucket_name',  //bucket to use for storage
            password: 'p@$$w0rd'
        }
    },
    logger: { 
        console: {enabled: true, options: {level: 'debug'}},
        file: {enabled: false, options: {level: 'debug', filename: "hot-sauce.log"}}
    }
};
```