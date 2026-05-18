import app from "./app.js";
import sequelize from "./config/database.js";
import { startCronJobs } from "./cron/ical.cron.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
try {
await sequelize.authenticate();

    startCronJobs();

    try {
      const data = await icalService.syncIcalEvents();
    } catch (err) {}

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

} catch (err) {
console.error("Unable to connect to the database:", err);
process.exit(1);
}
};

start();
import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import {
authRoutes,
dashboardRoutes,
apiRoutes,
quoteRoutes,
} from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

dotenv.config();

const **filename = fileURLToPath(import.meta.url);
const **dirname = path.dirname(\_\_filename);

const app = express();

app.use(cors());

app.use(express.static(path.join(\_\_dirname, "../public")));

app.set("view engine", "ejs");
app.set("views", "./src/views");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
session({
secret: process.env.SESSION_SECRET || "fallback-secret",
resave: false,
saveUninitialized: true,
cookie: { secure: false },
}),
);

app.use(authRoutes);
app.use(dashboardRoutes);
app.use(apiRoutes);
app.use(quoteRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

<!DOCTYPE html>
<html lang="en">
<head>
  <%- include('partials/head', { title: 'Admin Login | HARBOURSIDE519' }) %>
  <link rel="stylesheet" href="/css/login.css" />
</head>
<body>
  <div class="login-card">
    <div class="logo-section">
      <h1>HARBOURSIDE519</h1>
    </div>

    <% if (error) { %>
      <div class="error-msg">
        <i class="fas fa-exclamation-circle"></i> <%= error %>
      </div>
    <% } %>

    <form method="POST" action="/">
      <div class="form-group">
        <i class="fas fa-envelope"></i>
        <input type="email" name="email" placeholder="Email Address" required>
      </div>
      <div class="form-group">
        <i class="fas fa-lock"></i>
        <input type="password" name="password" placeholder="Password" required>
      </div>
      <button type="submit" class="btn-login">Sign In</button>
    </form>

    <div class="footer-text">
      &copy; <%= new Date().getFullYear() %> Harbourside519. All rights reserved.
    </div>

  </div>
</body>
</html><!DOCTYPE html>
<html lang="en">
<head>
  <%- include('partials/head', { title: 'Admin Dashboard | HARBOURSIDE519' }) %>
  <link rel="stylesheet" href="/css/dashboard.css" />
</head>
<body>
  <% 
    function formatDt(date) { 
      if (!date) return '-'; 
      const d = new Date(date + "T00:00:00"); 
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      return `${month}/${day}/${year}`; 
    } 
  %>

<%- include('partials/header', { username }) %>

  <div class="main-container">
    <div class="card">
      
         <!-- TAB NAVIGATION -->
      <div class="tab-navigation">
        <button class="tab-btn active" data-tab="rates-tab"><i class="fas fa-dollar-sign"></i> Rates</button>
        <button class="tab-btn" data-tab="taxes-tab"><i class="fas fa-percentage"></i> Taxes</button> <!-- NEW TAB -->
        <button class="tab-btn" data-tab="calendar-tab"><i class="fas fa-calendar-alt"></i> Calendar</button>
      </div>

      <!-- ==================== RATES TAB ==================== -->
      <div id="rates-tab" class="tab-content active">
        <h2 class="content-title">Add / Edit Seasonal Rates</h2>
        <span class="text-muted">Define nightly and weekend rules for specific seasons.</span>

        <div class="note-box">
          <i class="fas fa-info-circle"></i> <strong>Note:</strong> Only insert numbers without currency symbols. Start Date = Check-in, End Date = Check-out.
        </div>

        <form action="/rate/save" method="POST">
          <input type="hidden" name="id" id="rateId" value="">
          <div class="form-grid">
            <div class="form-group">
              <label>Season Name</label>
              <input type="text" name="season_name" id="seasonName" class="form-control" placeholder="e.g. Summer" required>
            </div>
            <div class="form-group">
              <label>Start Date</label>
              <input type="date" name="start_date" id="startDate" class="form-control">
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input type="date" name="end_date" id="endDate" class="form-control">
            </div>
            <div class="form-group">
              <label>Nightly Rate ($)</label>
              <input type="number" step="0.01" name="nightly_price" id="nightlyPrice" class="form-control" placeholder="100.00" required>
            </div>
            <div class="form-group">
              <label>Weekend Rate ($)</label>
              <input type="number" step="0.01" name="weekend_price" id="weekendPrice" class="form-control" placeholder="120.00" required>
              <div class="checkbox-group">
                <% ['Thu', 'Fri', 'Sat', 'Sun'].forEach(function(day) { %>
                  <label class="checkbox-label">
                    <input type="checkbox" name="weekend_days" value="<%= day %>" <%= (day === 'Fri' || day === 'Sat') ? 'checked' : '' %>>
                    <%= day %>
                  </label>
                <% }) %>
              </div>
            </div>
            <div class="form-group">
              <label>Minimum Stay (Nights)</label>
              <input type="number" name="min_stay" id="minStay" class="form-control" value="1">
            </div>
          </div>

          <div style="display: flex; gap: 15px; margin-top: 10px;">
            <button type="submit" class="btn btn-primary" id="submitBtn">
              <i class="fas fa-plus"></i> Insert Rate
            </button>
            <button type="button" class="btn btn-secondary" id="cancelBtn" style="display: none;">
              Cancel Edit
            </button>
          </div>
        </form>

        <h2 class="content-title" style="margin-top: 50px;">Current Rate List</h2>
        <table class="rates-table">
          <thead>
            <tr>
              <th>Season</th><th>Start</th><th>End</th><th>Nightly ($)</th><th>Weekend ($)</th><th>Weekly ($)</th><th>Monthly ($)</th><th>Min Stay</th><th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <% if (rates && rates.length > 0) { %>
              <% rates.forEach(function(rate) { %>
                <tr>
                  <td style="font-weight: 600;"><%= rate.seasonName %></td>
                  <td><%= formatDt(rate.startDate) %></td>
                  <td><%= formatDt(rate.endDate) %></td>
                  <td>$<%= Number(rate.nightlyPrice).toFixed(2) %></td>
                  <td>
                    $<%= Number(rate.weekendPrice).toFixed(2) %>
                    <br><span style="font-size: 11px; color: rgba(255,255,255,0.4);"><%= rate.weekendDays %></span>
                  </td>
                  <td><%= rate.weeklyRate === '-' ? '-' : '$' + rate.weeklyRate %></td>
                  <td><%= rate.monthlyRate === '-' ? '-' : '$' + rate.monthlyRate %></td>
                  <td><%= rate.minStay %> N</td>
                  <td style="text-align: right;">
                    <button class="btn-icon btn-edit js-edit"
                      data-id="<%= rate.id %>"
                      data-season_name="<%= rate.seasonName %>"
                      data-start_date="<%= rate.startDate ? new Date(rate.startDate).toISOString().split('T')[0] : '' %>"
                      data-end_date="<%= rate.endDate ? new Date(rate.endDate).toISOString().split('T')[0] : '' %>"
                      data-nightly_price="<%= rate.nightlyPrice %>"
                      data-weekend_price="<%= rate.weekendPrice %>"
                      data-weekend_days="<%= rate.weekendDays %>"
                      data-min_stay="<%= rate.minStay %>"
                    ><i class="fas fa-edit"></i></button>

                    <form method="POST" action="/rate/delete" style="display:inline-block; margin-left: 5px;">
                      <input type="hidden" name="id" value="<%= rate.id %>">
                      <button type="button" class="btn-icon btn-delete js-delete"><i class="fas fa-trash"></i></button>
                    </form>
                  </td>
                </tr>
              <% }) %>
            <% } else { %>
              <tr>
                <td colspan="9" style="text-align: center; padding: 30px; color: rgba(255,255,255,0.4);">No seasonal rates added yet.</td>
              </tr>
            <% } %>
          </tbody>
        </table>
      </div>

          <!-- ==================== TAXES TAB ==================== -->
      <div id="taxes-tab" class="tab-content">
        <h2 class="content-title">Taxes & Fees</h2>
        <span class="text-muted">Define cleaning, pet, and extra guest fees, as well as tax rates.</span>

        <div class="note-box" style="margin-top: 20px;">
          <i class="fas fa-info-circle"></i> <strong>Note:</strong> Only insert numbers without currency symbols.
        </div>

        <form action="/settings/taxes" method="POST">
          <!-- Extra Guest -->
          <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); flex-wrap: wrap;">
            <div class="form-group" style="flex: 0.5; min-width: 120px; margin-bottom: 0;">
              <label><i class="fas fa-users"></i> Extra Guest</label>
            </div>
            <div class="form-group" style="flex: 0.3; min-width: 100px; margin-bottom: 0;">
              <label>Taxable?</label>
              <label class="checkbox-label" style="margin-top: 5px;">
                <input type="checkbox" name="extra_guest_taxable" <%= settings.extraGuestTaxable ? 'checked' : '' %>> Yes
              </label>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>Fee Type</label>
              <select name="extra_guest_fee_type" class="form-control">
                <option value="Per Guest Per Stay" <%= settings.extraGuestFeeType === 'Per Guest Per Stay' ? 'selected' : '' %>>Per Guest Per Stay</option>
                <option value="Per Guest Per Night" <%= settings.extraGuestFeeType === 'Per Guest Per Night' ? 'selected' : '' %>>Per Guest Per Night</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>Fee ($)</label>
              <input type="number" step="0.01" name="extra_guest_fee" class="form-control" value="<%= settings.extraGuestFee || 0 %>">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>Threshold</label>
              <input type="number" name="extra_guest_threshold" class="form-control" value="<%= settings.extraGuestThreshold || 2 %>">
            </div>
          </div>

          <!-- Cleaning Fee -->
          <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); flex-wrap: wrap;">
            <div class="form-group" style="flex: 0.5; min-width: 120px; margin-bottom: 0;">
              <label><i class="fas fa-broom"></i> Cleaning</label>
            </div>
            <div class="form-group" style="flex: 0.3; min-width: 100px; margin-bottom: 0;">
              <label>Taxable?</label>
              <label class="checkbox-label" style="margin-top: 5px;">
                <input type="checkbox" name="cleaning_fee_taxable" <%= settings.cleaningFeeTaxable ? 'checked' : '' %>> Yes
              </label>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>Fee Type</label>
              <select name="cleaning_fee_type" class="form-control">
                <option value="Per Stay" <%= settings.cleaningFeeType === 'Per Stay' ? 'selected' : '' %>>Per Stay</option>
                <option value="Per Night" <%= settings.cleaningFeeType === 'Per Night' ? 'selected' : '' %>>Per Night</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>Fee ($)</label>
              <input type="number" step="0.01" name="cleaning_fee" class="form-control" value="<%= settings.cleaningFee || 0 %>">
            </div>
          </div>

          <!-- Pet Fee -->
          <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); flex-wrap: wrap;">
            <div class="form-group" style="flex: 0.5; min-width: 120px; margin-bottom: 0;">
              <label><i class="fas fa-paw"></i> Pets</label>
            </div>
            <div class="form-group" style="flex: 0.3; min-width: 100px; margin-bottom: 0;">
              <label>Taxable?</label>
              <label class="checkbox-label" style="margin-top: 5px;">
                <input type="checkbox" name="pet_fee_taxable" <%= settings.petFeeTaxable ? 'checked' : '' %>> Yes
              </label>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>Fee Type</label>
              <select name="pet_fee_type" class="form-control">
                <option value="Per Stay" <%= settings.petFeeType === 'Per Stay' ? 'selected' : '' %>>Per Stay</option>
                <option value="Per Night" <%= settings.petFeeType === 'Per Night' ? 'selected' : '' %>>Per Night</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>Fee ($)</label>
              <input type="number" step="0.01" name="pet_fee" class="form-control" value="<%= settings.petFee || 0 %>">
            </div>
          </div>

          <!-- Tax Rate & Deposit -->
          <div class="form-grid" style="margin-top: 30px;">
            <div class="form-group">
              <label><i class="fas fa-shield-alt"></i> Refundable Damage Deposit ($)</label>
              <input type="number" step="0.01" name="damage_deposit" class="form-control" value="<%= settings.damageDeposit || 0 %>">
            </div>
            <div class="form-group">
              <label><i class="fas fa-percent"></i> Tax Rate (%)</label>
              <input type="number" step="0.01" name="property_tax_rate" class="form-control" value="<%= settings.propertyTaxRate || 13.25 %>">
            </div>
          </div>

          <div style="margin-top: 20px;">
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update Taxes & Fees</button>
          </div>
        </form>

        <!-- Policies Section -->
        <h2 class="content-title" style="margin-top: 60px;">Policies & Rental Notes</h2>
        <form action="/settings/policies" method="POST">
          <div class="form-group">
            <label>Additional Information About Rental Rates</label>
            <textarea name="rental_notes" class="form-control" style="resize: vertical; min-height: 150px;"><%= settings.rentalNotes || '' %></textarea>
          </div>
          <div class="form-group">
            <label>Our Rental Policies / Cancellation Policy</label>
            <textarea name="cancellation_policy" class="form-control" style="resize: vertical; min-height: 150px;"><%= settings.cancellationPolicy || '' %></textarea>
          </div>
          <div style="margin-top: 20px;">
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Update Policies</button>
          </div>
        </form>
      </div>

      <!-- ==================== CALENDAR TAB ==================== -->
      <div id="calendar-tab" class="tab-content">
        <h2 class="content-title">Availability Calendar</h2>
        <span class="text-muted">Sync external bookings from VRBO/Airbnb or view current availability.</span>

        <div class="note-box" style="margin-top: 20px;">
          <i class="fas fa-info-circle"></i> <strong>Note:</strong> Check-out dates are available for new check-ins. The calendar automatically refreshes data from the iCal link when synced.
        </div>

        <form action="/ical/save" method="POST" class="ical-form">
          <input type="text" name="ical_url" class="form-control" placeholder="https://www.vrbo.com/icalendar/..." value="<%= icalUrl %>" style="flex: 1;">
          <button type="submit" class="btn btn-secondary"><i class="fas fa-save"></i> Save URL</button>
          <button type="button" id="syncBtn" class="btn btn-primary"><i class="fas fa-sync-alt"></i> Sync Now</button>
        </form>

        <div class="calendar-controls">
          <button class="btn btn-secondary" id="prevMonthBtn"><i class="fas fa-chevron-left"></i> Prev</button>
          <h3 id="calendarMonthYear"></h3>
          <button class="btn btn-secondary" id="nextMonthBtn">Next <i class="fas fa-chevron-right"></i></button>
        </div>

        <!-- Updated Grid Wrapper for 2 Months -->
        <div id="calendarWrapper" class="calendar-wrapper">
          <!-- JS will inject the two months here -->
        </div>

        <div class="calendar-legend">
          <div class="legend-item"><div class="legend-box" style="background: #fff; border: 2px solid #3b82f6;"></div> Today</div>
          <div class="legend-item"><div class="legend-box" style="background: linear-gradient(135deg, #fff 50%, #ef4444 50%);"></div> Check-in</div>
          <div class="legend-item"><div class="legend-box" style="background: #ef4444; color: #fff;"></div> Booked</div>
          <div class="legend-item"><div class="legend-box" style="background: linear-gradient(135deg, #10b981 50%, #fff 50%);"></div> Check-out</div>
        </div>
      </div>

    </div>

  </div>

  <!-- Pass Server Data to Client JS Safely -->
  <script>
    window.__CALENDAR_DATA__ = <%- JSON.stringify(calendarData || { bookedDates: [], startDates: [], endDates: [] }) %>;
    window.__ICAL_URL__ = "<%= icalUrl %>";
  </script>
  <script src="/js/dashboard.js"></script>
