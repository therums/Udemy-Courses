/* Function Constructures A normal function that is 
				used to construct objects
								(new is the keyword)
		The 'this' variable points a new empty object, 
		and that object is returned from the function 
		automatically.*/

function person(firstName, lastName) {
	this.firstName = firstName;
	this.lastName = lastName;
}
var john = new person('John', 'Doe');
// console.log(john.firstName )
//using the new keyword

// Prototype

person.prototype.greet = function() {
	console.log('Hello ' + this.firstName + ' ' + this.lastName);
}
john.greet();
// IMPORTANT === the prototype of any object created from person
// such as firstName and lastName

// so can create another person and use the greet method
// because the same prototype objects
var jane = new person('Jane', 'Doe');
jane.greet();

// js has this to view the function
console.log(john.__proto__);
console.log(jane.__proto__);
// can check to see if they are the same
console.log(john.__proto__ === jane.__proto__);
