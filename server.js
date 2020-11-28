let path = require("path");
let express = require("express");
const { BADFLAGS } = require("dns");
let app = express();
const users = require("./jsons/users").users;
const flowers = require("./jsons/flowers").flowers;

var password_attempts = 0;

// set the view engine to ejs
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
    res.render("index");
});

app.get("/about", function(req, res) {
    res.render("about");
});
app.get("/authenticate", function(req, res) {
    let query = req.query;
    if (!validate_email(query.email)) {
        res.json({ error: "Email is invalid" });
        return;
    }
    let user = users.filter((u) => u.email == query.email);
    console.log(user);
    if (user.length == 0)
        res.json({ error: "There is no user with that Email Address" });
    if (user.length > 1) {
        console.error("There are too many users with that Email Address");
        res.json({ error: "Server Error!" });
        return;
    }
    user = user[0];
    if (user.password == query.password) {
        set_cookies(res, user);
        res.json(user);
    } else {
        res.json({ error: "Wrong Password" });
        password_attempts++;
    }
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