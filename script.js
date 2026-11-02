/* =========================================================
   Smart Parking Finder - Application Logic
   ========================================================= */

/* ---------- Sample data (no external services needed) ---------- */
const parkingData = [
  {
    id: 1, name: "Central Mall Parking", area: "City Centre",
    total: 220, available: 96, hourly: 30, daily: 220, distance: 0.8,
    hours: "Open 24 hours", address: "12 Main Road, City Centre",
    vehicles: ["Car", "Bike"], features: ["CCTV", "Covered", "EV Charging", "Lift access"]
  },
  {
    id: 2, name: "Railway Station Parking", area: "Station Road",
    total: 150, available: 12, hourly: 20, daily: 150, distance: 1.6,
    hours: "5:00 AM - 11:30 PM", address: "Station Road, opposite Platform 1",
    vehicles: ["Car", "Bike", "Auto"], features: ["CCTV", "Security guard", "Open air"]
  },
  {
    id: 3, name: "City Hospital Parking", area: "Medical District",
    total: 120, available: 0, hourly: 25, daily: 180, distance: 2.3,
    hours: "Open 24 hours", address: "45 Health Avenue, Medical District",
    vehicles: ["Car", "Bike"], features: ["CCTV", "Covered", "Wheelchair access"]
  },
  {
    id: 4, name: "Tech Park Plaza", area: "IT Corridor",
    total: 300, available: 148, hourly: 40, daily: 280, distance: 4.1,
    hours: "6:00 AM - 11:00 PM", address: "Tech Park Plaza, IT Corridor",
    vehicles: ["Car", "Bike"], features: ["CCTV", "Covered", "EV Charging", "Valet"]
  },
  {
    id: 5, name: "Beachside Open Lot", area: "Marina Front",
    total: 90, available: 7, hourly: 15, daily: 100, distance: 5.4,
    hours: "6:00 AM - 10:00 PM", address: "Beach Road, Marina Front",
    vehicles: ["Car", "Bike", "Bus"], features: ["Open air", "Security guard"]
  },
  {
    id: 6, name: "Metro Station Park & Ride", area: "North Junction",
    total: 180, available: 71, hourly: 10, daily: 80, distance: 3.2,
    hours: "5:00 AM - 12:00 AM", address: "North Junction Metro, Exit B",
    vehicles: ["Car", "Bike"], features: ["CCTV", "Open air", "Metro access"]
  },
  {
    id: 7, name: "Grand Market Multi-Level", area: "Old Market",
    total: 260, available: 0, hourly: 35, daily: 240, distance: 1.1,
    hours: "7:00 AM - 11:00 PM", address: "Grand Market Street, Old Market",
    vehicles: ["Car"], features: ["CCTV", "Covered", "Lift access"]
  },
  {
    id: 8, name: "University Campus Parking", area: "Education Hub",
    total: 140, available: 58, hourly: 12, daily: 90, distance: 6.0,
    hours: "6:00 AM - 9:00 PM", address: "Gate 3, University Road",
    vehicles: ["Car", "Bike"], features: ["CCTV", "Security guard", "Open air"]
  },
  {
    id: 9, name: "Airport Express Parking", area: "Airport Zone",
    total: 400, available: 33, hourly: 50, daily: 350, distance: 12.5,
    hours: "Open 24 hours", address: "Terminal Road, Airport Zone",
    vehicles: ["Car", "Bus"], features: ["CCTV", "Covered", "Shuttle service", "EV Charging"]
  },
  {
    id: 10, name: "Riverside Garden Parking", area: "Lake View",
    total: 80, available: 41, hourly: 18, daily: 120, distance: 2.9,
    hours: "6:00 AM - 10:00 PM", address: "Lake View Drive, near Garden Gate",
    vehicles: ["Car", "Bike"], features: ["Open air", "CCTV"]
  }
];

/* ---------- App state ---------- */
const state = {
  search: "",
  filter: "all",
  sort: "name",
  selectedId: null,
  reservations: new Set()
};

/* ---------- DOM references ---------- */
const $ = (id) => document.getElementById(id);
const grid = $("parkingGrid");
const emptyState = $("emptyState");
const resultInfo = $("resultInfo");
const searchInput = $("searchInput");
const clearSearch = $("clearSearch");
const sortSelect = $("sortSelect");
const overlay = $("overlay");
const modal = $("modal");
const modalBody = $("modalBody");
const toastEl = $("toast");

/* ---------- Helpers ---------- */
function getStatus(p) {
  if (p.available === 0) return "full";
  if (p.available / p.total <= 0.3) return "limited";
  return "available";
}

const statusLabel = { available: "Available", limited: "Almost full", full: "Full" };
const money = (n) => "\u20B9" + n.toLocaleString("en-IN");

let toastTimer;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
}

