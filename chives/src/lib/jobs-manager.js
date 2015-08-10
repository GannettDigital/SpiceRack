'use strict';
module.exports = (function() {
    var EventEmitter = require('events').EventEmitter;
    var util = require('util');
    var format = require('string-format');
    var request = require('request');

    var JobsManager = function() {
        var self = this;

        self.queryJobs = function(url, callback){
            request(url, function(err, response, body) {
                if(err) {
                    callback(err, null);
                } else if(response.statusCode != 200) {
                    var err = new Error();
                    err.message = 'Unexpected status code ' + response.statusCode;
                    err.statusCode = response.statusCode;
                    callback(err, null);
                } else {
                    callback(null, JSON.parse(body));
                }
            });
        };

        return self;
    };

    util.inherits(JobsManager, EventEmitter);
    return JobsManager;
})();