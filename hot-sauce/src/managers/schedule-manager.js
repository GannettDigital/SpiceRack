'use strict';

module.exports = (function () {
    var Logger = require('./../lib/logger.js');
    var parser = require('cron-parser');

    // to protect the application from itself, do not generate more than a few
    // when the current / end dates are too wide with a loose cron
    var MAX_OCCURRENCES = 100;
    // Note for Job Manager
    // at 10 occurrences, the cleanup / maintenance activities must run every 10 or fewer seconds to ensure
    // no gaps in instances
    // future TODO: address the coordination dependency

    function ScheduleManager(config) {
        var self = {};
        var logger = new Logger(config.logger);

        self.generateFutureInstances = function(cron, options) {
            var futureDates = [];
            try {
                var interval = parser.parseExpression(cron, options);
                var i = 0;
                while(interval.hasNext() && i++ < MAX_OCCURRENCES){
                    futureDates.push(interval.next());
                }
            } catch(err) {
                logger.error('Unable to process cron pattern: ' + cron, err);
            } finally {
                return futureDates;
            }
        };
        return self;
    }

    return ScheduleManager;
})();