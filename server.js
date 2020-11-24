let path = require('path');
let express = require('express');
let app = express();
const users = require('./jsons/users').users;
const flowers = require('./jsons/flowers').flowers


// set the view engine to ejs
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/about', function(req, res) {
  res.render('about');
});






app.listen(8071, function(){
	console.log("running express server on 8071")
});