</body>
</html><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title><%= title %></title>
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
/>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<link rel="stylesheet" href="/css/main.css" />
<div class="dashboard-header">
  <h1>HARBOURSIDE519</h1>
  <div class="user-info">
    <span><i class="fas fa-user-circle"></i> Welcome, <%= username %></span>
    <a href="/logout" class="btn-logout"
      ><i class="fas fa-sign-out-alt"></i> Logout</a
    >
  </div>
</div>
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
/\*\*

- Calculates Weekly (6 nights) and Monthly (29 nights) rates based on the
- exact proportion of weekend vs standard nights in the season.
  \*/
  export const calculateDynamicRates = (rate) => {
  const weekendDaysArr = rate.weekendDays ? rate.weekendDays.split(",") : [];
  const nightly = parseFloat(rate.nightlyPrice);
  const weekend = parseFloat(rate.weekendPrice);

let weeklyRate = "-";
let monthlyRate = "-";

if (rate.startDate && rate.endDate) {
// Appending T00:00:00 prevents Javascript UTC timezone shift bugs
const start = new Date(rate.startDate + "T00:00:00");
const end = new Date(rate.endDate + "T00:00:00");

    const totalNights = Math.round((end - start) / (1000 * 60 * 60 * 24));

    if (totalNights > 0) {
      let weekendNights = 0;

      // Count actual weekend nights within the season
      for (let i = 0; i < totalNights; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        const dayName = currentDate.toLocaleDateString("en-US", {
          weekday: "short",
        });

        if (weekendDaysArr.includes(dayName)) {
          weekendNights++;
        }
      }

      const standardNights = totalNights - weekendNights;
      const totalCost = standardNights * nightly + weekendNights * weekend;
      const avgPerNight = totalCost / totalNights;

      // 1 Week = 6 Nights
      weeklyRate = (avgPerNight * 6).toFixed(2);

      // 1 Month = 29 Nights (Only show if season is at least 29 days long)
      if (totalNights >= 29) {
        monthlyRate = (avgPerNight * 29).toFixed(2);
      }
    }

}

// Convert Sequelize instance to plain object and append dynamic rates
const plainRate = rate.get ? rate.get({ plain: true }) : rate;
return { ...plainRate, weeklyRate, monthlyRate };
};
import Admin from "../models/Admin.js";
import AppError from "../utils/AppError.js";

