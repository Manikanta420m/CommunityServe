const mongoose = require("mongoose");
const Issue = require("../models/Issue");
const IssueStatusHistory = require("../models/IssueStatusHistory");

const getIssueStatusHistory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.issueId)) {
      return res.status(400).json({ message: "Invalid issue id" });
    }

    const exists = await Issue.exists({ _id: req.params.issueId });
    if (!exists) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const history = await IssueStatusHistory.find({ issue: req.params.issueId })
      .populate("changedBy", "name email role")
      .sort({ createdAt: 1 });

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getIssueStatusHistory };
