const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getLeaderOverview,
  getLeaderIssues,
  getLeaderTeam,
  updateLeaderIssue,
} = require("../controllers/leaderController");

const router = express.Router();

router.use(protect, authorize("corporate_leader"));
router.get("/overview", getLeaderOverview);
router.get("/issues", getLeaderIssues);
router.get("/team", getLeaderTeam);
router.put("/issues/:id", updateLeaderIssue);

module.exports = router;
