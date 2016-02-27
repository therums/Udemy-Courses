// manage rules for greeting in english
var greetings = require('./greetings.json');

// var greet = function() {
// 	console.log('Hello');
// }


var greet = function() {
	console.log(greetings.en);
}

module.exports = greet;