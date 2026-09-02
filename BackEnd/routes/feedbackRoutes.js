const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getFeedback, saveFeedback } = require("../controllers/feedbackController");

const router = express.Router();

router.use(protect);
router.get("/:issueId", getFeedback);
router.put("/:issueId", saveFeedback);

module.exports = router;
