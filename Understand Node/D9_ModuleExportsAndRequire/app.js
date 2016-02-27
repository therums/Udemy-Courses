var greet = require('./greet');
greet();

// require is a function, that you pass a 'path' to
// module.exports is what the require function returns

// this works because your code is actually wrapped
// in a function that is given these things as
// function parameters