// Changed function name and parameter to match the 'email' column
export const findAdminByEmail = async (email) => {
return await Admin.findOne({ where: { email } });
};

export const validateCredentials = async (email, password) => {
const admin = await findAdminByEmail(email);

if (!admin || admin.password !== password) {
throw new AppError("Invalid email or password.", 401);
}

return admin;
};
import ical from "node-ical";
import Setting from "../models/Setting.js";
import AppError from "../utils/AppError.js";

// Helper to format Date object to YYYY-MM-DD safely (UTC)
const formatDt = (date) => {
const d = new Date(date);
return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
};

export const getIcalUrl = async () => {
const setting = await Setting.findByPk(1);
return setting?.icalUrl || "";
};

export const updateIcalUrl = async (url) => {
const setting = await Setting.findByPk(1);
if (!setting) await Setting.create({ id: 1, icalUrl: url });
else {
setting.icalUrl = url;
await setting.save();
}
return setting;
};

export const syncIcalEvents = async () => {
const setting = await Setting.findByPk(1);
if (!setting || !setting.icalUrl) {
throw new AppError("No iCal URL configured.", 400);
}

try {
const data = await ical.async.fromURL(setting.icalUrl);

    const bookedDates = new Set();
    const startDates = new Set();
    const endDates = new Set();

    for (const event of Object.values(data)) {
      if (event.type === "VEVENT" && event.start && event.end) {
        const checkin = formatDt(event.start);
        const checkout = formatDt(event.end);

        startDates.add(checkin);
        endDates.add(checkout);

        // Fill all nights between check-in and check-out
        let current = new Date(event.start);
        const end = new Date(event.end);

        while (current < end) {
          bookedDates.add(formatDt(current));
          current.setUTCDate(current.getUTCDate() + 1);
        }
      }
    }

    return {
      bookedDates: Array.from(bookedDates),
      startDates: Array.from(startDates),
      endDates: Array.from(endDates),
    };

} catch (err) {
throw new AppError("Failed to fetch or parse iCal feed.", 500);
}
};
import { SeasonalRate } from "../models/index.js";
import Setting from "../models/Setting.js";
import AppError from "../utils/AppError.js";

