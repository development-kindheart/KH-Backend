const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const {
  dashboardData,
  donationData,
  getDataWithFilter,
  getStoreDonations,
  getRegisterFoundations,
  getRegisterStores,
  getFoundationsDonations,
  updateUserStatus,
  activeRequest,
  findInactiveUsers,
  activeCheck,
} = require("../controllers/adminController");

router.get("/dashboard", requireAuth, dashboardData);
router.get("/donation", requireAuth, donationData);
router.get("/Donationfilter", requireAuth, getDataWithFilter);
router.get("/storeDonations", requireAuth, getStoreDonations);
router.get("/getRegisterFoundations", requireAuth, getRegisterFoundations);
router.get("/getRegisterStores", requireAuth, getRegisterStores);
router.get("/foundations", requireAuth, getFoundationsDonations);
router.put("/updateUserStatus", requireAuth, updateUserStatus);
router.put("/updateActiveStatus", requireAuth, activeRequest);
router.get("/activeRequests", requireAuth, findInactiveUsers);
router.get("/activeCheck/:id", requireAuth, activeCheck);

module.exports = router;
