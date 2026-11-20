
const form = document.getElementById("reportForm");
const complaintList = document.getElementById("complaintList");

let complaints = JSON.parse(
    localStorage.getItem("swachhComplaints") || "[]"
);

function saveComplaints() {
    localStorage.setItem(
        "swachhComplaints",
        JSON.stringify(complaints)
    );
}

function updateDashboard() {
    document.getElementById("totalCount").textContent =
        complaints.length;

    document.getElementById("pendingCount").textContent =
        complaints.filter(c => c.status === "Pending").length;

    document.getElementById("resolvedCount").textContent =
        complaints.filter(c => c.status === "Resolved").length;
}

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const location = document.getElementById("location").value.trim();
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value.trim();
    const photoInput = document.getElementById("photo");
    const photo = photoInput.files[0];

    if (photo && !photo.type.startsWith("image/")) {
        alert("Please select a valid image.");
        return;
    }

    const complaint = {
        id: "SW" + Date.now().toString().slice(-7),
        name,
        location,
        category,
        description,
        status: "Pending",
        date: new Date().toLocaleString(),
        photo: ""
    };

    const message = document.getElementById("message");

    function finishSubmission() {
        complaints.unshift(complaint);
        saveComplaints();
        updateDashboard();
        displayComplaints();

        message.textContent =
            "Report submitted successfully! Your ID: " + complaint.id;

        form.reset();
    }

    if (photo) {
        const reader = new FileReader();

        reader.onload = function() {
            complaint.photo = reader.result;
            finishSubmission();
        };

        reader.onerror = function() {
            alert("Unable to read the image. Please try again.");
        };

        reader.readAsDataURL(photo);
    } else {
        finishSubmission();
    }
});

function updateStatus(id, newStatus) {
    complaints = complaints.map(complaint => {
        if (complaint.id === id) {
            return { ...complaint, status: newStatus };
        }
        return complaint;
    });

    saveComplaints();
    updateDashboard();
    displayComplaints();
}

function displayComplaints() {
    const search = document.getElementById("searchInput")
        .value.toLowerCase();

    const filter = document.getElementById("statusFilter").value;

    const filtered = complaints.filter(c => {
        const matchesSearch =
            c.id.toLowerCase().includes(search) ||
            c.name.toLowerCase().includes(search) ||
            c.location.toLowerCase().includes(search);

        const matchesStatus =
            filter === "All" || c.status === filter;

        return matchesSearch && matchesStatus;
    });

    complaintList.innerHTML = "";

    if (filtered.length === 0) {
        complaintList.innerHTML =
            '<p class="empty">No complaints found.</p>';
        return;
    }

    filtered.forEach(c => {
        const card = document.createElement("article");
        card.className = "complaint-card";

        const title = document.createElement("h3");
        title.textContent = c.category + " — " + c.id;

        const details = document.createElement("p");
        details.textContent = "Reported by: " + c.name;

        const location = document.createElement("p");
        location.textContent = "Location: " + c.location;

        const description = document.createElement("p");
        description.textContent = "Description: " + c.description;

        const date = document.createElement("p");
        date.textContent = "Date: " + c.date;

        const status = document.createElement("span");
        status.className = "status";
        if (c.status === "Resolved") {
            status.classList.add("resolved");
        } else if (c.status === "In Progress") {
            status.classList.add("in-progress");
        }
        status.textContent = "Status: " + c.status;

        card.append(title, details, location, description, date, status);

        if (c.photo) {
            const image = document.createElement("img");
            image.src = c.photo;
            image.alt = "Reported sanitation issue";
            image.style.width = "160px";
            image.style.display = "block";
            image.style.marginTop = "12px";
            image.style.borderRadius = "8px";
            card.appendChild(image);
        }

        const actions = document.createElement("div");
        actions.className = "card-actions";

        if (c.status === "Pending") {
            const progressButton = document.createElement("button");
            progressButton.textContent = "Mark In Progress";
            progressButton.addEventListener("click", () => {
                updateStatus(c.id, "In Progress");
            });
            actions.appendChild(progressButton);
        }

        if (c.status !== "Resolved") {
            const resolveButton = document.createElement("button");
            resolveButton.textContent = "Mark Resolved";
            resolveButton.addEventListener("click", () => {
                updateStatus(c.id, "Resolved");
            });
            actions.appendChild(resolveButton);
        }

        card.appendChild(actions);
        complaintList.appendChild(card);
    });
}

document.getElementById("searchInput").addEventListener(
    "input", displayComplaints
);

document.getElementById("statusFilter").addEventListener(
    "change", displayComplaints
);

updateDashboard();
displayComplaints();
