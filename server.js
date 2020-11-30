let path = require("path");
let express = require("express");
const { BADFLAGS } = require("dns");
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

const users = require("./jsons/users").users;
const flowers = require("./jsons/flowers").flowers;
const branches = require("./jsons/branches").branches;


var password_attempts = 0;


var currentUser = null;

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
app.get("/branches", function(req, res) {
    console.log(currentUser);
    if (!isAuthorized(currentUser)) {
        res.send("You are unauthorized to view this content")
        return;
    }
    res.render("partials/branchList", { branches: branches });
});
app.get("/users", function(req, res) {
    console.log(currentUser);
    if (!isAuthorized(currentUser)) {
        res.send("You are unauthorized to view this content")
        return;
    }
    res.render("partials/userList", { users: users });
});
app.post("/authenticate", function(req, res) {
    let body = req.body;
    if (!validateEmail(body.email)) {
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
        setCookies(res, user);
        let jsonToSend = {
            success: true,
            user: user,
            authority: isAuthorized(user)
        }
        res.json(jsonToSend);
        currentUser = user;

    } else {
        res.json({ success: false, message: "Wrong Password" });
        password_attempts++;
    }
});

app.get("/logout", (req, res) => {
    currentUser = null;
    setCookies(res, { fname: '', lname: '', email: '' });
    res.json({ success: true });
});
app.get("/userType", (req, res) => {
    res.json({ authorized: isAuthorized(currentUser) });
});

app.listen(8071, function() {
    console.log("running express server on 8071");
});

function setCookies(res, user) {
    res.cookie("fname", user.fname);
    res.cookie("lname", user.lname);
    res.cookie("email", user.email);
    res.cookie("userType", user.userType);
}

function validateEmail(email) {
    const re = /[\w.]{1,20}@\w{1,20}(\.\w{2,3}){1,2}/g;
    return re.test(email);
}

function isAuthorized(user) {
    if (user == null) return false;
    if (user.userType == "Developer" || user.userType == "manager") return true;
    return false;
}