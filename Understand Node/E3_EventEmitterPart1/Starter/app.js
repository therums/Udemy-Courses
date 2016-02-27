// Node event emitter part 1

var Emitter = require('./emitter');

var emtr = new Emitter();

// two listeners below
// greet is a property name on an object
emtr.on('greet', function() {
	console.log('Someone said hello ');
});

//function sitting inside an array
emtr.on('greet', function() {
	console.log('A greeting occurred!');
});
console.log('Hello!');
// manually gave the emit
// the 2 functions will run as 
// result of emitting the event
emtr.emit('greet');