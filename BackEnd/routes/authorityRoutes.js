const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { getAuthorityIssues, updateAuthorityIssue } = require("../controllers/authorityController");

const router = express.Router();

router.use(protect, authorize("authority"));
router.get("/issues", getAuthorityIssues);
router.put("/issues/:id", updateAuthorityIssue);

module.exports = router;
