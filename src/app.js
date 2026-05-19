const express = require("express");
const session = require("express-session");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const {
  authRoutes,
  dashboardRoutes,
  apiRoutes,
  quoteRoutes,
} = require("./routes");
const { errorHandler, notFound } = require("./middlewares/errorHandler");

dotenv.config();

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

module.exports = app;
