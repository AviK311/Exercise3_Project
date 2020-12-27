let path = require("path");
let express = require("express");
const app = express();
const bodyParser = require('body-parser');
var fs = require('fs');



//session
const session = require("express-session");

//use
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({ secret: "poo" }));

app.use(function(req, res, next) { setTimeout(next, 1000); })



//data
var users = require("./jsons/users");
const flowers = require("./jsons/flowers");
var branches = require("./jsons/branches");
var carts = require("./jsons/carts");
var branchName = {};
branches.forEach(branch => {
    branchName[branch.ID] = branch.name;
});



const currentSessions = {};
const lockedSessions = {};
const passwordattempts = {};
// set the view engine to ejs
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
    res.render("index");
});
app.get("/home", function(req, res) {
    console.log(req.session);
    console.log(req.sessionID);
    res.render("partials/home");
});

app.delete("/deleteUser", function(req, res) {
    let currentUser = getUserBySessID(req.sessionID);
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
    let currentUser = getUserBySessID(req.sessionID);
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
app.post("/demoteUser", function(req, res) {
    let currentUser = getUserBySessID(req.sessionID);
    console.log(currentUser);
    if (getAuthLevel(currentUser) < 2) {
        res.json({ success: false, message: "You are unauthorized to demote employees" });
        return;
    }
    userToDemote = users.findIndex(u => u.email == req.body.email);
    users[userToPromote].userType = "employee";

    fs.writeFile('./jsons/users.json', JSON.stringify(users, null, 4), function(err) {
        console.log(err);
    });
    res.json({ success: true, message: "User was demoted" });


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

app.post("/cart", function(req, res) {
    let cart = req.body.cart;
    carts[currentSessions[req.sessionID]] = cart;
    fs.writeFile('./jsons/carts.json', JSON.stringify(carts, null, 4), function(err) {
        console.log(err);
    });
    res.json({ success: true });

});

app.get("/flowers", function(req, res) {
    res.render("partials/flowerList", { flowers: flowers });
});
app.get("/branches", function(req, res) {
    let currentUser = getUserBySessID(req.sessionID);
    console.log(currentUser);
    res.render("partials/branchList", { branches: branches.filter(b => b.active), isAuth: getAuthLevel(currentUser) >= 2 });
});
app.get("/users", function(req, res) {
    let currentUser = getUserBySessID(req.sessionID);
    console.log(currentUser);
    if (getAuthLevel(currentUser) < 1) {
        res.send("You are unauthorized to view this content")
        return;
    }
    res.render("partials/userList", { users: users.filter(u => u.userType != "Developer"), Branches: branchName, withPassword: getAuthLevel(currentUser) >= 2 });
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
    let currentUser = getUserBySessID(req.sessionID);
    if (getAuthLevel(currentUser) < 2) {
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
        salary: body.salary,
        userType: "employee",
        password: body.password,
        Branch: body.branch,
        ID: users.reduce((prev, current) => (prev.ID > current.ID) ? prev : current).ID + 1
    };
    addUser(newUser);
    res.json({ success: true, message: "User was created" });



});

app.post("/createBranch", function(req, res) {
    let body = req.body;
    let currentUser = getUserBySessID(req.sessionID);
    if (getAuthLevel(currentUser) < 2) {
        res.json({ success: false, message: "You are unauthorized to create Branches" });
        return;
    }
    console.log(body);

    if (branches.some(b => b.name == body.name)) {
        res.json({ success: false, message: "A branch with that name exists" });
        return;
    }
    newBranch = {
        name: body.name,
        ID: branches.reduce((prev, current) => (prev.ID > current.ID) ? prev : current).ID + 1,
        address: body.address,
        active: true
    };
    branches.push(newBranch);
    fs.writeFile('./jsons/branches.json', JSON.stringify(branches, null, 4), function(err) {
        console.log(err);
    });
    res.json({ success: true, message: "Branch was created" });


});
app.post("/authenticate", function(req, res) {
    if (!(req.sessionID in passwordattempts))
        passwordattempts[req.sessionID] = {};
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
    if (req.sessionID in lockedSessions && user.ID in lockedSessions[req.sessionID]) {
        console.log(lockedSessions[req.sessionID]);
        let difference = (Date.now() - lockedSessions[req.sessionID][user.ID]);
        difference = difference / (1000 * 3600);
        console.log(difference);
        if (difference < 6) {
            res.json({ success: false, message: "This user has been locked out of this session" });
            return;
        } else {
            delete lockedSessions[req.sessionID][user.ID];
            delete passwordattempts[req.sessionID][user.ID];
        }
    }
    if (user.password == body.password) {
        setCookies(res, user);
        if (body.remember)
            setRememberCookies(res, user);
        else
            resetRememberCookies(res);
        if (!(user.ID in carts))
            carts[user.ID] = [];

        let jsonToSend = {
            success: true,
            user: user,
            isAuth: getAuthLevel(user) >= 1,
            cart: carts[user.ID]
        }
        currentSessions[req.sessionID] = user.ID;
        res.json(jsonToSend);


    } else {
        if (!(user.ID in passwordattempts[req.sessionID]))
            passwordattempts[req.sessionID][user.ID] = 1;
        else
            passwordattempts[req.sessionID][user.ID]++;

        if (passwordattempts[req.sessionID][user.ID] >= 5) {
            if (!(req.sessionID in lockedSessions))
                lockedSessions[req.sessionID] = {};
            lockedSessions[req.sessionID][user.ID] = Date.now()

            res.json({ success: false, message: "Wrong Password" });
        }


    }
});

app.get("/logout", (req, res) => {
    delete currentSessions[req.sessionID];

    setCookies(res, { fname: '', lname: '', email: '' });
    res.json({ success: true });

});
app.get("/userType", (req, res) => {
    currentUser = getUserBySessID(req.sessionID);
    console.log(currentUser);
    res.json({ isAuth: getAuthLevel(currentUser) >= 1 });
});

app.get("/cartPage", (req, res) => {
    console.log(carts);
    cartWithImages = carts[currentSessions[req.sessionID]].map(item => {
        let flower = getFlowerByID(item.id);
        return {
            quantity: item.quantity,
            color: item.color,
            name: flower.name,
            img: flower.img,
            price: flower.price,
            id: item.id
        };
    });

    res.render('partials/cart', { cart: cartWithImages });
});

app.listen(8072, function() {
    console.log("running express server on 8072");
});



function addUser(newUser) {
    users.push(newUser);
    fs.writeFile('./jsons/users.json', JSON.stringify(users, null, 4), function(err) {
        console.log(err);
    });
}

function setCookies(res, user) {
    let options = {
        maxAge: 1000 * 60 * 60 * 6, //6 hours
    }
    res.cookie("fname", user.fname, options);
    res.cookie("lname", user.lname, options);
    res.cookie("email", user.email, options);
    res.cookie("userType", user.userType, options);
}

function setRememberCookies(res, user) {
    res.cookie("remember", true);
    res.cookie("rEmail", user.email);
    res.cookie("rPassword", user.password);
}

function resetRememberCookies(res) {
    res.cookie("remember", false);
    res.cookie("rEmail", '');
    res.cookie("rPassword", '');
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
    return user ? authLevels[user.userType] : 0;
}

function getUserBy(field, value) {
    user = users.filter(u => u[field] == value);
    return user[0];
}

function getUserBySessID(value) {
    return getUserBy("ID", currentSessions[value]);
}



function getFlowerByID(value) {
    filteredFlowers = flowers.filter(f => f.ID == value);
    if (filteredFlowers.length == 0)
        return null;
    return filteredFlowers[0];
}