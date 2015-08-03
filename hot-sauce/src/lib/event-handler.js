'use strict';

module.exports = (function () {
    var events = require('events');

    var EventHandler = function(){
        var self = {};
        var emitter = new events.EventEmitter();

        self.watchEvent = function(eventType, eventHandler){
            emitter.on(eventType, function(){
                var args = arguments;
                eventHandler.apply(this, args);
            })
        };

        self.sendEvent = function(eventType){
            console.log(arguments);
            if(!emitter.emit.apply(emitter, arguments)){
                console.log('uh oh, noone listening to '+arguments[0]);
            };

            //console.log(emitter.emit(arguments[0], arguments));
        };

        return self;
    };
    return EventHandler;
})();