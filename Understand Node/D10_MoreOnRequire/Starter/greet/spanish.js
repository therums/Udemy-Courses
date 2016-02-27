// manage rules for greeting in spanish
var greetings = require('./greetings.json');

// var greet = function() {
// 	console.log('Hola');
// }

var greet = function() {
	console.log(greetings.en);
}

module.exports = greet;