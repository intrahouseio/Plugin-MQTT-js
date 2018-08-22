const util = require("util");
// const path = require('path')

const should = require("should");

var pl = require("../lib/plugin");

function return42() {
    throw {message:'Missing protocol'}
}

describe("plugin", () => {
  describe("#connect", () => {
    it("should return an Plugin when is called without new", () => {
      var plugin = pl.Plugin({});
      console.log(util.inspect(plugin));

      plugin.should.be.instanceOf(pl.Plugin);
      plugin.should.have.property('params')
    });

    it("should throw an error ", () => {
        (function () {
            return42();
          }).should.throw('Missing protocol')
    });

  });
});



/*
it('should work', function() {
    return42().should.be.Number();
    return42().should.be.equal(42);
    // return42().should.be.Number.and.equal(42);
  
    return42.should.not.throw();
  });
*/
