let path = require("path");
let express = require("express");
var fs = require('fs');
const { BADFLAGS } = require("dns");
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));

//session
const session = require("express-session");
app.use(session({ secret: "poo" }));
app.use(bodyParser.json());
var users = require("./jsons/users");
const flowers = require("./jsons/flowers");
var branches = require("./jsons/branches");
const { sha256 } = require("js-sha256");




var password_attempts = 0;

const currentSessions = {};
// set the view engine to ejs
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
    res.render("index");
});
app.get("/home", function(req, res) {
    console.log(currentSessions);
    console.log(req.session.hash);
    res.render("partials/home");
});

app.delete("/deleteUser", function(req, res) {
    let currentUser = currentSessions[req.session.hash]
    console.log(currentUser);
    if (getAuthLevel(currentUser) < 2) {
        res.json({ success: false, message: "You are unauthorized to delete users" });
        return;
    }
    users = users.filter(u => u.email != req.body.email);
    fs.writeFile('./jsons/users.json', JSON.stringify(users, null, 4), function(err) {
        console.log(err);
    });
    res.json({ success: true, message: "User was deleted" });


});

app.post("/promoteUser", function(req, res) {
    let currentUser = currentSessions[req.session.hash]
    console.log(currentUser);
    if (getAuthLevel(currentUser) < 2) {
        res.json({ success: false, message: "You are unauthorized to promote employees" });
        return;
    }
    userToPromote = users.findIndex(u => u.email == req.body.email);
    users[userToPromote].userType = "manager";

    fs.writeFile('./jsons/users.json', JSON.stringify(users, null, 4), function(err) {
        console.log(err);
    });
    res.json({ success: true, message: "User was promoted" });


});

app.get("/about", function(req, res) {
    console.log(req.session);
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
    let currentUser = currentSessions[req.session.hash];
    console.log(currentUser);
    if (getAuthLevel(currentUser) < 2) {
        res.send("You are unauthorized to view this content")
        return;
    }
    res.render("partials/branchList", { branches: branches });
});
app.get("/users", function(req, res) {
    let currentUser = currentSessions[req.session.hash];
    console.log(currentUser);
    if (getAuthLevel(currentUser) < 1) {
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
    addUser(newUser);
    res.json({ success: true, message: "User was created" });



});
app.post("/createEmployee", function(req, res) {
    let body = req.body;
    if (getAuthLevel(currentSessions[req.session.hash]) < 2) {
        res.json({ success: false, message: "You are unauthorized to create Employees" });
        return;
    }
    console.log(body);
    if (!validateEmail(body.email)) {
        res.json({ success: false, message: "Email is invalid" });
        return;

    }
    if (users.some(u => u.email == body.email)) {
        res.json({ success: false, message: "A user with that email exists" });
        return;
    }
    if (!branches.some(b => b.ID == body.branch)) {
        res.json({ success: false, message: "That branch ID does not exist" });
        return;
    }
    newUser = {
        fname: body.fname,
        lname: body.lname,
        email: body.email,
        salary: salary,
        userType: "employee",
        "password": body.password,
        "Branch": body.branch,
        ID: users.reduce((prev, current) => (prev.ID > current.ID) ? prev : current).ID + 1
    };
    addUser(newUser);
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
            authorityBranch: getAuthLevel(user) >= 2,
            authorityUsers: getAuthLevel(user) >= 1
        }
        let newHash = createSessionHash(user);
        req.session.hash = newHash;
        currentSessions[newHash] = user;
        res.json(jsonToSend);


    } else {
        res.json({ success: false, message: "Wrong Password" });
        password_attempts++;
    }
});

app.get("/logout", (req, res) => {
    delete currentSessions[req.session.hash];
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }

    });
    setCookies(res, { fname: '', lname: '', email: '' });
    res.json({ success: true });

});
app.get("/userType", (req, res) => {
    console.log(currentSessions[req.session.hash]);
    res.json({ branch: getAuthLevel(currentSessions[req.session.hash]) >= 2, user: getAuthLevel(currentSessions[req.session.hash]) >= 1 });
});

app.listen(8071, function() {
    console.log("running express server on 8071");
});


function addUser(newUser) {
    users.push(newUser);
    fs.writeFile('./jsons/users.json', JSON.stringify(users, null, 4), function(err) {
        console.log(err);
    });
}

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

function getAuthLevel(user) {
    let authLevels = {
        "Developer": 2,
        "manager": 2,
        "employee": 1,
        "customer": 0
    };
    return authLevels[user.userType];
}

function getUserBy(field, value) {
    user = users.filter(u => u[field] == value);
    return user[0];
}

function createSessionHash(user) {
    var hash = sha256.hmac(Date.now().toString(), user.fname + user.lname);
    return hash;
}