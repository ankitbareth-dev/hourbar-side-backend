import express from "express";
import session from "express-session";
import cors from "cors"; // <-- Import CORS
import dotenv from "dotenv";

import { authRoutes, dashboardRoutes, apiRoutes } from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();

// ── Enable CORS ─────────────────────────────────────────────
// Option A: Allow ALL websites to access your API
app.use(cors());

// Option B (Recommended for production): Allow ONLY your specific websites
// const allowedOrigins = ['https://yourmainwebsite.com', 'https://www.yourmainwebsite.com'];
// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin) return callback(null, true); // Allow Postman/Server-to-Server
//     if (allowedOrigins.indexOf(origin) === -1) {
//       const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
//       return callback(new Error(msg), false);
//     }
//     return callback(null, true);
//   }
// }));
// ─────────────────────────────────────────────────────────────

// ── View Engine ─────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", "./src/views");

// ── Body Parsing ────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Make sure JSON body parsing is enabled

// ── Session (Only applies to admin dashboard routes now) ────
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  }),
);

// ── Routes ──────────────────────────────────────────────────
app.use(authRoutes);
app.use(dashboardRoutes);
app.use(apiRoutes);

// ── 404 Catch‑all ──────────────────────────────────────────
app.use(notFound);

// ── Global Error Handler ────────────────────────────────────
app.use(errorHandler);

export default app;
