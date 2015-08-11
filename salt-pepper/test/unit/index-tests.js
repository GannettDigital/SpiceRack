describe('index: init tests', function() {
    var assert = require('assert');
    var expect = require('chai').expect;

    it('should set Logger property in exports on require index.js', function() {
        var app = require('../../index.js');

        expect(app.Logger).to.not.be.null;
    });

    it('should set JobManager property in exports on require index.js', function() {
        var app = require('../../index.js');

        expect(app.JobManager).to.not.be.null;
    });

    it('should set EventHandler property in exports on require index.js', function() {
        var app = require('../../index.js');

        expect(app.EventHandler).to.not.be.null;
    });

    it('should set ScheduleManager property in exports on require index.js', function() {
        var app = require('../../index.js');

        expect(app.ScheduleManager ).to.not.be.null;
    });

});