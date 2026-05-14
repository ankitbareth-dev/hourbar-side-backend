import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import { authRoutes, dashboardRoutes, apiRoutes } from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();

// ── View Engine ─────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", "./src/views");

// ── Body Parsing ────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));

// ── Session ─────────────────────────────────────────────────
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

// ── Global Error Handler (must be last) ────────────────────
app.use(errorHandler);

export default app;
