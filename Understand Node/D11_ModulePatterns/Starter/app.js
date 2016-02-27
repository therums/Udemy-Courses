var greet = require('./greet1');
greet();

//  when you see the .greet you are reaching
// into that modules.export object and getting
// that property or method
var greet2 = require('./greet2').greet;
greet2();

var greet3 = require('./greet3');
greet3.greet();

var Greet4 = require('./greet4');
var grtr = new Greet4();
grtr.greet();

var greet5 = require('./greet5').greet;
greet5();

//architectual choice on which one you use

