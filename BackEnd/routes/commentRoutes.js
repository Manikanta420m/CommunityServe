const express = require("express");

const {
  getComments,
  createComment,
  deleteComment,
} = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:issueId", getComments);
router.post("/:issueId", protect, createComment);
router.delete("/:commentId", protect, deleteComment);

module.exports = router;