/* ---------- Filtering, searching, sorting ---------- */
function getVisibleLocations() {
  const q = state.search.trim().toLowerCase();

  let list = parkingData.filter((p) => {
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q);
    const matchesFilter = state.filter === "all" ||
      (state.filter === "available" && p.available > 0) ||
      getStatus(p) === state.filter;
    return matchesSearch && matchesFilter;
  });

  list.sort((a, b) => {
    switch (state.sort) {
      case "available": return b.available - a.available;
      case "price-low": return a.hourly - b.hourly;
      case "price-high": return b.hourly - a.hourly;
      default: return a.name.localeCompare(b.name);
    }
  });
  return list;
}

/* ---------- Rendering ---------- */
function cardTemplate(p, index) {
  const status = getStatus(p);
  const occupied = p.total - p.available;
  const pct = Math.round((p.available / p.total) * 100);
  const isSelected = state.selectedId === p.id;

  return `
    <article class="card ${isSelected ? "selected" : ""}" data-id="${p.id}" style="animation-delay:${index * 0.05}s">
      <div class="card-top">
        <div>
          <h3>${p.name}</h3>
          <div class="area">&#128205; ${p.area} &bull; ${p.distance} km away</div>
        </div>
        <span class="status ${status}">${statusLabel[status]}</span>
      </div>

      <div class="meter" title="${pct}% free">
        <div class="meter-fill ${status}" style="width:${pct}%"></div>
      </div>

      <div class="space-row">
        <div class="free"><strong>${p.available}</strong><span>Available</span></div>
        <div class="busy"><strong>${occupied}</strong><span>Occupied</span></div>
        <div><strong>${p.total}</strong><span>Total</span></div>
      </div>

      <div class="price-row">
        <span>Charges</span>
        <span><b>${money(p.hourly)}</b>/hr &nbsp;&bull;&nbsp; ${money(p.daily)}/day</span>
      </div>

      <div class="card-actions">
        <button class="btn btn-outline" data-action="details" data-id="${p.id}">View details</button>
        <button class="btn btn-primary" data-action="select" data-id="${p.id}">
          ${isSelected ? "&#10003; Selected" : "Select"}
        </button>
      </div>
    </article>`;
}

function renderList() {
  const list = getVisibleLocations();

  grid.innerHTML = list.map(cardTemplate).join("");
  emptyState.hidden = list.length > 0;
  grid.hidden = list.length === 0;

  const filterText = state.filter === "all" ? "" : ` (${$("filters").querySelector(".active").firstChild.textContent.trim().toLowerCase()})`;
  resultInfo.textContent =
    `Showing ${list.length} of ${parkingData.length} parking locations${filterText}` +
    (state.search.trim() ? ` for "${state.search.trim()}"` : "");

  clearSearch.hidden = !state.search;
  updateCounts();
}

function updateCounts() {
  const counts = {
    all: parkingData.length,
    available: parkingData.filter((p) => p.available > 0).length,
    limited: parkingData.filter((p) => getStatus(p) === "limited").length,
    full: parkingData.filter((p) => getStatus(p) === "full").length
  };
  document.querySelectorAll("[data-count]").forEach((el) => {
    el.textContent = counts[el.dataset.count];
  });
}

function updateHeroStats() {
  const total = parkingData.reduce((s, p) => s + p.total, 0);
  const free = parkingData.reduce((s, p) => s + p.available, 0);
  const pct = Math.round((free / total) * 100);

  $("statLocations").textContent = parkingData.length;
  $("statAvailable").textContent = free;
  $("statOccupied").textContent = total - free;
  $("statPercent").textContent = pct;
  $("heroBar").style.width = pct + "%";
}

/* ---------- Selection ---------- */
function selectLocation(id) {
  const p = parkingData.find((x) => x.id === id);
  if (state.selectedId === id) {
    state.selectedId = null;
    showToast("Selection cleared");
  } else {
    state.selectedId = id;
    showToast(`Selected: ${p.name}`);
  }
  renderList();
}

/* ---------- Details modal ---------- */
let openId = null;

function openDetails(id) {
  openId = id;
  renderModal();
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  modal.focus();
}

function closeDetails() {
  overlay.hidden = true;
  document.body.style.overflow = "";
  openId = null;
}

function calcCost(p, hours) {
  // Daily cap: never charge more than the daily rate per 24 hours
  const days = Math.floor(hours / 24);
  const rest = hours - days * 24;
  return days * p.daily + Math.min(rest * p.hourly, p.daily);
}

