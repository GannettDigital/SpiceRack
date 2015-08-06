'use strict';

module.exports = function(config) {
    var winston = require('winston');
    var format = require('string-format');
    var dateFormat = require('dateformat');
    var stack = require('callsite');
    var _config = config || {};

    var EventEmitter = require('events').EventEmitter;

    var emitter = new EventEmitter();

    //For formatting info, see http://blog.stevenlevithan.com/archives/date-time-format
    var dateTimeFormat = "dd mmm HH:MM:ss,l";

    //0 - DateTime
    //1 - ThreadId/Pid
    //2 - TransactionId
    //3 - Class/Module
    //4 - message
    var logMessageFormat = "{0} [{1}] {2}, {3}[{5}] - {4}";

    var events = {
        LOG_EVENT_RAISED_EVENT: 'log-event-raised'
    };

    if(!_config.console) {
        _config.console = {enabled: true};
    }

    if(!_config.file) {
        _config.file = {enabled: false};
    }

    var transports = [];

    if(_config.console.enabled) {
        transports.push(new (winston.transports.Console)(_config.console.options));
    }

    if(_config.file.enabled) {
        transports.push(new (winston.transports.File)(_config.file.options));
    }

    var logger = new (winston.Logger)({transports: transports});

    emitter.on(events.LOG_EVENT_RAISED_EVENT, function(level, message, transactionId, stack, args) {
        var messageToLog = message;

        if(args && args.stack) {
            messageToLog = message + ', ' + args.stack;
        }

        var transactionIdLog = '';
        if(transactionId) {
            transactionIdLog = format('transactionId = {0}', transactionId);
        }

        var now = new Date();
        //TODO: if clustering is implemented, process.pid should be replaced with worker.id or the equivalent thread id
        var stackDepth = 1;
        var formattedMessage = format(logMessageFormat, dateFormat(now, dateTimeFormat), process.pid, transactionIdLog, stack[stackDepth].getFileName(), messageToLog, stack[stackDepth].getLineNumber());

        if(args) {
            logger.log(level.toLowerCase(), formattedMessage, args);
        }
        else {
            logger.log(level.toLowerCase(), formattedMessage);
        }
    });

    this.events = events;
    this.eventEmitter = emitter;

    function log(level, message, stack, args, transactionId) {
        emitter.emit(events.LOG_EVENT_RAISED_EVENT, level, message, transactionId, stack, args);
    }

    this.info = function(message, args, transactionId) {
        log('info', message, stack(), args, transactionId);
    };

    this.warn = function(message, args, transactionId) {
        log('warn', message, stack(), args, transactionId);
    };

    this.debug = function(message, args, transactionId) {
        log('debug', message, stack(), args, transactionId);
    };

    this.error = function(message, args, transactionId) {
        log('error', message, stack(), args, transactionId);
    };

    this.fatal = function(message, args, transactionId) {
        log('fatal', message, stack(), args, transactionId);
    };

    return this;
};