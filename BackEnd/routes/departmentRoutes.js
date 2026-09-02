const express = require("express");
const {
  getPublicDepartments,
  getDepartments,
  createDepartment,
} = require("../controllers/departmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/public", getPublicDepartments);
router.get("/", protect, getDepartments);
router.post("/", protect, authorize("admin"), createDepartment);

module.exports = router;
