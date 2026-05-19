const { Router } = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const dashboardController = require("../controllers/dashboard.controller");

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

module.exports = router;