/\*\*

- Calculates the full itemized booking quote.
- Mirrors the logic from the legacy PHP calculation engine.
  \*/
  export const calculateQuote = async (checkIn, checkOut, guests, pets) => {
  const settings = await Setting.findByPk(1);
  if (!settings) throw new AppError("Property settings not configured.", 400);

// 1. Parse Dates (Force UTC to prevent timezone shifts)
const start = new Date(checkIn + "T00:00:00");
const end = new Date(checkOut + "T00:00:00");
const today = new Date(new Date().setUTCHours(0, 0, 0, 0));

if (start < today)
throw new AppError("Check-in date cannot be in the past.", 400);
if (end <= start)
throw new AppError("Check-out must be after check-in.", 400);

const totalNights = Math.round((end - start) / (1000 _ 60 _ 60 \* 24));

// 2. Fetch Rates
const standardRate = await SeasonalRate.findOne({
where: { startDate: null, endDate: null },
});
const seasonalRates = await SeasonalRate.findAll();

if (!standardRate) throw new AppError("No standard rate configured.", 400);

// 3. Loop Through Nights & Calculate Base Accommodation
let accommodationTotal = 0;
let current = new Date(start);

while (current < end) {
const currentStr = current.toISOString().split("T")[0];
const dayName = current.toLocaleDateString("en-US", { weekday: "short" });

    // Find applicable rate (Seasonal or Standard)
    let appliedRate = seasonalRates.find((r) => {
      return (
        r.startDate &&
        r.endDate &&
        currentStr >= r.startDate &&
        currentStr <= r.endDate
      );
    });

    if (!appliedRate) appliedRate = standardRate;

    const weekendDays = appliedRate.weekendDays
      ? appliedRate.weekendDays.split(",")
      : [];
    const isWeekend = weekendDays.includes(dayName);

    accommodationTotal += isWeekend
      ? parseFloat(appliedRate.weekendPrice)
      : parseFloat(appliedRate.nightlyPrice);
    current.setUTCDate(current.getUTCDate() + 1);

}

// 4. Calculate Fees
let totalCleaning = parseFloat(settings.cleaningFee) || 0;
if (settings.cleaningFeeType === "Per Night") totalCleaning \*= totalNights;

let totalPetFee = 0;
if (pets > 0) {
totalPetFee = parseFloat(settings.petFee) || 0;
if (settings.petFeeType === "Per Night")
totalPetFee = totalPetFee _ pets _ totalNights;
else totalPetFee = totalPetFee \* pets;
}

let totalGuestFee = 0;
const threshold = settings.extraGuestThreshold || 2;
if (guests > threshold) {
const extraGuests = guests - threshold;
totalGuestFee = parseFloat(settings.extraGuestFee) || 0;
if (settings.extraGuestFeeType === "Per Guest Per Night")
totalGuestFee = totalGuestFee _ extraGuests _ totalNights;
else totalGuestFee = totalGuestFee \* extraGuests;
}

// 5. Calculate Tax
let taxableAmount = accommodationTotal;
if (settings.cleaningFeeTaxable) taxableAmount += totalCleaning;
if (settings.petFeeTaxable) taxableAmount += totalPetFee;
if (settings.extraGuestTaxable) taxableAmount += totalGuestFee;

const taxRate = parseFloat(settings.propertyTaxRate) || 0;
const totalTax = taxableAmount \* (taxRate / 100);

// 6. Calculate Totals
const damageDeposit = parseFloat(settings.damageDeposit) || 0;
const grandTotal =
accommodationTotal +
totalCleaning +
totalPetFee +
totalGuestFee +
totalTax +
damageDeposit;

// 7. Return Itemized Receipt
return {
checkIn: start.toISOString().split("T")[0],
checkOut: end.toISOString().split("T")[0],
totalNights,
guests,
pets,
breakdown: {
accommodation: accommodationTotal,
cleaningFee: totalCleaning,
petFee: totalPetFee,
extraGuestFee: totalGuestFee,
tax: totalTax,
damageDeposit: damageDeposit,
},
grandTotal,
};
};
import { Sequelize } from "sequelize";
import { SeasonalRate } from "../models/index.js";
import AppError from "../utils/AppError.js";

