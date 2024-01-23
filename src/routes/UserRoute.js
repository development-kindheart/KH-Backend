const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const upload = require("../middleware/uploadMulter");
const {
  registerStore,
  registerFoundation,
  login,
  forgotPassword,
  resetPassword,
  userDetails,
  refresh,
  pauseUser,
} = require("../controllers/UserController");
const validateRequiredFields = require("../middleware/validateFields");
// const requiredFields = ["username", "email", "password"];
const router = express.Router();

router.post(
  "/registerStore",
  upload.single("logo"),
  validateRequiredFields([
    "storeName",
    "website",
    "phoneNumber",
    "address",
    "city",
    "username",
    "email",
    "password",
  ]),
  registerStore
);
router.post(
  "/registerFoundation",
  upload.single("logo"),
  validateRequiredFields([
    "govtIssuedFoundationId",
    "username",
    "websiteUrl",
    "foundationName",
    "phoneNumber",
    "address",
    "city",
    "email",
    "password",
  ]),
  registerFoundation
);
router.post("/login", validateRequiredFields(["email", "password"]), login);
router.post(
  "/forgotPassword",
  validateRequiredFields(["email"]),
  forgotPassword
);

router.post(
  "/resetPassword",
  validateRequiredFields(["password"]),
  resetPassword
);
router.get("/details/:id", requireAuth, userDetails);
router.post('/refresh', refresh)
module.exports = router;
