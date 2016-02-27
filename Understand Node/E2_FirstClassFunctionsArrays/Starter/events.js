//Event Emitters

//object properties and methods
var obj = {
	greet: 'Hello'
}
console.log(obj.greet);
console.log(obj['greet']);

var str = 'greet';
console.log(obj[str])

// functions and arrays
var arr = [];
// arr.push('hello');

// or a function inside an array
// and with 3 we have 3 items in an array
arr.push(function() {
	console.log('Hello World 1');
});
arr.push(function() {
	console.log('Hello World 2');
});
arr.push(function() {
	console.log('Hello World 3');
});
// now to invoke the function
arr.forEach(function(item) {
	item();
});