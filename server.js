let path = require("path");
let express = require("express");
const { BADFLAGS } = require("dns");
const app = express();
const users = require("./jsons/users").users;
const flowers = require("./jsons/flowers").flowers;
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());


var password_attempts = 0;


var current_user;

// set the view engine to ejs
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
    res.render("index");
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.get("/flowers", function(req, res) {
    res.render("partials/flowerList", { flowers: flowers });
});
app.post("/authenticate", function(req, res) {
    let body = req.body;
    if (!validate_email(body.email)) {
        res.json({ success: false, message: "Email is invalid" });
        return;
    }
    let user = users.filter((u) => u.email == body.email);
    if (user.length == 0)
        res.json({ success: false, message: "There is no user with that Email Address" });
    if (user.length > 1) {
        console.error("There are too many users with that Email Address");
        res.json({ success: false, message: "Server Error!" });
        return;
    }
    user = user[0];
    if (user.password == body.password) {
        set_cookies(res, user);
        res.json({ success: true, user: user });
        current_user = user;
    } else {
        res.json({ success: false, message: "Wrong Password" });
        password_attempts++;
    }
});

app.get("/logout", (req, res) => {
    current_user = null;
    set_cookies(res, { fname: '', lname: '', email: '' });
    res.json({ success: true });
});

app.listen(8071, function() {
    console.log("running express server on 8071");
});

function set_cookies(res, user) {
    res.cookie("fname", user.fname);
    res.cookie("lname", user.lname);
    res.cookie("email", user.email);
}

function validate_email(email) {
    const re = /[\w.]{1,20}@\w{1,20}(\.\w{2,3}){1,2}/g;
    return re.test(email);
}