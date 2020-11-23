

let path = require("path");
//express server
const users = require('./jsons/users').users;
const flowers = require('./jsons/flowers').flowers
let express = require("express");
let app = express();
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname, 'views')));



app.get('/', function(req, res){
    res.render("index");

});





app.listen(8071, function(){
	console.log("running express server on 8071")
});



