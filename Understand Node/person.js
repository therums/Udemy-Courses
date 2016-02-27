// Using Object Literals

var person = {
	firstname: "John",
	lastname: "Doe",
	greet: function() {
		console.log('Hello, ' + this.firstname + ' ' + this.lastname);
	}
};
// standard way using .
person.greet();

// brackets way
console.log(person['firstname']);