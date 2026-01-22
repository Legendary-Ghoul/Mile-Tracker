class MileageTracker {
  constructor() {
    this.trips = this.loadTrips();
    this.form = document.getElementById("trip-form");
    this.tripsList = document.getElementById("trips-list");
    this.totalMilesEl = document.getElementById("total-miles");
    this.exportBtn = document.getElementById("export-btn");
    this.clearBtn = document.getElementById("clear-btn");

    this.init();
  }

  init() {
    // Set today's date as default
    document.getElementById("date").valueAsDate = new Date();

    // Event listeners
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    this.exportBtn.addEventListener("click", () => this.exportCSV());
    this.clearBtn.addEventListener("click", () => this.clearAllData());

    // Initial render
    this.render();
  }

  loadTrips() {
    const stored = localStorage.getItem("mileageTrips");
    return stored ? JSON.parse(stored) : [];
  }

  saveTrips() {
    localStorage.setItem("mileageTrips", JSON.stringify(this.trips));
  }

  handleSubmit(e) {
    e.preventDefault();

    const trip = {
      id: Date.now(),
      date: document.getElementById("date").value,
      from: document.getElementById("from").value.trim(),
      to: document.getElementById("to").value.trim(),
      miles: parseFloat(document.getElementById("miles").value),
      purpose: document.getElementById("purpose").value.trim(),
    };

    this.trips.unshift(trip);
    this.saveTrips();
    this.form.reset();
    document.getElementById("date").valueAsDate = new Date();
    this.render();
  }

  deleteTrip(id) {
    if (confirm("Are you sure you want to delete this trip?")) {
      this.trips = this.trips.filter((trip) => trip.id !== id);
      this.saveTrips();
      this.render();
    }
  }

  clearAllData() {
    if (
      confirm(
        "Are you sure you want to delete all trips? This cannot be undone."
      )
    ) {
      this.trips = [];
      this.saveTrips();
      this.render();
    }
  }

  calculateTotal() {
    return this.trips.reduce((sum, trip) => sum + trip.miles, 0);
  }

  formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  exportCSV() {
    if (this.trips.length === 0) {
      alert("No trips to export!");
      return;
    }

    const headers = ["Date", "From", "To", "Miles", "Purpose"];
    const rows = this.trips.map((trip) => [
      trip.date,
      trip.from,
      trip.to,
      trip.miles,
      trip.purpose,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mileage-tracker-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  render() {
    // Update total
    this.totalMilesEl.textContent = this.calculateTotal().toFixed(1);

    // Render trips
    if (this.trips.length === 0) {
      this.tripsList.innerHTML =
        '<div class="empty-state">No trips yet. Add your first trip above!</div>';
      return;
    }

    this.tripsList.innerHTML = this.trips
      .map(
        (trip) => `
        <div class="trip-item">
          <div class="trip-details">
            <div class="trip-date">${this.formatDate(trip.date)}</div>
            <div class="trip-route">${trip.from} → ${trip.to}</div>
            ${trip.purpose ? `<div class="trip-purpose">${trip.purpose}</div>` : ""}
          </div>
          <div class="trip-miles">${trip.miles.toFixed(1)} mi</div>
          <button class="delete-btn" onclick="tracker.deleteTrip(${trip.id})">
            Delete
          </button>
        </div>
      `
      )
      .join("");
  }
}

// Initialize the app
const tracker = new MileageTracker();
