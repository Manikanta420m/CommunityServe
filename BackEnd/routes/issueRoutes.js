const express = require("express");

const {
  createIssue,
  getIssues,
  getMyIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  voteIssue,
} = require("../controllers/issueController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(getIssues).post(protect, createIssue);
router.get("/mine", protect, getMyIssues);
router.get("/:id", getIssueById);
router.put("/:id", protect, updateIssue);
router.delete("/:id", protect, deleteIssue);
router.put("/:id/vote", protect, voteIssue);

module.exports = router;
