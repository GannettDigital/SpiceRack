'use strict';

module.exports = (function () {
    var events = require('events');
    var Logger = require('./logger.js');

    var EventHandler = function(config){
        var self = {};
        var logger = new Logger(config.logger);
        var emitter = new events.EventEmitter();

        self.watchEvent = function(eventType, eventHandler){
            emitter.on(eventType, function(){
                var args = arguments;
                eventHandler.apply(this, args);
            })
        };

        self.sendEvent = function(eventType){

            if(emitter.listeners(eventType).length == 0){
                logger.warn('No handler registered for: ' + eventType);
            } else {
                emitter.emit.apply(emitter, arguments)
            }
        };

        return self;
    };
    return EventHandler;
})();