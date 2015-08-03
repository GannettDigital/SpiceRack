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
            emitter.emit.apply(this, arguments);
        };

        return self;
    };
    return EventHandler;
})();