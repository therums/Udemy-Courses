var express = require('express');
var path = require('path')
var bodyParser = require('body-parser');
var app = express();

// to post to json file need body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
//set static path
app.use(express.static(path.join(__dirname, 'public')));

// instead of app.get are using app.use
// app.get('/', function(req, res) {
// 	res.send('Hello World');
// });

// app.get('/about', function(req, res) {
// 	res.sendFile(path.join(__dirname,'about.html'));
// });

// json for return post and delete
app.get('/people', function(req, res) {
	var people = [
		{
			firstName: "Sharon",
			lastName: "Rumsey",
			age: 52,
			gender: "female"
		},
		{
			firstName: "John",
			lastName: "Rumsey",
			age: 61,
			gender: "male"
		},
		{
			firstName: "Evan",
			lastName: "Rumsey",
			age: 14,
			gender: "male"
		}
	];
	res.json(people);
});

//route to download a file pdf
app.get('/download', function(req, res) {
	res.download(path.join(__dirname, '/downloads/pdf.pdf'));
})
//route to redirect
// app.get('/about', function(req, res) {
// 	res.redirect('/about.html')
// })
app.post('/subscribe', function(req, res) {
	// to grab name field from form and email
	var name = req.body.name;
	var email = req.body.email;
	console.log(name + ' has subscribed with ' + email)
})

app.listen(3000, function() {
	console.log('server started on port 3000')
});

