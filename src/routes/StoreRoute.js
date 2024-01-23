const express = require("express");
const {
  getStore,
  getStoreWidgets,
  getAllDonationData,
  getDashboardData,
  getDonationData,
  getProfile,
  updateProfile,
  getDataWithFilter,
  findStoreWidget,
  getDashboardWeeklyData,
} = require("../controllers/StoreController");
const upload = require("../middleware/uploadMulter");

const validateRequiredFields = require("../middleware/validateFields");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");

router.get("/find/:id", requireAuth, getStore);
router.get("/widget", getStoreWidgets);
router.get("/getDashboardData", requireAuth, getDashboardData);
router.get("/getDashboardWeeklyData", getDashboardWeeklyData);
router.get("/getDonationData", requireAuth, getDonationData);
router.get("/getProfile/:id", requireAuth, getProfile);
router.get("/filter", requireAuth, getDataWithFilter);
router.get("/findWidget", requireAuth, findStoreWidget);
router.post(
  "/updateProfile",
  upload.single("logo"),
  requireAuth,
  updateProfile
);

module.exports = router;
