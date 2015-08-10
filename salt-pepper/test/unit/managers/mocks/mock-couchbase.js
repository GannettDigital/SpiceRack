module.exports.Cluster = function() {
    var util = require('util');
    var EventEmitter = require('events').EventEmitter;


    var self = this;

    var Bucket = function() {

        var self = this;

        self.get = function(){};

        setTimeout(function(){
            self.emit('connect');
        }, 100);
    };

    self.openBucket = function() {
        return new Bucket();
    };

    util.inherits(Bucket, EventEmitter);

    return self;
};

