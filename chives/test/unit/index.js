describe('chives: index tests', function() {
    var expect = require('chai').expect;

    it('should return the chives function on requiring index.js', function(){
        var Chives = require('../../index.js');

        expect(Chives).to.be.a('function');
    });
});