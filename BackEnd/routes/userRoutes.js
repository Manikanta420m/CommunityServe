const express = require("express");
const { getAssignableUsers } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/assignable", protect, authorize("admin"), getAssignableUsers);

module.exports = router;