// Gets all rates for the dashboard
export const getAllRates = async () => {
return await SeasonalRate.findAll({
order: [
[Sequelize.literal("season_name = 'Standard' DESC, start_date ASC")],
],
});
};

export const createRate = async (rateData) => {
return await SeasonalRate.create(rateData);
};

export const updateRate = async (id, rateData) => {
const [updatedRows] = await SeasonalRate.update(rateData, {
where: { id },
});
if (updatedRows === 0) {
throw new AppError("Rate not found.", 404);
}
return updatedRows;
};

export const deleteRate = async (id) => {
const deletedRows = await SeasonalRate.destroy({ where: { id } });
if (deletedRows === 0) {
throw new AppError("Rate not found.", 404);
}
return deletedRows;
};

export const upsertRate = async (rateData) => {
const { id, ...data } = rateData;

if (data.startDate === "") data.startDate = null;
if (data.endDate === "") data.endDate = null;
data.minStay = data.minStay || 1;

if (id) {
await updateRate(id, data);
return { updated: true };
}

await createRate(data);
return { created: true };
};
import { Router } from "express";
import _ as apiController from "../controllers/api.controller.js";
import _ as icalService from "../services/ical.service.js";

const router = Router();

router.get("/api/rates", apiController.getRates);

router.get("/api/booked-dates", async (req, res) => {
try {
const data = await icalService.syncIcalEvents();
res.json({ success: true, data });
} catch (err) {
console.error("❌ Error syncing calendar for public API:", err.message);
res.json({
success: false,
error: err.message || "Could not fetch calendar data.",
data: { bookedDates: [], startDates: [], endDates: [] },
});
}
});

export default router;
import { Router } from "express";
import \* as authController from "../controllers/auth.controller.js";

const router = Router();

router.get("/", authController.showLogin);
router.post("/", authController.handleLogin);
router.get("/logout", authController.handleLogout);

export default router;
import { Router } from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import \* as dashboardController from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/dashboard", isAuthenticated, dashboardController.showDashboard);
router.post("/rate/save", isAuthenticated, dashboardController.saveRate);
router.post("/rate/delete", isAuthenticated, dashboardController.deleteRate);
router.post("/ical/save", isAuthenticated, dashboardController.saveIcalUrl);
router.get(
"/api/calendar/sync",
isAuthenticated,
dashboardController.syncCalendar,
);

// Add these new routes:
router.post("/settings/taxes", isAuthenticated, dashboardController.saveTaxes);
router.post(
"/settings/policies",
isAuthenticated,
dashboardController.savePolicies,
);

export default router;
import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import apiRoutes from "./api.routes.js";
import quoteRoutes from "./quote.routes.js";

export { authRoutes, dashboardRoutes, apiRoutes, quoteRoutes };
import { Router } from "express";
import \* as quoteController from "../controllers/quote.controller.js";

const router = Router();

// Public endpoint - no authentication required
router.post("/api/quote", quoteController.getQuote);

export default router;
import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Setting extends Model {}

Setting.init(
{
id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
icalUrl: { type: DataTypes.TEXT, allowNull: true },
extraGuestTaxable: { type: DataTypes.BOOLEAN, defaultValue: true },
extraGuestFeeType: {
type: DataTypes.STRING(50),
defaultValue: "Per Guest Per Night",
},
extraGuestFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
extraGuestThreshold: { type: DataTypes.INTEGER, defaultValue: 2 },
cleaningFeeTaxable: { type: DataTypes.BOOLEAN, defaultValue: false },
cleaningFeeType: { type: DataTypes.STRING(50), defaultValue: "Per Stay" },
cleaningFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
petFeeTaxable: { type: DataTypes.BOOLEAN, defaultValue: false },
petFeeType: { type: DataTypes.STRING(50), defaultValue: "Per Stay" },
petFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
damageDeposit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.0 },
propertyTaxRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 13.25 },
rentalNotes: { type: DataTypes.TEXT, allowNull: true },
cancellationPolicy: { type: DataTypes.TEXT, allowNull: true },
},
{
sequelize,
tableName: "settings",
timestamps: false,
underscored: true,
},
);

export default Setting;
import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class SeasonalRate extends Model {}

SeasonalRate.init(
{
id: {
type: DataTypes.INTEGER,
primaryKey: true,
autoIncrement: true,
},
seasonName: {
type: DataTypes.STRING,
allowNull: false,
},
startDate: {
type: DataTypes.DATEONLY,
allowNull: true,
},
endDate: {
type: DataTypes.DATEONLY,
allowNull: true,
},
nightlyPrice: {
type: DataTypes.DECIMAL(10, 2),
allowNull: false,
},
weekendPrice: {
type: DataTypes.DECIMAL(10, 2),
allowNull: false,
},
weekendDays: {
type: DataTypes.STRING,
defaultValue: "Fri,Sat",
},
minStay: {
type: DataTypes.INTEGER,
defaultValue: 1,
},
},
{
sequelize,
tableName: "seasonal_rates",
timestamps: false,
underscored: true,
},
);

export default SeasonalRate;
import Admin from "./Admin.js";
import SeasonalRate from "./SeasonalRate.js";
import Setting from "./Setting.js";

export { Admin, SeasonalRate, Setting };
import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Admin extends Model {}

Admin.init(
{
id: {
type: DataTypes.INTEGER,
primaryKey: true,
autoIncrement: true,
},
email: {
// Changed from username
type: DataTypes.STRING,
allowNull: false,
unique: true,
},
password: {
type: DataTypes.STRING,
allowNull: false,
},
},
{
sequelize,
tableName: "admins", // Changed from admin
timestamps: false,
underscored: true,
},
);

export default Admin;
/\*\*

- Wraps an async route handler so that rejected promises
- are automatically forwarded to the global error handler.
  \*/
  const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
import AppError from "../utils/AppError.js";

/\*\*

