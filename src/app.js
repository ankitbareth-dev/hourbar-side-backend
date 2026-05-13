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

app.get("/dashboard", async (req, res) => {
  if (!req.session.admin_logged_in) {
    return res.redirect("/");
  }

  try {
    const [properties] = await pool.execute(
      "SELECT * FROM property_prices LIMIT 1",
    );
    const property = properties[0];
    let rates = [];

    if (property) {
      [rates] = await pool.execute(
        "SELECT * FROM seasonal_rates WHERE property_id = ? ORDER BY (season_name = 'Standard') DESC, start_date ASC",
        [property.id],
      );
    }

    res.render("dashboard", {
      username: req.session.admin_username,
      property: property,
      rates: rates,
    });
  } catch (err) {
    console.error(err);
    res.render("dashboard", {
      username: req.session.admin_username,
      property: null,
      rates: [],
    });
  }
});

app.post("/rate/save", async (req, res) => {
  if (!req.session.admin_logged_in) return res.redirect("/");

  const {
    id,
    property_id,
    season_name,
    start_date,
    end_date,
    nightly_price,
    weekend_price,
    min_stay,
    weekly_discount,
    monthly_discount,
  } = req.body;
  const weekend_days = req.body.weekend_days
    ? Array.isArray(req.body.weekend_days)
      ? req.body.weekend_days.join(",")
      : req.body.weekend_days
    : "Fri,Sat";
  const startDateSQL = start_date === "" ? null : start_date;
  const endDateSQL = end_date === "" ? null : end_date;

  try {
    if (id) {
      await pool.execute(
        `UPDATE seasonal_rates SET season_name=?, start_date=?, end_date=?, nightly_price=?, weekend_price=?, weekend_days=?, min_stay=?, weekly_discount=?, monthly_discount=? WHERE id=? AND property_id=?`,
        [
          season_name,
          startDateSQL,
          endDateSQL,
          nightly_price,
          weekend_price,
          weekend_days,
          min_stay || 1,
          weekly_discount || 0,
          monthly_discount || 0,
          id,
          property_id,
        ],
      );
    } else {
      await pool.execute(
        `INSERT INTO seasonal_rates (property_id, season_name, start_date, end_date, nightly_price, weekend_price, weekend_days, min_stay, weekly_discount, monthly_discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          property_id,
          season_name,
          startDateSQL,
          endDateSQL,
          nightly_price,
          weekend_price,
          weekend_days,
          min_stay || 1,
          weekly_discount || 0,
          monthly_discount || 0,
        ],
      );
    }
  } catch (err) {
    console.error("Error saving rate:", err);
  }
  res.redirect("/dashboard");
});

app.post("/rate/delete", async (req, res) => {
  if (!req.session.admin_logged_in) return res.redirect("/");
  const { id } = req.body;
  try {
    await pool.execute("DELETE FROM seasonal_rates WHERE id = ?", [id]);
  } catch (err) {
    console.error("Error deleting rate:", err);
  }
  res.redirect("/dashboard");
});

app.get("/api/rates/:propertyName", async (req, res) => {
  if (!req.session.admin_logged_in) {
    return res
      .status(403)
      .json({ error: "Unauthorized. Please log in via the browser first." });
  }

  const { propertyName } = req.params;

  try {
    const [propRows] = await pool.execute(
      "SELECT * FROM property_prices WHERE property_name = ? LIMIT 1",
      [propertyName],
    );
    const property = propRows[0];

    if (!property) {
      return res
        .status(404)
        .json({ error: `Property '${propertyName}' not found in database` });
    }

    const [rates] = await pool.execute(
      "SELECT * FROM seasonal_rates WHERE property_id = ? ORDER BY (season_name = 'Standard') DESC, start_date ASC",
      [property.id],
    );

    res.json({
      success: true,
      property: {
        id: property.id,
        name: property.property_name,
        cleaning_fee: parseFloat(property.cleaning_fee),
        pet_fee: parseFloat(property.pet_fee),
        tax_rate_percent: parseFloat(property.property_tax_rate),
        cleaning_fee_taxable: property.cleaning_fee_taxable === 1,
        pet_fee_taxable: property.pet_fee_taxable === 1,
      },
      seasonal_rates: rates.map((r) => ({
        id: r.id,
        season_name: r.season_name,
        start_date: r.start_date,
        end_date: r.end_date,
        nightly_price: parseFloat(r.nightly_price),
        weekend_price: parseFloat(r.weekend_price),
        min_stay: r.min_stay,
        weekly_discount_percent: parseFloat(r.weekly_discount),
        weekend_days: r.weekend_days,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.get("/api/fix-bad-rates", async (req, res) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM seasonal_rates WHERE season_name = ?",
      ["swwq"],
    );

    res.json({
      success: true,
      message: `Deleted ${result.affectedRows} bad test rates. Your database is clean now!`,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to clean database", details: err.message });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

export default app;
