// to say an event is happening
// to respond to an event that is happening

function Emitter() {
	this.events = {};

}
// method is on
// add a property that is an array
Emitter.prototype.on = function(type, listener) {
	this.events[type] = this.events[type] || [];
	this.events[type].push(listener);
}
// everytime I push a function I get a new item in the array

// now to say something happened with emit
Emitter.prototype.emit = function(type) {
	if (this.events[type]) {
		  this.events[type].forEach(function(listener) {
		  	listener();
	  });
	}
}

//now to make this available
module.exports = Emitter;