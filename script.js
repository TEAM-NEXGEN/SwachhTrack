
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// ======================================
// 1. FIREBASE CONFIGURATION
// ======================================

 // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqypsXjg5nQtQLJf_qg8UCYupTCnvY2E4",
  authDomain: "swachhtrack-nexgen.firebaseapp.com",
  projectId: "swachhtrack-nexgen",
  storageBucket: "swachhtrack-nexgen.firebasestorage.app",
  messagingSenderId: "4853310504",
  appId: "1:4853310504:web:15fbd2eb7ed3315ea7c11d",
  measurementId: "G-JJ8M7NGS36"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ======================================
// 2. DOM ELEMENTS
// ======================================

const reportForm = document.getElementById("reportForm");
const complaintList = document.getElementById("complaintList");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const categoryFilter = document.getElementById("categoryFilter");
const gpsBtn = document.getElementById("gpsBtn");
const gpsMapBtn = document.getElementById("gpsMapBtn");
const locationStatus = document.getElementById("locationStatus");
const toast = document.getElementById("toast");

let selectedLat = null;
let selectedLng = null;
let allReports = [];
let currentUser = null;
let isAdmin = false;
let map;
let markers = [];
let toastTimer;

// ======================================
// 3. MAP INITIALIZATION
// ======================================

