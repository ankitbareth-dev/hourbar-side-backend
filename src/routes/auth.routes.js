const { Router } = require("express");
const authController = require("../controllers/auth.controller");

const router = Router();

router.get("/", authController.showLogin);
router.post("/", authController.handleLogin);
router.get("/logout", authController.handleLogout);

module.exports = router;