- Global error‑handling middleware.
- - Operational errors (AppError) → user‑friendly message
- - Unknown errors → generic 500 message
    \*/
    const errorHandler = (err, req, res, \_next) => {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational
    ? err.message
    : "Something went wrong. Please try again.";

console.error(`[Error] ${statusCode} – ${message}`);
if (!err.isOperational) {
console.error(err.stack);
}

// ── API requests → JSON ──────────────────────────────────
if (req.path.startsWith("/api/")) {
return res.status(statusCode).json({ success: false, error: message });
}

// ── Page requests → redirect or render ───────────────────
if (statusCode === 401 || statusCode === 403) {
return res.redirect("/");
}

res.status(statusCode).render("login", { error: message });
};

/\*\*

- 404 catch‑all — creates an AppError and forwards it
- to the global error handler.
  \*/
  const notFound = (req, \_res, next) => {
  next(new AppError(`Page not found: ${req.originalUrl}`, 404));
  };

export { errorHandler, notFound };
/\*\*

- Redirects page requests to login or returns 403 JSON for API requests
- when the user is not authenticated.
  \*/
  const isAuthenticated = (req, res, next) => {
  if (req.session.admin_logged_in) {
  return next();
  }

if (req.path.startsWith("/api/")) {
return res
.status(403)
.json({ error: "Unauthorized. Please log in via the browser first." });
}

res.redirect("/");
};

export default isAuthenticated;
import cron from "node-cron";
import \* as icalService from "../services/ical.service.js";

export const startCronJobs = () => {
cron.schedule("0 \* \* \* \*", async () => {
console.log("⏳ [Cron] Running hourly iCal sync...");
try {
const url = await icalService.getIcalUrl();

      if (!url) {
        console.log("ℹ️ [Cron] No iCal URL configured. Skipping sync.");
        return;
      }

      const data = await icalService.syncIcalEvents();
      console.log(
        `✅ [Cron] iCal sync successful. Found ${data.startDates.length} bookings.`,
      );
    } catch (err) {
      console.error("❌ [Cron] iCal sync failed:", err.message);
    }

});

console.log("✅ Cron jobs initialized (iCal sync scheduled every hour).");
};
import \* as rateService from "../services/rate.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { calculateDynamicRates } from "../utils/rateCalculator.js";

export const getRates = asyncHandler(async (req, res) => {
const rates = await rateService.getAllRates();
const processedRates = rates.map(calculateDynamicRates);

res.json({
success: true,
seasonal_rates: processedRates.map((r) => ({
id: r.id,
season_name: r.seasonName,
start_date: r.startDate,
end_date: r.endDate,
nightly_price: parseFloat(r.nightlyPrice),
weekend_price: parseFloat(r.weekendPrice),
weekend_days: r.weekendDays,
min_stay: r.minStay,
weekly_price: r.weeklyRate === "-" ? null : parseFloat(r.weeklyRate),
monthly_price: r.monthlyRate === "-" ? null : parseFloat(r.monthlyRate),
})),
});
});
import \* as authService from "../services/auth.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const showLogin = (req, res) => {
if (req.session.admin_logged_in) {
return res.redirect("/dashboard");
}
res.render("login", { title: "Admin Login | HARBOURSIDE519", error: "" }); // Added title
};

export const handleLogin = asyncHandler(async (req, res) => {
const { email, password } = req.body;

if (!email || !password) {
return res.render("login", {
title: "Admin Login | HARBOURSIDE519",
error: "Please enter both email and password.",
});
}

try {
const admin = await authService.validateCredentials(email, password);
req.session.admin_logged_in = true;
req.session.admin_id = admin.id;
req.session.admin_email = admin.email;
return res.redirect("/dashboard");
} catch (err) {
if (err.isOperational && err.statusCode === 401) {
return res.render("login", {
title: "Admin Login | HARBOURSIDE519",
error: err.message,
});
}
throw err;
}
});
export const handleLogout = (req, res) => {
req.session.destroy();
res.redirect("/");
};
import _ as rateService from "../services/rate.service.js";
import _ as icalService from "../services/ical.service.js";
import Setting from "../models/Setting.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { calculateDynamicRates } from "../utils/rateCalculator.js";

// Helper to get or create the settings row
const getSettingsInstance = async () => {
let setting = await Setting.findByPk(1);
if (!setting) setting = await Setting.create({ id: 1 });
return setting;
};

export const showDashboard = asyncHandler(async (req, res) => {
try {
const rates = await rateService.getAllRates();
const processedRates = rates.map(calculateDynamicRates);

    const icalUrl = await icalService.getIcalUrl();
    let calendarData = { bookedDates: [], startDates: [], endDates: [] };

    try {
      if (icalUrl) calendarData = await icalService.syncIcalEvents();
    } catch (err) {
      console.error("Calendar sync failed:", err.message);
    }

    const settings = await getSettingsInstance();

    res.render("dashboard", {
      username: req.session.admin_email,
      rates: processedRates,
      icalUrl,
      calendarData,
      settings,
    });

} catch (err) {
console.error(err);
res.render("dashboard", {
username: req.session.admin_email,
rates: [],
icalUrl: "",
calendarData: { bookedDates: [], startDates: [], endDates: [] },
settings: {},
});
}
});

export const saveRate = asyncHandler(async (req, res) => {
const {
id,
season_name,
start_date,
end_date,
nightly_price,
weekend_price,
min_stay,
} = req.body;

const weekend_days = req.body.weekend_days
? Array.isArray(req.body.weekend_days)
? req.body.weekend_days.join(",")
: req.body.weekend_days
: "Fri,Sat";

await rateService.upsertRate({
id: id || null,
seasonName: season_name,
startDate: start_date === "" ? null : start_date,
endDate: end_date === "" ? null : end_date,
nightlyPrice: nightly_price,
weekendPrice: weekend_price,
weekendDays: weekend_days,
minStay: min_stay || 1,
});

res.redirect("/dashboard");
});

export const deleteRate = asyncHandler(async (req, res) => {
const { id } = req.body;
await rateService.deleteRate(id);
res.redirect("/dashboard");
});

export const saveIcalUrl = asyncHandler(async (req, res) => {
const { ical_url } = req.body;
await icalService.updateIcalUrl(ical_url);
res.redirect("/dashboard");
});

export const syncCalendar = asyncHandler(async (req, res) => {
const data = await icalService.syncIcalEvents();
res.json({ success: true, data });
});

