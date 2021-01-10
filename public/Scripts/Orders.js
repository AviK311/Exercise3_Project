async function deploy(id) {
    if (!adding) {
        alertServerError();
        return;
    }
    loading(true);
    fetch("/deployOrder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: id
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            loading(false);
            if (data.success) {
                console.log("Order deployed");
            } else {
                console.log("Error:", data.message);
            }
        })
        .catch(disableChanges);
}

async function accept(id) {
    if (!adding) {
        alertServerError();
        return;
    }
    loading(true);
    fetch("/acceptOrder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: id
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            loading(false);
            if (data.success) {
                console.log("Order accepted");
            } else {
                console.log("Error:", data.message);
            }
        })
        .catch(disableChanges);
}