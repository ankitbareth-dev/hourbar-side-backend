document.addEventListener("DOMContentLoaded", function () {
  // --- Tab Switching Logic ---
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));
      this.classList.add("active");
      const targetTab = this.getAttribute("data-tab");
      document.getElementById(targetTab).classList.add("active");
    });
  });

  // --- Rates Form Logic ---
  const form = document.querySelector('form[action="/rate/save"]');
  const submitBtn = document.getElementById("submitBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  document.querySelectorAll(".js-edit").forEach((btn) => {
    btn.addEventListener("click", function () {
      const d = this.dataset;
      document.getElementById("rateId").value = d.id;
      document.getElementById("seasonName").value = d.season_name;
      document.getElementById("startDate").value = d.start_date;
      document.getElementById("endDate").value = d.end_date;
      document.getElementById("nightlyPrice").value = d.nightly_price;
      document.getElementById("weekendPrice").value = d.weekend_price;
      document.getElementById("minStay").value = d.min_stay;

      const wDays = d.weekend_days.split(",");
      document.querySelectorAll('input[name="weekend_days"]').forEach((cb) => {
        cb.checked = wDays.includes(cb.value);
      });

      submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Rate';
      cancelBtn.style.display = "inline-block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  cancelBtn.addEventListener("click", function () {
    form.reset();
    document.getElementById("rateId").value = "";
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Insert Rate';
    cancelBtn.style.display = "none";
    document.querySelectorAll('input[name="weekend_days"]').forEach((cb) => {
      cb.checked = cb.value === "Fri" || cb.value === "Sat";
    });
  });

  document.querySelectorAll(".js-delete").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      Swal.fire({
        title: "Delete this rate?",
        text: "This cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Yes, delete it!",
      }).then((result) => {
        if (result.isConfirmed) {
          this.closest("form").submit();
        }
      });
    });
  });

  // ==========================================
  // --- CALENDAR LOGIC (2 MONTHS) ---
  // ==========================================
  const calendarData = window.__CALENDAR_DATA__ || {
    bookedDates: [],
    startDates: [],
    endDates: [],
  };
  let currentCalDate = new Date();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  function generateMonthHTML(year, month) {
    let html = '<div class="cal-month-container">';
    html += `<div class="cal-month-title">${monthNames[month]} ${year}</div>`;
    html += '<div class="cal-row">';
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(
      (d) => (html += `<div class="cal-head">${d}</div>`),
    );
    html += '</div><div class="cal-row">';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
      html += '<div class="cal-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      let cls = "cal-day";
      if (dateObj.getTime() === today.getTime()) cls += " today";

      const isStart = calendarData.startDates.includes(dStr);
      const isEnd = calendarData.endDates.includes(dStr);
      const isBooked = calendarData.bookedDates.includes(dStr);

      if (isStart && isEnd) cls += " is-start is-end";
      else if (isStart) cls += " is-start";
      else if (isEnd) cls += " is-end";
      else if (isBooked) cls += " is-booked";

      html += `<div class="${cls}">${day}</div>`;
    }
    html += "</div></div>"; // Close cal-row and cal-month-container
    return html;
  }

  function renderCalendar() {
    const year1 = currentCalDate.getFullYear();
    const month1 = currentCalDate.getMonth();

    // Calculate second month safely (handles year rollover automatically)
    const secondMonthDate = new Date(year1, month1 + 1, 1);
    const year2 = secondMonthDate.getFullYear();
    const month2 = secondMonthDate.getMonth();

    // Update Header Text
    document.getElementById("calendarMonthYear").innerText =
      `${monthNames[month1]} ${year1} - ${monthNames[month2]} ${year2}`;

    // Render both months into the wrapper
    const wrapper = document.getElementById("calendarWrapper");
    wrapper.innerHTML =
      generateMonthHTML(year1, month1) + generateMonthHTML(year2, month2);
  }

  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    currentCalDate.setMonth(currentCalDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    currentCalDate.setMonth(currentCalDate.getMonth() + 1);
    renderCalendar();
  });

  document.getElementById("syncBtn").addEventListener("click", function () {
    const btn = this;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
    btn.disabled = true;

    fetch("/api/calendar/sync")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          calendarData.bookedDates = data.data.bookedDates;
          calendarData.startDates = data.data.startDates;
          calendarData.endDates = data.data.endDates;
          renderCalendar();
          Swal.fire(
            "Synced!",
            "Calendar updated successfully from VRBO.",
            "success",
          );
        } else {
          Swal.fire("Error", data.error || "Sync failed", "error");
        }
      })
      .catch((err) => Swal.fire("Error", "Network error during sync", "error"))
      .finally(() => {
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> Sync Now';
        btn.disabled = false;
      });
  });

  // Initial render
  renderCalendar();
});
