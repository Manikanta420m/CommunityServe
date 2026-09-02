const mongoose = require("mongoose");
const Issue = require("../models/Issue");
const IssueFeedback = require("../models/IssueFeedback");
const Notification = require("../models/Notification");

const getFeedback = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.issueId)) return res.status(400).json({ message: "Invalid issue id" });
    const feedback = await IssueFeedback.findOne({ issue: req.params.issueId })
      .populate("createdBy", "name email");
    res.status(200).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveFeedback = async (req, res) => {
  try {
    const { issueId } = req.params;
    if (!mongoose.isValidObjectId(issueId)) return res.status(400).json({ message: "Invalid issue id" });

    const issue = await Issue.findById(issueId).select("title status createdBy assignedTo");
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    if (issue.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the issue reporter can submit feedback" });
    }
    if (!["Resolved", "Closed"].includes(issue.status)) {
      return res.status(400).json({ message: "Feedback is available after an issue is resolved" });
    }

    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be an integer from 1 to 5" });
    }

    const comment = typeof req.body.comment === "string" ? req.body.comment.trim().slice(0, 1000) : "";
    const reopenRequested = Boolean(req.body.reopenRequested);
    const reopenReason = typeof req.body.reopenReason === "string" ? req.body.reopenReason.trim().slice(0, 1000) : "";

    if (reopenRequested && !reopenReason) {
      return res.status(400).json({ message: "Please provide a reason for the reopen request" });
    }

    const feedback = await IssueFeedback.findOneAndUpdate(
      { issue: issue._id },
      { rating, comment, reopenRequested, reopenReason, createdBy: req.user._id, issue: issue._id },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    ).populate("createdBy", "name email");

    if (reopenRequested) {
      await Notification.create({
        recipient: issue.assignedTo || issue.createdBy,
        issue: issue._id,
        type: "system",
        title: "Reopen requested",
        message: `The reporter requested a review of “${issue.title}”: ${reopenReason}`,
      });
    }

    res.status(200).json(feedback);
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getFeedback, saveFeedback };
