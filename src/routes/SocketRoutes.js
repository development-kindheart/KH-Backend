const {
  getUserContacts,
  getUserMessages,
  postUserMessage,
  updateMessageReadStatus,
  postRoom,
} = require("../controllers/SocketController");
const requireAuth = require("../middleware/requireAuth");

const router = require("express").Router();

// READ
router.get("/:userId/contacts", requireAuth, getUserContacts);
router.get("/:userId/messages", requireAuth, getUserMessages);

// CREATE
router.post("/:userId/message", requireAuth, postUserMessage);
router.post("/:userId/room", requireAuth, postRoom);

// UPDATE
router.put("/:userId/messages/status", requireAuth, updateMessageReadStatus);

module.exports = router;
