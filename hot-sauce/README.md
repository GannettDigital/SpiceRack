# Hot Sauce

Couchbase Backed Job Scheduling Management API 

[![Build Status](https://travis-ci.org/GannettDigital/SpiceRack.svg?branch=master)](https://travis-ci.org/GannettDigital/SpiceRack)
[![Coverage Status](https://coveralls.io/repos/GannettDigital/SpiceRack/badge.svg?branch=master&service=github)](https://coveralls.io/github/GannettDigital/SpiceRack?branch=master)
[![NPM](https://nodei.co/npm/hot-sauce.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/hot-sauce/)   

## Installation
```npm install hot-sauce```

## Testing
```npm run test```
 
## Code Coverage
Code Coverage provided by Istanbul with hooks for coveralls.  To see coverage report run

```
npm run cover
```

## Usage - built-in start/stop methods
This module can be incorporated into an existing application with applicable start/stop commands

```javascript
var HotSauce = require('hot-sauce');

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

## Usage - subapp in existing app
This module can be incorporated into an existing application as a sub-app
```javascript
var HotSauce = require('hot-sauce');

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

## Configuration
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
### Couchbase Configuration
The application requires the existence of 2 views in the bucket

#### GetAllJobs
```javascript
function (doc, meta) {
  emit(meta.id, doc);
}
```

#### GetJobIfAvailable
```javascript
function (doc, meta) {
  if(doc.locking && doc.locking.locked != true){
    if(doc.schedule && doc.schedule.future_instances.length > 0){
    //only find unlocked jobs
      var instances = doc.schedule.future_instances;
      for(var i=0; i<instances.length; i++){
        var key = dateToArray(instances[i]);
	emit(key, doc.code);
      }
    } 
  }
}
```

## Routes
* GET `/jobs` 
Index of all jobs stored in couchbase
** Example Response
```javascript
{
    "id": "52",
    "name": "job",
    "code": "code_52",
    "description": "desc",
    "jobData": {},
    "schedule": {
        "cron": "*/12 52 * * * *",
        "future_instances": [
            "2015-08-03T19:52:00.000Z",
            "2015-08-03T19:52:12.000Z",
            "2015-08-03T19:52:24.000Z",
            "2015-08-03T19:52:36.000Z",
            "2015-08-03T19:52:48.000Z"
        ]
    },
    "locking": {},
    "lastModified": "2015-08-03T19:06:55.502Z"
}
```

* GET `/jobs/:id` 
Detail on specific job

* GET `/jobs/available?codes=code1,code2,code3&caller=someone`
Given input codes, get & lock an available job by `someone`. Margin of error for the query is 5 seconds i.e it is feasible to get a job scheduled to run upto 5 seconds in the future. 

* GET `/jobs/:id/unlock?caller=someone`  
Unlocks a locked job

* POST `/jobs`
Create/Upload a job
** Example POST request
```javascript
{
    "id": "52",
    "name": "job",
    "code": "every52nd",
    "description": "desc",
    "jobData": {},
    "schedule": {
        "cron": "*/12 52 * * * *"
    },
    "locking": {}
}
```

