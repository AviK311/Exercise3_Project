

let path = require("path");
//express server
const users = require('./jsons/users').users;

let express = require("express");
const { throws } = require("assert");
let app = express();
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname, 'views')));

class User{
    constructor(email, password){
        this.email = email;
        this.password = password;
    }
}

app.get('/', function(req, res){
    res.render("index", {Students: Students});

});

app.listen(8071, function(){
	console.log("running express server on 8071")
});



