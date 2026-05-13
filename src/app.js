import express from "express";

const app = express();

app.set("view engine", "ejs");
app.set("views", "./src/views");

app.get("/", (req, res) => {
  res.render("login", { error: "" });
});

export default app;
