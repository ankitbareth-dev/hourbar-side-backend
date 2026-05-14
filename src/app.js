import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";

import { authRoutes, dashboardRoutes, apiRoutes } from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();

app.use(cors());

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

app.use(notFound);

app.use(errorHandler);

export default app;
