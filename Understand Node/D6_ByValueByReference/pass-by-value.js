// pass by value a primitive value (different spot in memory than b)
function change(b) {
	b = 2;
}
var a = 1;
change(a);
console.log(a);

// pass by reference
function changeObj(d) {
	d.prop1 = function () {};
	d.prop2 = {};
}
var c = {};
c.propt2 = {};
changeObj(c);
console.log(c)
// c and d are in the same place of memory 
// pass by reference
// when I pass in an object and add properties and change properties on that object
// that will be reflected outside of the function because it passed by reference