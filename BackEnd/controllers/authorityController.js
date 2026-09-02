const Issue = require("../models/Issue");
const IssueStatusHistory = require("../models/IssueStatusHistory");
const Notification = require("../models/Notification");

const STATUS_VALUES = ["Pending", "Under Review", "In Progress", "Resolved", "Closed"];

const getAuthorityIssues = async (req, res) => {
  try {
    const { status, overdue, search } = req.query;
    const filter = {
      assignedTo: req.user._id,
    };

    if (status && STATUS_VALUES.includes(status)) filter.status = status;
    if (search?.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { location: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (overdue === "true") {
      filter.targetDate = { $lt: new Date() };
      filter.status = { $nin: ["Resolved", "Closed"] };
    }

    const issues = await Issue.find(filter)
      .populate("createdBy", "name email")
      .populate("department", "name code")
      .populate("assignedTo", "name email role")
      .sort({ targetDate: 1, createdAt: -1 });

    const now = Date.now();
    const enriched = issues.map((issue) => {
      const data = issue.toObject({ virtuals: true });
      data.isOverdue = Boolean(issue.targetDate && issue.targetDate.getTime() < now && !["Resolved", "Closed"].includes(issue.status));
      data.daysUntilTarget = issue.targetDate
        ? Math.ceil((issue.targetDate.getTime() - now) / 86400000)
        : null;
      return data;
    });

    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAuthorityIssue = async (req, res) => {
  try {
    const issue = await Issue.findOne({ _id: req.params.id, assignedTo: req.user._id });
    if (!issue) return res.status(404).json({ message: "Assigned issue not found" });

    const { status, note, resolutionEvidence } = req.body;
    const previousStatus = issue.status;

    if (status !== undefined && !STATUS_VALUES.includes(status)) {
      return res.status(400).json({ message: "Invalid issue status" });
    }

    if (status !== undefined && status !== previousStatus) {
      issue.status = status;
      await IssueStatusHistory.create({
        issue: issue._id,
        status,
        note: typeof note === "string" ? note.trim().slice(0, 1000) : "",
        changedBy: req.user._id,
      });

      await Notification.create({
        recipient: issue.createdBy,
        issue: issue._id,
        type: "status_changed",
        title: "Issue progress updated",
        message: `Your issue “${issue.title}” is now ${status}.`,
      });
    }

    if (resolutionEvidence !== undefined) {
      if (!Array.isArray(resolutionEvidence) || resolutionEvidence.length > 5) {
        return res.status(400).json({ message: "A maximum of 5 resolution evidence images is allowed" });
      }
      issue.resolutionEvidence = resolutionEvidence.filter((url) => typeof url === "string" && url.trim()).slice(0, 5);
    }

    const updated = await issue.save();
    const populated = await updated.populate([
      { path: "createdBy", select: "name email" },
      { path: "department", select: "name code" },
      { path: "assignedTo", select: "name email role" },
    ]);

    res.status(200).json(populated);
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAuthorityIssues, updateAuthorityIssue };
