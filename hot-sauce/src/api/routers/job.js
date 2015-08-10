module.exports = (function() {
    var self = this;
    var JobsController = require('../controllers/job.js');

    self.initialize = function(app, config) {
        var _jobsController = new JobsController(config);

        app.get('/jobs', _jobsController.getAll);
        app.get('/jobs/available', _jobsController.getAvailable);
        app.get('/jobs/:id/unlock', _jobsController.unlock);
        app.get('/jobs/:id', _jobsController.getById);
        app.post('/jobs', _jobsController.upsert);
    };

    return self;
})();