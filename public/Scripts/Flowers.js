$(".add-flwr-btn").on('click', function(e) {
    let flowerId = e.target.id.replace('addBtn', '');
    let quantity = parseInt($('#quantity' + flowerId).val());
    let color = $('#dropDownMenu' + flowerId).text().trim();
    if (color == "Colors")
        return;
    console.log(flowerId, quantity, color);
    existingItem = shoppingCart.filter(i => i.id == flowerId && i.color == color);
    if (existingItem.length == 0)
        shoppingCart.push({ id: flowerId, quantity: quantity, color: color });
    else {
        console.log(existingItem)
        existingItem[0].quantity += quantity;
    }
    updateCart();
    console.log(shoppingCart);

});