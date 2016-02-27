var express = require('express');
var path = require('path')

var app = express();

//set static path
app.use(express.static(path.join(__dirname, 'public')));

// instead of app.get are using app.use
// app.get('/', function(req, res) {
// 	res.send('Hello World');
// });

// app.get('/about', function(req, res) {
// 	res.sendFile(path.join(__dirname,'about.html'));
// });

app.listen(3000, function() {
	console.log('server started on port 3000')
});