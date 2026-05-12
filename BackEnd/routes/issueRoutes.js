const express = require("express");

const {
  createIssue,
  getIssues,
  updateIssue,
  deleteIssue,
  voteIssue,
} = require("../controllers/issueController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createIssue);

router.get("/", getIssues);

router.put("/:id", protect, updateIssue);

router.delete("/:id", protect, deleteIssue);

router.put("/vote/:id", protect, voteIssue);

module.exports = router;