module.exports = (function() {
    var self = this;

    self.initialize = function(app, config) {
        var JobsController = require('../controllers/job.js');

        var jobsController = new JobsController(config);

        app.get('/jobs', jobsController.getAll);
        app.get('/jobs/available', jobsController.getAvailable);
        app.get('/jobs/:id', jobsController.getById);
        app.post('/jobs', jobsController.upsert);
    };

    return self;
})();