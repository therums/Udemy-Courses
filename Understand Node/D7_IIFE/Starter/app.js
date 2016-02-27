// Immediately Invoked Function Expressions (IIFE) iffeys

// modules - protected and reusable
// Scope - where in code you have acces to a particular variable or function

//function () { //anonymous
	// but need an immediate function
//}

// now it's an expression inside ()
//immediately invoked function expression
(function () {
	var firstName = 'John';
	console.log(firstName);
}());

var firstName = 'Jane';  
console.log(firstName);

//can also the function as normal - can pass Doe to the function lastName
(function (lastName) {
	var firstName = 'John';
	console.log(firstName);
	console.log(lastName);
}('Doe'));
