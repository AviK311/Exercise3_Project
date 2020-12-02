let path = require("path");
let express = require("express");
var fs = require('fs');
const { BADFLAGS } = require("dns");
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

var users = require("./jsons/users");
const flowers = require("./jsons/flowers");
var branches = require("./jsons/branches");

var password_attempts = 0;


var currentUser = null;

// set the view engine to ejs
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
    res.render("index");
});
app.get("/home", function(req, res) {
    res.render("partials/home");
});

app.delete("/deleteUser", function(req, res) {
    console.log(currentUser);
    if (!isAuthorizedBranches(currentUser)) {
        res.json({ success: false, message: "You are unauthorized" });
        return;
    }
    users = users.filter(u => u.email != req.body.email);
    fs.writeFile('./jsons/users.json', JSON.stringify(users, null, 4), function(err) {
        console.log(err);
    });
    res.json({ success: true, message: "User was deleted" });


});

app.get("/about", function(req, res) {
    res.render("partials/about");
});
app.get("/contact", function(req, res) {
    res.render("partials/contact");
});
app.get("/careers", function(req, res) {
    res.send("ABSOLUTELY NONE");
});

app.get("/flowers", function(req, res) {
    res.render("partials/flowerList", { flowers: flowers });
});
app.get("/branches", function(req, res) {
    console.log(currentUser);
    if (!isAuthorizedBranches(currentUser)) {
        res.send("You are unauthorized to view this content")
        return;
    }
    res.render("partials/branchList", { branches: branches });
});
app.get("/users", function(req, res) {
    console.log(currentUser);
    if (!isAuthorizedUsers(currentUser)) {
        res.send("You are unauthorized to view this content")
        return;
    }
    res.render("partials/userList", { users: users, withPassword: currentUser.userType != "employee" });
});

app.post("/createCustomer", function(req, res) {
    let body = req.body;
    console.log(body);
    if (!validateEmail(body.email)) {
        res.json({ success: false, message: "Email is invalid" });
        return;

    }
    if (users.some(u => u.email == body.email)) {
        res.json({ success: false, message: "A user with that email exists" });
        return;
    }
    newUser = {
        fname: body.fname,
        lname: body.lname,
        email: body.email,
        userType: "customer",
        "password": body.password,
        "Branch": null,
        ID: users.reduce((prev, current) => (prev.ID > current.ID) ? prev : current).ID + 1
    };
    users.push(newUser);
    fs.writeFile('./jsons/users.json', JSON.stringify(users, null, 4), function(err) {
        console.log(err);
    });
    res.json({ success: true, message: "User was created" });



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
            authorityBranch: isAuthorizedBranches(user),
            authorityUsers: isAuthorizedUsers(user)
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
    console.log(currentUser);
    res.json({ branch: isAuthorizedBranches(currentUser), user: isAuthorizedUsers(currentUser) });
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

function isAuthorizedUsers(user) {
    if (user == null) return false;
    if (user.userType == "Developer" ||
        user.userType == "manager" ||
        user.userType == "employee") return true;
    return false;
}

function isAuthorizedBranches(user) {
    if (user == null) return false;
    if (user.userType == "Developer" || user.userType == "manager") return true;
    return false;
}