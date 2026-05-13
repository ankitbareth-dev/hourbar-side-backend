import express from "express";
import session from "express-session";
import pool from "./config/db.js";

const app = express();

app.set("view engine", "ejs");
app.set("views", "./src/views");

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "harbourside-super-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  }),
);

app.get("/", (req, res) => {
  if (req.session.admin_logged_in) {
    return res.redirect("/dashboard");
  }
  res.render("login", { error: "" });
});

app.post("/", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render("login", {
      error: "Please enter both username and password.",
    });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM admin WHERE username = ? LIMIT 1",
      [username],
    );
    const admin = rows[0];

    if (admin && admin.password === password) {
      req.session.admin_logged_in = true;
      req.session.admin_id = admin.id;
      req.session.admin_username = admin.username;
      return res.redirect("/dashboard");
    } else {
      return res.render("login", { error: "Invalid username or password." });
    }
  } catch (err) {
    console.error(err);
    return res.render("login", { error: "Database connection error." });
  }
});

app.get("/dashboard", (req, res) => {
  if (!req.session.admin_logged_in) {
    return res.redirect("/");
  }
  res.render("dashboard", { username: req.session.admin_username });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

export default app;
