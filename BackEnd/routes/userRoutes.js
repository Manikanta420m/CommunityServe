const express = require("express");
const {
  getAssignableUsers,
  getUsers,
  updateUser,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("admin"));
router.get("/assignable", getAssignableUsers);
router.get("/", getUsers);
router.put("/:id", updateUser);

module.exports = router;