function renderModal() {
  const p = parkingData.find((x) => x.id === openId);
  if (!p) return;

  const status = getStatus(p);
  const occupied = p.total - p.available;
  const pct = Math.round((p.available / p.total) * 100);
  const reserved = state.reservations.has(p.id);
  const isSelected = state.selectedId === p.id;

  modalBody.innerHTML = `
    <h2 id="modalTitle">${p.name}</h2>
    <p class="sub">&#128205; ${p.address}</p>
    <span class="status ${status}">${statusLabel[status]} &mdash; ${pct}% free</span>

    <div class="meter" style="margin-top:14px"><div class="meter-fill ${status}" style="width:${pct}%"></div></div>

    <div class="detail-grid">
      <div class="detail-item"><small>Available spaces</small><span>${p.available}</span></div>
      <div class="detail-item"><small>Occupied spaces</small><span>${occupied}</span></div>
      <div class="detail-item"><small>Total capacity</small><span>${p.total}</span></div>
      <div class="detail-item"><small>Distance</small><span>${p.distance} km</span></div>
      <div class="detail-item"><small>Hourly charge</small><span>${money(p.hourly)} / hour</span></div>
      <div class="detail-item"><small>Daily charge</small><span>${money(p.daily)} / day</span></div>
      <div class="detail-item"><small>Timings</small><span>${p.hours}</span></div>
      <div class="detail-item"><small>Vehicles</small><span>${p.vehicles.join(", ")}</span></div>
    </div>

    <h4>Facilities</h4>
    <div class="tags">${p.features.map((f) => `<span class="tag">${f}</span>`).join("")}</div>

    <div class="calc">
      <div class="calc-head">
        <span>Estimate your cost</span>
        <span id="calcHours">2 hours</span>
      </div>
      <input type="range" id="calcRange" min="1" max="48" value="2" aria-label="Parking duration in hours" />
      <div class="calc-total" id="calcTotal">${money(calcCost(p, 2))}</div>
      <small>Daily rate applies if it is cheaper than hourly charges.</small>
    </div>

    <div class="modal-actions">
      <button class="btn ${isSelected ? "btn-outline" : "btn-primary"}" data-m="select">
        ${isSelected ? "&#10003; Selected (click to clear)" : "Select this location"}
      </button>
      ${reserved
        ? `<button class="btn btn-danger" data-m="cancel">Cancel my reservation</button>`
        : `<button class="btn btn-primary" data-m="reserve" ${p.available === 0 ? "disabled" : ""}>
             ${p.available === 0 ? "Parking full" : "Reserve a space"}
           </button>`}
      <button class="btn btn-outline" data-m="copy">Copy address</button>
    </div>`;

  const range = $("calcRange");
  range.addEventListener("input", () => {
    const h = Number(range.value);
    $("calcHours").textContent = h + (h === 1 ? " hour" : " hours");
    $("calcTotal").textContent = money(calcCost(p, h));
  });
}

function reserveSpace() {
  const p = parkingData.find((x) => x.id === openId);
  if (!p || p.available === 0) return;
  p.available -= 1;
  state.reservations.add(p.id);
  showToast(`Space reserved at ${p.name}`);
  refreshAll();
}

function cancelReservation() {
  const p = parkingData.find((x) => x.id === openId);
  if (!p || !state.reservations.has(p.id)) return;
  p.available = Math.min(p.total, p.available + 1);
  state.reservations.delete(p.id);
  showToast("Reservation cancelled");
  refreshAll();
}

function copyAddress() {
  const p = parkingData.find((x) => x.id === openId);
  const done = () => showToast("Address copied to clipboard");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(`${p.name}, ${p.address}`).then(done).catch(() => showToast(p.address));
  } else {
    showToast(p.address);
  }
}

function refreshAll() {
  renderList();
  updateHeroStats();
  if (openId !== null && !overlay.hidden) renderModal();
}

/* ---------- Simulated live update ---------- */
function simulateLiveUpdate() {
  parkingData.forEach((p) => {
    const change = Math.floor(Math.random() * 15) - 7; // -7 .. +7
    p.available = Math.max(0, Math.min(p.total, p.available + change));
  });
  refreshAll();
  showToast("Availability updated");
}

/* ---------- Reset ---------- */
function resetAll() {
  state.search = "";
  state.filter = "all";
  searchInput.value = "";
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c.dataset.filter === "all"));
  renderList();
}

/* ---------- Event listeners ---------- */

// Search (live as you type)
searchInput.addEventListener("input", (e) => {
  state.search = e.target.value;
  renderList();
});

clearSearch.addEventListener("click", () => {
  state.search = "";
  searchInput.value = "";
  searchInput.focus();
  renderList();
});

// Filter chips
$("filters").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  state.filter = chip.dataset.filter;
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === chip));
  renderList();
});

// Sort
sortSelect.addEventListener("change", (e) => {
  state.sort = e.target.value;
  renderList();
});

// Card buttons (event delegation)
grid.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (btn) {
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === "details") openDetails(id);
    if (btn.dataset.action === "select") selectLocation(id);
    return;
  }
  // Clicking elsewhere on a card also opens its details
  const card = e.target.closest(".card");
  if (card) openDetails(Number(card.dataset.id));
});

// Modal buttons
modalBody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-m]");
  if (!btn) return;
  const action = btn.dataset.m;
  if (action === "select") { selectLocation(openId); renderModal(); }
  if (action === "reserve") reserveSpace();
  if (action === "cancel") cancelReservation();
  if (action === "copy") copyAddress();
});

$("modalClose").addEventListener("click", closeDetails);
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeDetails(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) closeDetails(); });

// Other buttons
$("refreshBtn").addEventListener("click", simulateLiveUpdate);
$("resetBtn").addEventListener("click", resetAll);

// Mobile menu
const menuBtn = $("menuBtn");
const nav = $("nav");
menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});
nav.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }
});

/* ---------- Init ---------- */
$("year").textContent = new Date().getFullYear();
renderList();
updateHeroStats();
