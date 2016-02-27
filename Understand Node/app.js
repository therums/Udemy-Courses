// require('./greet.js')
greet()

var a = 1
var b = 2
var c = a + b
console.log(c)

// function statement
function greet() {
    console.log("hi");
}
greet();

// functions are first-class - can be passed around
function logGreeting(fn) {
    fn();
}
logGreeting(greet);

// function expression -- results in a value -- still first class
var greetMe = function() {
    console.log('Hi Sharon');
}
greetMe();

// use function expression on the fly
logGreeting(function() {
    console.log('Sharon is wonderful')
})
