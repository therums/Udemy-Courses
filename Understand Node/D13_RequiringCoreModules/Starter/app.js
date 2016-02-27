// asks if it's a native module
// native is in the JS core
//

var util = require('util');
// has core components such as
// adding a time stamp

var name = 'Sharon';
var greeting = util.format('Hello,', name);
util.log(greeting);
// gives a time stampt with name


