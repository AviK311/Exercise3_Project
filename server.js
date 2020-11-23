

let path = require("path");
//express server
let express = require("express");
const { throws } = require("assert");
let app = express();
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname, 'views')));

class Student{
    constructor(fname, lname, age, avg){
        this.fname = fname;
        this.lname = lname;
        this.age = age;
        this.avg = avg;
    }
}

let Students =[ new Student("Avi", "Koenigsberg", 27, 76),
                new Student("Yosef","Kalfa",29,98),
                new Student("Sapir","Koenigsberg",27,90)]; 

app.get('/', function(req, res){
    res.render("index", {Students: Students});

});



app.listen(8071, function(){
	console.log("running express server on 8071")
});



