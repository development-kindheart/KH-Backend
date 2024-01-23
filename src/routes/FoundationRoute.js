const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const upload = require("../middleware/uploadMulter");
const {
  donationToFundation,
  getFoundation,
  dashboardData,
  getProfile,
  getFoundationWeeklyData,
  updateProfile,
  getDataWithFilter,
  updatePaymentStatus,
  updateStatus,
} = require("../controllers/FoundationController");

router.post("/donation", donationToFundation);
router.get("/getFoundationWeeklyData", requireAuth, getFoundationWeeklyData);
router.get("/getFoundation", requireAuth, getFoundation);
router.get("/dashboard", requireAuth, dashboardData);
router.get("/getProfile/:id", requireAuth, getProfile);
router.get("/filter", requireAuth, getDataWithFilter);
router.put("/updateStatus", requireAuth, updateStatus);
router.put("/updatePaymentStatus", requireAuth, updatePaymentStatus);
router.post(
  "/updateProfile",
  upload.single("logo"),
  requireAuth,
  updateProfile
);
module.exports = router;
