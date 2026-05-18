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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());

app.use(express.static(path.join(__dirname, "../public")));

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
