$(".refresh-btn").on('click', function(e) {
    let idAndColor = e.target.id.replace('Refresh', '');
    let inputID = idAndColor + 'Quantity';
    let totalID = idAndColor + 'Total';
    let priceID = idAndColor + 'Price';
    let price = parseFloat($("#" + priceID).text().trim());
    let quantity = $("#" + inputID).val();


    $("#" + totalID).text((price * quantity).toFixed(2));
    idAndColor = idAndColor.split('_');
    let id = idAndColor[0];
    let color = idAndColor[1];

    filteredCart = shoppingCart.filter(item => item.id == id && item.color == color);
    filteredCart[0].quantity = quantity;
    updateCart();
    //toggleCreateOrderBtn();
    updateTotal();
});


$(".trash-btn").on('click', function(e) {
    let idAndColor = e.target.id.replace('Delete', '');
    let fullElement = idAndColor + 'Full';
    console.log(fullElement);

    idAndColor = idAndColor.split('_');
    let id = idAndColor[0];
    let color = idAndColor[1];

    filteredIndex = shoppingCart.findIndex(item => item.id == id && item.color == color);
    shoppingCart.splice(filteredIndex, 1);
    updateCart();
    $("#" + fullElement).remove();
    //toggleCreateOrderBtn();
    updateTotal();
});





function updateTotal() {
    let total = 0;
    $('.priceCount').each(function() {
        total += parseFloat($(this).text());
    });
    $("#totalPrice").text(total.toFixed(2));

}


async function createOrder() {
    if (!$("#orderAddress").val() || !$("#orderDescription").val()) return;
    loading(true);
    fetch("/createOrder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                address: $("#orderAddress").val(),
                description: $("#orderDescription").val(),
                totalPrice: parseFloat($("#totalPrice").text())
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            loading(false);
            if (data.success) {
                console.log("Order Created");
                shoppingCart = [];
                $("#createOrderModal").modal("toggle");
                $("#cartSize").text(0);
                mainLoad('/cartPage');
            } else {
                console.log("Error:", data.message);
            }
        })
        .catch((error) => {
            console.error("Failed to connect to server");
        });
}

function toggleCreateOrderBtn() {
    if (shoppingCart.length > 0)
        $("#createOrderModalOpen").attr("href", "#createOrderModal");
    else
        $("#createOrderModalOpen").removeAttr("href");

}

toggleCreateOrderBtn();