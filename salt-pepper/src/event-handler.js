'use strict';

module.exports = (function () {
    var events = require('events');
    var Logger = require('./logger.js');

    var EventHandler = function(config){
        var self = {};
        var _logger = new Logger(config.logger);
        var _emitter = new events.EventEmitter();

        self.watchEvent = function(eventType, eventHandler){
            _emitter.on(eventType, function(){
                var args = arguments;
                eventHandler.apply(this, args);
            })
        };

        self.sendEvent = function(eventType){
            if(_emitter.listeners(eventType).length == 0){
                _logger.warn('No handler registered for: ' + eventType);
            } else {
                _emitter.emit.apply(_emitter, arguments)
            }
        };

        self.listeners = function(eventType){
            return _emitter.listeners(eventType);
        };
        return self;
    };

    return EventHandler;
})();