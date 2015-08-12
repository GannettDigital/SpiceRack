describe('ajwain: index tests', function() {
    var expect = require('chai').expect;

    it('should return the ajwain function on requiring index.js', function(){
        var Ajwain = require('../../index.js');

        expect(Ajwain).to.be.a('function');
    });
});