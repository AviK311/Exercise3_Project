async function createBranch() {
    let name = $(nameAddBranch).val();
    let address = $(addressAddBranch).val();
    loading(true);
    fetch("/createBranch", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: name,
                address: address,
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            loading(false);
            if (data.success) {
                $("#addBranchModal").modal("toggle");
                $(".form-group input").val('');
            }

        })
        .catch((error) => {
            console.error("Failed to connect to server");
        });
}