// Default map center: Nagpur, Maharashtra
map = L.map("map").setView([21.1458, 79.0882], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

// Temporary marker for selected reporting location
let selectedMarker = null;

// Click on map to choose location
map.on("click", function (event) {
  setLocation(event.latlng.lat, event.latlng.lng);
});

// ======================================
// 4. UTILITIES
// ======================================

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[char];
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function statusClass(status) {
  if (status === "Resolved") return "status-resolved";
  if (status === "In Progress") return "status-in-progress";
  return "status-pending";
}

function formatDate(timestamp) {
  if (!timestamp) return "Recently submitted";

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp);

  if (isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// ======================================
// 5. LOCATION SELECTION
// ======================================

function setLocation(lat, lng) {
  selectedLat = Number(lat);
  selectedLng = Number(lng);

  document.getElementById("latDisplay").textContent =
    selectedLat.toFixed(6);

  document.getElementById("lngDisplay").textContent =
    selectedLng.toFixed(6);

  locationStatus.textContent = "Location selected successfully.";

  const position = [selectedLat, selectedLng];

  if (selectedMarker) {
    map.removeLayer(selectedMarker);
  }

  selectedMarker = L.marker(position)
    .addTo(map)
    .bindPopup("Selected complaint location");

  map.setView(position, 16);
}

function getGPSLocation() {
  if (!navigator.geolocation) {
    showToast("GPS is not supported by this browser.");
    return;
  }

  locationStatus.textContent = "Finding your location...";

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setLocation(lat, lng);
      showToast("Location detected successfully.");
    },
    error => {
      locationStatus.textContent = "Location unavailable. You can select it on the map.";

      if (error.code === 1) {
        showToast("Please allow location permission.");
      } else {
        showToast("Unable to get GPS location.");
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

gpsBtn.addEventListener("click", getGPSLocation);
gpsMapBtn.addEventListener("click", getGPSLocation);

// ======================================
// 6. LIVE DATABASE
// ======================================

const reportsRef = collection(db, "reports");

const reportsQuery = query(reportsRef, orderBy("createdAt", "desc"));

onSnapshot(reportsQuery, snapshot => {
  allReports = snapshot.docs.map(document => ({
    id: document.id,
    ...document.data()
  }));

  renderReports();
  renderMarkers();
  updateStats();
}, error => {
  console.error("Database error:", error);
  showToast("Unable to load reports. Check Firebase setup.");
});

// ======================================
// 7. STATISTICS
// ======================================

function updateStats() {
  document.getElementById("totalCount").textContent =
    allReports.length;

  document.getElementById("pendingCount").textContent =
    allReports.filter(report => report.status === "Pending").length;

  document.getElementById("resolvedCount").textContent =
    allReports.filter(report => report.status === "Resolved").length;
}

// ======================================
// 8. REPORT SUBMISSION
// ======================================

reportForm.addEventListener("submit", async event => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const location = document.getElementById("location").value.trim();
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value.trim();

  if (selectedLat === null || selectedLng === null) {
    showToast("Please select the location using GPS or map.");
    document.getElementById("map-section").scrollIntoView({
      behavior: "smooth"
    });
    return;
  }

  const submitButton = reportForm.querySelector(".submit-btn");
  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    await addDoc(reportsRef, {
      name,
      location,
      category,
      description,
      latitude: selectedLat,
      longitude: selectedLng,
      status: "Pending",
      createdAt: serverTimestamp()
    });

    reportForm.reset();

    selectedLat = null;
    selectedLng = null;

    document.getElementById("latDisplay").textContent = "Not selected";
    document.getElementById("lngDisplay").textContent = "Not selected";
    locationStatus.textContent = "You can select a location on the map.";

    if (selectedMarker) {
      map.removeLayer(selectedMarker);
      selectedMarker = null;
    }

    showToast("Report submitted successfully! 🌱");

    document.getElementById("dashboard").scrollIntoView({
      behavior: "smooth"
    });
  } catch (error) {
    console.error(error);
    showToast("Submission failed. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Report ↗";
  }
});

// ======================================
// 9. MAP MARKERS
// ======================================

function markerColor(status) {
  if (status === "Resolved") return "#50a467";
  if (status === "In Progress") return "#4789c9";
  return "#e5a32e";
}

function renderMarkers() {
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  allReports.forEach(report => {
    if (
      typeof report.latitude !== "number" ||
      typeof report.longitude !== "number"
    ) return;

    const circle = L.circleMarker(
      [report.latitude, report.longitude],
      {
        radius: 9,
        color: "#ffffff",
        weight: 2,
        fillColor: markerColor(report.status),
        fillOpacity: 1
      }
    ).addTo(map);

    circle.bindPopup(`
      <strong>${escapeHTML(report.category)}</strong><br>
      ${escapeHTML(report.location)}<br>
      Status: ${escapeHTML(report.status)}
    `);

    markers.push(circle);
  });
}

// ======================================
// 10. REPORT CARDS
// ======================================

function renderReports() {
  const search = searchInput.value.toLowerCase().trim();
  const selectedStatus = statusFilter.value;
  const selectedCategory = categoryFilter.value;

  const filtered = allReports.filter(report => {
    const text = [
      report.location,
      report.category,
      report.description,
      report.name
    ].join(" ").toLowerCase();

    const matchesSearch = text.includes(search);

    const matchesStatus =
      selectedStatus === "All" || report.status === selectedStatus;

    const matchesCategory =
      selectedCategory === "All" || report.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (!filtered.length) {
    complaintList.innerHTML = `
      <div class="empty">
        <h3>No reports found</h3>
        <p>Try changing your search or filters.</p>
      </div>
    `;
    return;
  }

  complaintList.innerHTML = filtered.map(report => `
    <article class="report-card">
      <div class="report-content">
        <div class="card-top">
          <span class="badge">${escapeHTML(report.category)}</span>
          <span class="status ${statusClass(report.status)}">
            ${escapeHTML(report.status)}
          </span>
        </div>

        <h3>${escapeHTML(report.category)}</h3>
        <p>${escapeHTML(report.description)}</p>
        <p class="location">📍 ${escapeHTML(report.location)}</p>

        <p class="report-meta">
          Reported by ${escapeHTML(report.name)} · ${formatDate(report.createdAt)}
        </p>

        ${isAdmin ? `
          <select class="status-select" data-id="${escapeHTML(report.id)}">
            <option value="Pending" ${report.status === "Pending" ? "selected" : ""}>Pending</option>
            <option value="In Progress" ${report.status === "In Progress" ? "selected" : ""}>In Progress</option>
            <option value="Resolved" ${report.status === "Resolved" ? "selected" : ""}>Resolved</option>
          </select>
        ` : ""}
      </div>
    </article>
  `).join("");
}

// ======================================
// 11. ADMIN STATUS MANAGEMENT
// ======================================

complaintList.addEventListener("change", async event => {
  const select = event.target.closest(".status-select");
  if (!select || !isAdmin) return;

  const reportId = select.dataset.id;
  const newStatus = select.value;

  try {
    await updateDoc(doc(db, "reports", reportId), {
      status: newStatus
    });

    showToast("Report status updated.");
  } catch (error) {
    console.error(error);
    showToast("Unable to update status.");
  }
});

// ======================================
// 12. ADMIN LOGIN
// ======================================

const loginArea = document.getElementById("loginArea");
const adminInfo = document.getElementById("adminInfo");
const adminWelcome = document.getElementById("adminWelcome");

document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  if (!email || !password) {
    showToast("Enter your admin email and password.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error(error);
    showToast("Login failed. Check your credentials.");
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
});

// Authentication state
onAuthStateChanged(auth, user => {
  currentUser = user;

  // The same admin email must be used in Firestore rules below.
  isAdmin = !!user && user.email === "wadnarearyansh@gmail.com";

  loginArea.hidden = isAdmin;
  adminInfo.hidden = !isAdmin;

  if (isAdmin) {
    adminWelcome.textContent = "Signed in as administrator.";
  }

  renderReports();
});

// ======================================
// 13. SEARCH AND FILTERS
// ======================================

searchInput.addEventListener("input", renderReports);
statusFilter.addEventListener("change", renderReports);
categoryFilter.addEventListener("change", renderReports);
