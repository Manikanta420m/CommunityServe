const express = require("express");
const { getDepartments, createDepartment } = require("../controllers/departmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", getDepartments);
router.post("/", authorize("admin"), createDepartment);

module.exports = router;
