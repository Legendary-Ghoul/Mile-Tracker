class MileageTracker {
  constructor() {
    this.activeTrips = this.loadActiveTrips();
    this.completedTrips = this.loadCompletedTrips();

    this.startForm = document.getElementById("start-form");
    this.endForm = document.getElementById("end-form");
    this.activeTripsList = document.getElementById("active-trips-list");
    this.completedTripsList = document.getElementById("completed-trips-list");
    this.totalMilesEl = document.getElementById("total-miles");
    this.activeTripSelect = document.getElementById("active-trip");
    this.exportBtn = document.getElementById("export-btn");
    this.clearBtn = document.getElementById("clear-btn");

    this.init();
  }

  init() {
    // Set today's date as default
    const today = new Date().toISOString().split("T")[0];
    if (document.getElementById("start-date")) {
      document.getElementById("start-date").value = today;
    }
    if (document.getElementById("end-date")) {
      document.getElementById("end-date").value = today;
    }

    // Set current time as default
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (document.getElementById("start-time")) {
      document.getElementById("start-time").value = timeStr;
    }
    if (document.getElementById("end-time")) {
      document.getElementById("end-time").value = timeStr;
    }

    // Event listeners
    if (this.startForm) {
      this.startForm.addEventListener("submit", (e) => this.handleStartTrip(e));
    }
    if (this.endForm) {
      this.endForm.addEventListener("submit", (e) => this.handleEndTrip(e));
    }
    if (this.exportBtn) {
      this.exportBtn.addEventListener("click", () => this.exportCSV());
    }
    if (this.clearBtn) {
      this.clearBtn.addEventListener("click", () => this.clearAllData());
    }

    if (this.activeTripSelect) {
      this.activeTripSelect.addEventListener("click", () =>
        this.updateActiveTripSelect()
      );
    }

    // Initial render
    this.render();
  }

  loadActiveTrips() {
    const stored = localStorage.getItem("activeMileageTrips");
    return stored ? JSON.parse(stored) : [];
  }

  loadCompletedTrips() {
    const stored = localStorage.getItem("completedMileageTrips");
    return stored ? JSON.parse(stored) : [];
  }

  saveActiveTrips() {
    localStorage.setItem("activeMileageTrips", JSON.stringify(this.activeTrips));
  }

  saveCompletedTrips() {
    localStorage.setItem(
      "completedMileageTrips",
      JSON.stringify(this.completedTrips)
    );
  }

  handleStartTrip(e) {
    e.preventDefault();

    const trip = {
      id: Date.now(),
      date: document.getElementById("start-date").value,
      startTime: document.getElementById("start-time").value,
      car: document.getElementById("car").value.trim(),
      startOdometer: parseFloat(document.getElementById("start-odometer").value),
      purpose: document.getElementById("purpose").value.trim(),
    };

    this.activeTrips.unshift(trip);
    this.saveActiveTrips();
    this.startForm.reset();

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("start-date").value = today;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    document.getElementById("start-time").value = timeStr;

    this.render();
  }

  handleEndTrip(e) {
    e.preventDefault();

    const tripId = parseInt(this.activeTripSelect.value);
    const activeTrip = this.activeTrips.find((t) => t.id === tripId);

    if (!activeTrip) {
      alert("Please select a valid trip");
      return;
    }

    const endOdometer = parseFloat(document.getElementById("end-odometer").value);
    const miles = endOdometer - activeTrip.startOdometer;

    if (miles < 0) {
      alert("Ending odometer cannot be less than starting odometer");
      return;
    }

    const completedTrip = {
      ...activeTrip,
      endDate: document.getElementById("end-date").value,
      endTime: document.getElementById("end-time").value,
      endOdometer: endOdometer,
      miles: parseFloat(miles.toFixed(1)),
    };

    // Remove from active
    this.activeTrips = this.activeTrips.filter((t) => t.id !== tripId);
    this.saveActiveTrips();

    // Add to completed
    this.completedTrips.unshift(completedTrip);
    this.saveCompletedTrips();

    this.endForm.reset();

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("end-date").value = today;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    document.getElementById("end-time").value = timeStr;

    this.render();
  }

  deleteTrip(id, isActive) {
    if (confirm("Are you sure you want to delete this trip?")) {
      if (isActive) {
        this.activeTrips = this.activeTrips.filter((t) => t.id !== id);
        this.saveActiveTrips();
      } else {
        this.completedTrips = this.completedTrips.filter((t) => t.id !== id);
        this.saveCompletedTrips();
      }
      this.render();
    }
  }

  clearAllData() {
    if (
      confirm(
        "Are you sure you want to delete all trips? This cannot be undone."
      )
    ) {
      this.activeTrips = [];
      this.completedTrips = [];
      this.saveActiveTrips();
      this.saveCompletedTrips();
      this.render();
    }
  }

  updateActiveTripSelect() {
    const options = this.activeTrips
      .map(
        (trip) =>
          `<option value="${trip.id}">${trip.car} - ${trip.date} ${trip.startTime}</option>`
      )
      .join("");

    this.activeTripSelect.innerHTML =
      '<option value="">Select a trip to end...</option>' + options;
  }

  calculateTotal() {
    return this.completedTrips.reduce((sum, trip) => sum + trip.miles, 0);
  }

  formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  formatTime(timeString) {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  renderActiveTrips() {
    if (this.activeTrips.length === 0) {
      this.activeTripsList.innerHTML =
        '<div class="empty-state">No active trips. Start a trip above!</div>';
      return;
    }

    this.activeTripsList.innerHTML = this.activeTrips
      .map(
        (trip) => `
        <div class="trip-item active">
          <div class="trip-header">
            <div class="trip-car">${trip.car}</div>
            <span class="trip-status active">Active</span>
          </div>
          <div class="trip-details">
            <div class="trip-detail-item">
              <div class="trip-detail-label">Date</div>
              <div class="trip-value">${this.formatDate(trip.date)}</div>
            </div>
            <div class="trip-detail-item">
              <div class="trip-detail-label">Start Time</div>
              <div class="trip-value">${this.formatTime(trip.startTime)}</div>
            </div>
            <div class="trip-detail-item">
              <div class="trip-detail-label">Start Odometer</div>
              <div class="trip-value">${trip.startOdometer.toFixed(1)} mi</div>
            </div>
            <div class="trip-detail-item">
              <div class="trip-detail-label">Purpose</div>
              <div class="trip-value">${trip.purpose || "—"}</div>
            </div>
          </div>
          <div class="trip-footer">
            <button class="delete-btn" onclick="tracker.deleteTrip(${trip.id}, true)">
              Delete
            </button>
          </div>
        </div>
      `
      )
      .join("");
  }

  renderCompletedTrips() {
    if (this.completedTrips.length === 0) {
      this.completedTripsList.innerHTML =
        '<div class="empty-state">No completed trips yet.</div>';
      return;
    }

    this.completedTripsList.innerHTML = this.completedTrips
      .map(
        (trip) => `
        <div class="trip-item completed">
          <div class="trip-header">
            <div class="trip-car">${trip.car}</div>
            <span class="trip-status completed">Completed</span>
          </div>
          <div class="trip-details">
            <div class="trip-detail-item">
              <div class="trip-detail-label">Date</div>
              <div class="trip-value">${this.formatDate(trip.date)}</div>
            </div>
            <div class="trip-detail-item">
              <div class="trip-detail-label">Time</div>
              <div class="trip-value">${this.formatTime(trip.startTime)} - ${this.formatTime(trip.endTime)}</div>
            </div>
            <div class="trip-detail-item">
              <div class="trip-detail-label">Odometer</div>
              <div class="trip-value">${trip.startOdometer.toFixed(1)} → ${trip.endOdometer.toFixed(1)} mi</div>
            </div>
            <div class="trip-detail-item">
              <div class="trip-detail-label">Purpose</div>
              <div class="trip-value">${trip.purpose || "—"}</div>
            </div>
          </div>
          <div class="trip-footer">
            <div class="trip-miles">${trip.miles.toFixed(1)} mi</div>
            <button class="delete-btn" onclick="tracker.deleteTrip(${trip.id}, false)">
              Delete
            </button>
          </div>
        </div>
      `
      )
      .join("");
  }

  exportCSV() {
    if (this.completedTrips.length === 0) {
      alert("No completed trips to export!");
      return;
    }

    const headers = [
      "Date",
      "Car",
      "Start Time",
      "End Time",
      "Start Odometer",
      "End Odometer",
      "Miles",
      "Purpose",
    ];
    const rows = this.completedTrips.map((trip) => [
      trip.date,
      trip.car,
      trip.startTime,
      trip.endTime,
      trip.startOdometer,
      trip.endOdometer,
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
    this.updateActiveTripSelect();
    this.renderActiveTrips();
    this.renderCompletedTrips();
    this.totalMilesEl.textContent = this.calculateTotal().toFixed(1);
  }
}

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  const tracker = new MileageTracker();
  window.tracker = tracker; // Make it global for onclick handlers
});