// --- TAXES & POLICIES ---

export const saveTaxes = asyncHandler(async (req, res) => {
const settings = await getSettingsInstance();

settings.extraGuestTaxable = req.body.extra_guest_taxable === "on";
settings.cleaningFeeTaxable = req.body.cleaning_fee_taxable === "on";
settings.petFeeTaxable = req.body.pet_fee_taxable === "on";

settings.extraGuestFeeType =
req.body.extra_guest_fee_type || "Per Guest Per Night";
settings.extraGuestFee = parseFloat(req.body.extra_guest_fee) || 0;
settings.extraGuestThreshold = parseInt(req.body.extra_guest_threshold) || 2;

settings.cleaningFeeType = req.body.cleaning_fee_type || "Per Stay";
settings.cleaningFee = parseFloat(req.body.cleaning_fee) || 0;

settings.petFeeType = req.body.pet_fee_type || "Per Stay";
settings.petFee = parseFloat(req.body.pet_fee) || 0;

settings.damageDeposit = parseFloat(req.body.damage_deposit) || 0;
settings.propertyTaxRate = parseFloat(req.body.property_tax_rate) || 13.25;

await settings.save();
res.redirect("/dashboard");
});

export const savePolicies = asyncHandler(async (req, res) => {
const settings = await getSettingsInstance();
settings.rentalNotes = req.body.rental_notes || null;
settings.cancellationPolicy = req.body.cancellation_policy || null;
await settings.save();
res.redirect("/dashboard");
});
import \* as quoteService from "../services/quote.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const getQuote = asyncHandler(async (req, res) => {
const { checkIn, checkOut, guests, pets } = req.body;

if (!checkIn || !checkOut) {
return res
.status(400)
.json({
success: false,
error: "Check-in and Check-out dates are required.",
});
}

const quote = await quoteService.calculateQuote(
checkIn,
checkOut,
guests || 1,
pets || 0,
);

res.json({ success: true, quote });
});
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
process.env.DB_NAME,
process.env.DB_USER,
process.env.DB_PASSWORD,
{
host: process.env.DB_HOST,
port: parseInt(process.env.DB_PORT, 10) || 3306,
dialect: "mysql",
logging: false,
pool: {
max: 10,
min: 0,
acquire: 30000,
idle: 10000,
},
},
);

export default sequelize;
import mysql from "mysql2/promise";

const pool = mysql.createPool({
host: "localhost",
user: "root",
password: "Ankit@1234",
database: "auqualco_harbour519",
waitForConnections: true,
connectionLimit: 10,
queueLimit: 0,
});

