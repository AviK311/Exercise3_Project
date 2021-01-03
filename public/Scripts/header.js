var currentRequest;
async function mainLoad(route) {
    loading(true);
    console.log(currentRequest);
    if (currentRequest)
        currentRequest.abort();
    currentRequest = $.ajax({
        url: route,
        success: function(data) {
            $("#main").html(data);
            loading(false);
        }
    });
}

function isAuthorizedUsers(userType) {
    return (
        userType == "Developer" ||
        userType == "manager" ||
        userType == "employee"
    );

}

function get_user() {
    if ($("#email").val() == "" || $("#password").val() == "") return;
    login($("#email").val(), $("#password").val());
}

async function login(email, password) {
    loading(true);
    fetch("/authenticate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                password: password,
                remember: $("#rememberMe").is(":checked")
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            loading(false);
            if (data.success) {
                console.log("Login Successful");
                $("#loginModal:visible").modal("toggle");
                $(".for-login").hide();
                $(".for-logout").show();
                $("#welcomeNote").text(`Welcome, ${data.user.fname} ${data.user.lname}`);
                $(".employee-only").toggle(isAuthorizedUsers(data.user.userType));
                $("#errorMsg").text('');
                mainLoad('/home');
                shoppingCart = data.cart;
                $("#cartSize").text(shoppingCart.length);


            } else {
                console.log("Error:", data.message);
                $("#errorMsg").text(data.message);

            }
        })
        .catch((error) => {
            console.error("Failed to connect to server");
        });
}


async function logout() {
    loading(true);
    fetch("/logout")
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                loading(false);
                console.log("Logout Successful");
                $("#welcomeNote").text("Welcome");
                $("#logoutModal").modal("toggle");
                $(".for-login").show();
                $(".for-logout").hide();
                $(".employee-only").toggle(false);
                mainLoad("/home");

            }
        })
        .catch((error) => {
            console.error("Failed to connect to server");
        });
}

async function checkUser() {

    let fname = getCookie("fname");
    if (!fname) {
        return;
    }
    $(".for-login").hide();
    $(".for-logout").show();
    let lname = getCookie("lname");
    $("#welcomeNote").text(`Welcome, ${fname} ${lname}`);
    let userType = getCookie("userType");
    if (isAuthorizedUsers(userType)) {
        loading(true);
        fetch("/userType")
            .then((res) => res.json())
            .then((data) => {
                loading(false);
                $(".employee-only").toggle(data.isAuth);
                shoppingCart = data.cart;
                $("#cartSize").text(shoppingCart.length);
            })
            .catch((error) => {
                console.error("Failed to connect to server");
            });

    } else $(".employee-only").toggle(false);
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0)
            return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function activate(curElement) {
    $(curElement).parent().siblings().each(function() {
        $(this).removeClass("active")
    });
    $(curElement).parent().addClass("active");
}
checkUser();
async function createCustomer() {
    let password = $(passwordAddCustomer).val();
    if (password != $(passwordAddCustomerConfirm).val()) {
        return;
    }
    let fname = $(fnameAddCustomer).val();
    let lname = $(lnameAddCustomer).val();
    let email = $(emailAddCustomer).val();
    loading(true);
    fetch("/createCustomer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                password: password,
                fname: fname,
                lname: lname
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            loading(false);
            if (data.success) {
                $("#addCustomerModal").modal("toggle");
                $(".form-group input").val('');
                if (!getCookie("fname")) {
                    login(email, password);
                }
            }

        })
        .catch((error) => {
            console.error("Failed to connect to server");
        });
}

function loading(flag = true) {
    $("#spinner").toggle(flag)
}

if (getCookie("remember")) {
    $("#email").val(getCookie("rEmail").replace('%40', '@'));
    $("#password").val(getCookie("rPassword"));
}
$('#rememberMe').prop('checked', getCookie("remember") == 'true');



async function updateCart() {
    loading(true);
    fetch("/cart", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                cart: shoppingCart
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            loading(false);
            if (data.success) {
                console.log("Cart update Successful");
                $("#cartSize").text(shoppingCart.length);
            } else {
                console.log("Error:", data.message);
            }
        })
        .catch((error) => {
            console.error("Failed to connect to server");
        });
}