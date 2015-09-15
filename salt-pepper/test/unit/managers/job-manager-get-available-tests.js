describe('job-manager: getAvailableJob tests', function() {

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

    it('should emit QUERY_AVAILABLE_JOBS event to findAvailableJob', function(done) {
        var mockConfig = {
            couchbase: {
                cluster: [],
                bucket: {
                    name: 'name',
                    password: '123'
                }
            }
        };
        var expectedJobCodes = ['one', 'two'];
        var afterGet = function(){};

        var mockCouchbase = {
            ViewQuery: {
                from: function(bucket, view) {
                }
            },
            Cluster: function() {
                var self = {};

                self.openBucket = function() {
                    return {
                        on: function() {
                        }
                    };
                };

                return self;
            }
        };

        var mockHandler = function(){
                var self = {};

                self.sendEvent = function(event, jobCodes, afterGetCallback){
                    expect(event).to.eql('query-available-jobs');
                    expect(jobCodes).to.eql(jobCodes);
                    expect(afterGetCallback).to.be.a('function').and.eql(afterGet);
                    done();
                };

                self.watchEvent = function(event, handler){ };

                return self;
        };

        var mockLogger = function(){
            return {

            }
        };

        mockery.registerMock('couchbase', mockCouchbase);
        mockery.registerMock('./event-handler.js', mockHandler);
        mockery.registerMock('./logger.js', mockLogger);

        var JobManager = require('../../../../salt-pepper/src/job-manager.js');
        var manager = new JobManager(mockConfig);

        manager.findAvailableJob(expectedJobCodes, afterGet);
    });

    after(function() {
        mockery.disable();
    });
});