export default pool;
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
const calendarData = window.**CALENDAR_DATA** || {
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
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Barlow:wght@700&display=swap");

- {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Roboto", sans-serif;
  }
  body {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #fff;
  }

/_ Shared Components _/
.btn {
padding: 12px 24px;
border-radius: 6px;
font-weight: 700;
font-size: 14px;
cursor: pointer;
border: none;
transition: 0.3s;
text-decoration: none;
display: inline-block;
}
.btn-primary {
background: #ef4444;
color: #fff;
}
.btn-primary:hover {
background: #dc2626;
transform: translateY(-2px);
}
.btn-secondary {
background: rgba(255, 255, 255, 0.1);
color: #fff;
border: 1px solid rgba(255, 255, 255, 0.2);
}
.btn-secondary:hover {
background: rgba(255, 255, 255, 0.2);
}

.form-control {
width: 100%;
padding: 12px;
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 6px;
color: #fff;
font-size: 14px;
outline: none;
transition: 0.3s;
}
.form-control:focus {
border-color: #ef4444;
background: rgba(255, 255, 255, 0.1);
}
body {
display: flex;
align-items: center;
justify-content: center;
padding: 20px;
overflow: hidden;
}
.login-card {
width: 100%;
max-width: 400px;
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 16px;
padding: 40px;
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
animation: fadeIn 0.8s ease-out;
}
@keyframes fadeIn {
from {
opacity: 0;
transform: translateY(20px);
}
to {
opacity: 1;
transform: translateY(0);
}
}
.logo-section {
text-align: center;
margin-bottom: 30px;
}
.logo-section h1 {
color: #fff;
font-family: "Barlow", sans-serif;
font-size: 28px;
text-transform: uppercase;
letter-spacing: 2px;
}

.form-group {
margin-bottom: 20px;
position: relative;
}
.form-group i {
position: absolute;
left: 15px;
top: 50%;
transform: translateY(-50%);
color: rgba(255, 255, 255, 0.4);
}
.form-group input {
padding: 15px 15px 15px 45px;
} /_ Override base form-control padding _/

.error-msg {
background: rgba(239, 68, 68, 0.1);
color: #f87171;
padding: 12px;
border-radius: 8px;
margin-bottom: 20px;
font-size: 14px;
text-align: center;
border: 1px solid rgba(239, 68, 68, 0.2);
}
.btn-login {
width: 100%;
padding: 15px;
background: #ef4444;
color: #fff;
border: none;
border-radius: 8px;
font-size: 16px;
font-weight: 700;
text-transform: uppercase;
cursor: pointer;
transition: 0.3s;
margin-top: 10px;
}
.btn-login:hover {
background: #dc2626;
transform: translateY(-2px);
box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.4);
}
.footer-text {
text-align: center;
margin-top: 25px;
color: rgba(255, 255, 255, 0.4);
font-size: 13px;
}
body {
padding: 20px;
}
.dashboard-header {
display: flex;
justify-content: space-between;
align-items: center;
max-width: 1200px;
margin: 0 auto 30px auto;
padding-bottom: 20px;
border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.dashboard-header h1 {
font-family: "Barlow", sans-serif;
font-size: 24px;
text-transform: uppercase;
letter-spacing: 2px;
}
.user-info {
display: flex;
align-items: center;
gap: 20px;
}
.user-info span {
color: rgba(255, 255, 255, 0.7);
font-size: 14px;
}
.btn-logout {
background: rgba(239, 68, 68, 0.2);
color: #f87171;
border: 1px solid rgba(239, 68, 68, 0.3);
padding: 8px 16px;
border-radius: 6px;
text-decoration: none;
font-size: 13px;
font-weight: 700;
transition: 0.3s;
}
.btn-logout:hover {
background: #ef4444;
color: #fff;
}

.main-container {
max-width: 1200px;
margin: 0 auto;
}
.card {
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 16px;
padding: 40px;
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
animation: fadeIn 0.8s ease-out;
}
@keyframes fadeIn {
from {
opacity: 0;
transform: translateY(10px);
}
to {
opacity: 1;
transform: translateY(0);
}
}

.tab-navigation {
display: flex;
gap: 20px;
margin-bottom: 30px;
border-bottom: 2px solid rgba(255, 255, 255, 0.1);
padding-bottom: 0;
}
.tab-btn {
background: none;
border: none;
color: rgba(255, 255, 255, 0.5);
font-size: 16px;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 1px;
cursor: pointer;
padding: 12px 5px;
position: relative;
transition: color 0.3s;
}
.tab-btn:hover {
color: rgba(255, 255, 255, 0.8);
}
.tab-btn.active {
color: #ef4444;
}
.tab-btn.active::after {
content: "";
position: absolute;
bottom: -2px;
left: 0;
width: 100%;
height: 2px;
background-color: #ef4444;
}
.tab-content {
display: none;
}
.tab-content.active {
display: block;
animation: fadeIn 0.5s ease-out;
}

.content-title {
font-family: "Barlow", sans-serif;
font-size: 22px;
margin-bottom: 10px;
color: #fff;
border-left: 4px solid #ef4444;
padding-left: 15px;
}
.text-muted {
color: rgba(255, 255, 255, 0.5);
font-size: 13px;
margin-bottom: 30px;
display: block;
}
.note-box {
background: rgba(239, 68, 68, 0.1);
border: 1px solid rgba(239, 68, 68, 0.2);
border-radius: 8px;
padding: 15px;
margin-bottom: 30px;
font-size: 13px;
color: #f87171;
line-height: 1.6;
}

.form-grid {
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 20px;
margin-bottom: 30px;
}
.form-group {
margin-bottom: 20px;
}
.form-group label {
display: block;
font-size: 12px;
color: rgba(255, 255, 255, 0.6);
font-weight: 700;
text-transform: uppercase;
margin-bottom: 8px;
letter-spacing: 0.5px;
}
.checkbox-group {
display: flex;
gap: 15px;
flex-wrap: wrap;
margin-top: 8px;
}
.checkbox-label {
display: flex;
align-items: center;
gap: 6px;
font-size: 13px;
color: rgba(255, 255, 255, 0.7);
cursor: pointer;
}
.checkbox-label input {
accent-color: #ef4444;
}

.btn-icon {
width: 35px;
height: 35px;
border-radius: 50%;
display: inline-flex;
align-items: center;
justify-content: center;
border: none;
cursor: pointer;
transition: 0.3s;
}
.btn-edit {
background: rgba(59, 130, 246, 0.2);
color: #60a5fa;
}
.btn-edit:hover {
background: #3b82f6;
color: #fff;
}
.btn-delete {
background: rgba(239, 68, 68, 0.2);
color: #f87171;
}
.btn-delete:hover {
background: #ef4444;
color: #fff;
}

.rates-table {
width: 100%;
border-collapse: collapse;
margin-top: 40px;
}
.rates-table th {
text-align: left;
color: rgba(255, 255, 255, 0.5);
font-size: 11px;
text-transform: uppercase;
letter-spacing: 1px;
padding: 15px 10px;
border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.rates-table td {
padding: 15px 10px;
border-bottom: 1px solid rgba(255, 255, 255, 0.05);
font-size: 14px;
}
.rates-table tr:hover {
background: rgba(255, 255, 255, 0.02);
}

.ical-form {
display: flex;
gap: 10px;
align-items: center;
margin-bottom: 30px;
}
.calendar-controls {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 20px;
}
.calendar-controls h3 {
margin: 0;
color: #fff;
}

/_ --- TWO MONTH CALENDAR LAYOUT --- _/
.calendar-wrapper {
display: flex;
gap: 20px;
flex-wrap: wrap; /_ Stacks on smaller screens _/
}

.cal-month-container {
flex: 1;
min-width: 280px; /_ Prevents squishing _/
background: #fff;
color: #333;
border-radius: 8px;
padding: 20px;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.cal-month-title {
text-align: center;
font-weight: bold;
font-size: 16px;
margin-bottom: 15px;
color: #1e293b;
}
/_ ---------------------------------- _/

.cal-row {
display: grid;
grid-template-columns: repeat(7, 1fr);
text-align: center;
}
.cal-head {
font-weight: bold;
padding: 10px;
border-bottom: 2px solid #eee;
color: #555;
font-size: 12px;
text-transform: uppercase;
}
.cal-day {
padding: 15px 5px;
border: 1px solid #f1f1f1;
position: relative;
font-size: 14px;
background: #fff;
transition: 0.2s;
}
.cal-day.empty {
background: #fafafa;
border-color: transparent;
}
.cal-day.is-start {
background: linear-gradient(135deg, #fff 50%, #ef4444 50%);
color: #ef4444;
font-weight: bold;
}
.cal-day.is-end {
background: linear-gradient(135deg, #10b981 50%, #fff 50%);
color: #10b981;
font-weight: bold;
}
.cal-day.is-booked {
background: #ef4444;
color: #fff;
font-weight: bold;
}
.cal-day.is-start.is-end {
background: #f97316;
color: #fff;
}
.cal-day.today {
box-shadow: inset 0 0 0 2px #3b82f6;
border-radius: 4px;
}

.calendar-legend {
display: flex;
gap: 20px;
margin-top: 20px;
justify-content: center;
flex-wrap: wrap;
}
.legend-item {
display: flex;
align-items: center;
gap: 8px;
font-size: 12px;
color: rgba(255, 255, 255, 0.6);
}
.legend-box {
width: 20px;
height: 20px;
border-radius: 4px;
border: 1px solid rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
.form-grid {
grid-template-columns: 1fr;
}
.ical-form {
flex-direction: column;
}
}
please hold the context its my backend with ejs code
