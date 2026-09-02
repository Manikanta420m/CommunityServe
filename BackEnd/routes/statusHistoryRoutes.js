const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getIssueStatusHistory } = require("../controllers/statusHistoryController");

const router = express.Router();

router.get("/:issueId", protect, getIssueStatusHistory);

module.exports = router;
