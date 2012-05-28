var assert = require('assert'),
  cdnfinder = require('../lib/main');

var EXPECTATION = [
  ["netdna.cdnplanet.com", "MaxCDN"],
  ["bg.cdnplanet.com", "Bitgravity"],
]

var testhostnamefinder = function(testcase){
  cdnfinder.hostnamefinder(testcase[0], function(result){
    var failmessage = testcase[0] + " should be " + testcase[1] + " but got " + result
    assert.equal(result, testcase[1], failmessage);
  })  
}

EXPECTATION.forEach(function(testcase){
  testhostnamefinder(testcase);
})
