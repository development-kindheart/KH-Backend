const express = require("express");
const {
  addWidget,
  editWidget,
  getWidgets,
  getWidget,
  delWidget,
  postAssignWidget,
  findWidgetAssignedStores,
  removeAssignWidget,
  editAssignWidget,
} = require("../controllers/WidgetController");
const upload = require("../middleware/uploadMulter");
const validateRequiredFields = require("../middleware/validateFields");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");

router.post(
  "/save",
  requireAuth,
  upload.single("logo"),
  validateRequiredFields(["title", "description"]),
  addWidget
);

router.put(
  "/edit/:id",
  requireAuth,
  upload.single("logo"),
  validateRequiredFields(["title", "description"]),
  editWidget
);

router.get("/findAll", requireAuth, getWidgets);

router.get("/find/:id", requireAuth, getWidget);

router.delete("/delete/:id", requireAuth, delWidget);

// XXXXXXXXXXXXX Assign widget to store Route XXXXXXXXXXXXXX
router.post(
  "/assign",
  requireAuth,
  validateRequiredFields(["storeId", "storeName", "widgetId"]),
  postAssignWidget
);

router.get("/findWidgetAssignedStores", requireAuth, findWidgetAssignedStores);

router.put(
  "/removeAssignWidget",
  requireAuth,
  validateRequiredFields(["storeId", "widgetId"]),
  removeAssignWidget
);

router.put(
  "/editAssignWidget",
  requireAuth,
  validateRequiredFields(["storeId", "widgetId"]),
  editAssignWidget
);

// editAssignWidget
module.exports = router;
