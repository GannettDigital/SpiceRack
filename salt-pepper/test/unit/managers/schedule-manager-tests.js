describe('schedule-manager: get instances tests', function(){

    var mockery = require('mockery');
    var expect = require('chai').expect;

    before(function() {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
    });

    beforeEach(function() {
        mockery.resetCache();
    });

    afterEach(function() {
        mockery.deregisterAll();
    });

    it('should generate 3 occurrences for the daily cron pattern with a max date of 3 days from now', function(){
        var mockLogger = function() {
            return {
            }
        };

        mockery.registerMock('./logger.js', mockLogger);

        var ScheduleManager = require('../../../src/schedule-manager.js');
        var manager = new ScheduleManager({logger:{}});

        //daily at midnight
        //alt syntax: @daily
        var pattern = '0 0 * * *';
        var base = new Date();
        base.setHours(0);
        base.setMinutes(0);
        base.setSeconds(0);

        var first = new Date(base);
        first.setDate(base.getDate() + 1);

        var second = new Date(base);
        second.setDate(base.getDate() + 2);

        var third = new Date(base);
        third.setDate(base.getDate() + 3);

        var now = new Date();
        var endDate = new Date(now);
        endDate.setDate(now.getDate()+3);
        var options = {
            currentDate: now,
            endDate: endDate
        };
        var results = manager.generateFutureInstances(pattern, options);

        expect(results).to.have.length(3);
        expect(results[0].toString()).to.eql(first.toString());
        expect(results[1].toString()).to.eql(second.toString());
        expect(results[2].toString()).to.eql(third.toString());
    });

    it('should NOT return more than 5 occurrences even when the schedule & criteria permit it', function(){
        var mockLogger = function() {
            return {
            }
        };

        mockery.registerMock('./logger.js', mockLogger);
        var ScheduleManager = require('../../../src/schedule-manager.js');
        var manager = new ScheduleManager({logger:{}});

        //without any bounds, the endDate is infinite
        var results = manager.generateFutureInstances('@hourly');

        expect(results).to.have.length(5);
    });

    it('should log error when the underlying cron-parser library throws an error', function(done){
        var mockLogger = function() {
            return {
                error: function(message, err) {
                    expect(message).to.eql('Unable to process cron pattern: @hourly');
                    expect(err).to.not.be.null;
                    done();
                }
            }
        };

        var mockParser = {
            parseExpression: function(){ throw new Error('oops');}
        };

        mockery.registerMock('./logger.js', mockLogger);
        mockery.registerMock('cron-parser', mockParser);

        var ScheduleManager = require('../../../src/schedule-manager.js');
        var manager = new ScheduleManager({logger:{}});

        manager.generateFutureInstances('@hourly');
    });

    it('should return an empty array when an error is encountered', function(){
        var mockLogger = function() {
            return {
                error: function(message, err){
                }
            }
        };

        var mockParser = {
            parseExpression: function(){ throw new Error('oops');}
        };

        mockery.registerMock('./logger.js', mockLogger);
        mockery.registerMock('cron-parser', mockParser);

        var ScheduleManager = require('../../../src/schedule-manager.js');
        var manager = new ScheduleManager({logger:{}});

        var results = manager.generateFutureInstances('@hourly');
        expect(results).to.have.length(0);
    });

    it('should return an empty array no instances are generated', function(){
        var mockLogger = function() {
            return {
                error: function(message, err){
                }
            }
        };

        mockery.registerMock('./logger.js', mockLogger);

        var ScheduleManager = require('../../../src/schedule-manager.js');
        var manager = new ScheduleManager({logger:{}});

        var now = new Date();
        var endDate = new Date();
        endDate.setHours(now.getHours()+1);

        var options = {
            currentDate: now,
            endDate: endDate
        };

        //it is not possible to have an occurrence between now & now+1 hour at midnight
        var results = manager.generateFutureInstances('@daily', options);
        expect(results).to.have.length(0);
    });


    after(function() {
        mockery.disable();
    });
});
