module.exports.Cluster = function() {
    var util = require('util');
    var EventEmitter = require('events').EventEmitter;


    var self = this;

    var Bucket = function() {

        var self = this;

        self.get = function(){};

        //emit an error after a delay to allow handlers to register
        setTimeout(function(){
            self.emit('error', new Error());
        }, 100);
    };

    self.openBucket = function() {
        return new Bucket();
    };

    util.inherits(Bucket, EventEmitter);

    return self;
};

