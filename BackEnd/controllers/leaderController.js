const Issue = require("../models/Issue");
const User = require("../models/user");
const IssueFeedback = require("../models/IssueFeedback");
const IssueStatusHistory = require("../models/IssueStatusHistory");
const Notification = require("../models/Notification");

const STATUS_VALUES = ["Pending", "Under Review", "In Progress", "Resolved", "Closed"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const ESCALATION_LEVELS = ["Normal", "Watch", "Escalated"];

const departmentFilter = (req) => ({ department: req.user.department });

const enrichIssues = (issues) => {
  const now = Date.now();
  return issues.map((issue) => {
    const data = issue.toObject({ virtuals: true });
    data.isOverdue = Boolean(issue.targetDate && issue.targetDate.getTime() < now && !["Resolved", "Closed"].includes(issue.status));
    data.daysUntilTarget = issue.targetDate
      ? Math.ceil((issue.targetDate.getTime() - now) / 86400000)
      : null;
    return data;
  });
};

const getLeaderOverview = async (req, res) => {
  try {
    const filter = departmentFilter(req);
    const [issues, authorities, reopenRequests] = await Promise.all([
      Issue.find(filter).select("title status priority targetDate assignedTo createdAt leaderReview escalationLevel")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 }),
      User.find({ role: "authority", isActive: true, department: req.user.department })
        .select("name email createdAt")
        .sort({ name: 1 }),
      IssueFeedback.find({ reopenRequested: true })
        .populate({ path: "issue", match: filter, select: "_id title status priority assignedTo" }),
    ]);

    const activeIssues = issues.filter((issue) => !["Resolved", "Closed"].includes(issue.status));
    const overdueIssues = activeIssues.filter((issue) => issue.targetDate && issue.targetDate.getTime() < Date.now());
    const criticalIssues = activeIssues.filter((issue) => issue.priority === "Critical");
    const resolvedIssues = issues.filter((issue) => ["Resolved", "Closed"].includes(issue.status));

    const workload = authorities.map((authority) => {
      const assigned = issues.filter((issue) => issue.assignedTo?._id?.toString() === authority._id.toString());
      return {
        id: authority._id,
        name: authority.name,
        email: authority.email,
        open: assigned.filter((issue) => !["Resolved", "Closed"].includes(issue.status)).length,
        overdue: assigned.filter((issue) => issue.targetDate && issue.targetDate.getTime() < Date.now() && !["Resolved", "Closed"].includes(issue.status)).length,
        resolved: assigned.filter((issue) => ["Resolved", "Closed"].includes(issue.status)).length,
      };
    });

    res.status(200).json({
      department: req.user.department,
      metrics: {
        total: issues.length,
        pending: issues.filter((issue) => issue.status === "Pending").length,
        underReview: issues.filter((issue) => issue.status === "Under Review").length,
        inProgress: issues.filter((issue) => issue.status === "In Progress").length,
        resolved: resolvedIssues.length,
        overdue: overdueIssues.length,
        critical: criticalIssues.length,
        unassigned: activeIssues.filter((issue) => !issue.assignedTo).length,
        reopenRequests: reopenRequests.filter((item) => item.issue).length,
        resolutionRate: issues.length ? Math.round((resolvedIssues.length / issues.length) * 100) : 0,
      },
      workload,
      attention: enrichIssues(issues.filter((issue) =>
        (!issue.assignedTo && !["Resolved", "Closed"].includes(issue.status)) ||
        (issue.targetDate && issue.targetDate.getTime() < Date.now() && !["Resolved", "Closed"].includes(issue.status)) ||
        issue.priority === "Critical" ||
        issue.leaderReview?.escalationLevel === "Escalated"
      ).slice(0, 12)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLeaderIssues = async (req, res) => {
  try {
    const { status, priority, escalation, overdue, unassigned, search } = req.query;
    const filter = departmentFilter(req);

    if (STATUS_VALUES.includes(status)) filter.status = status;
    if (PRIORITIES.includes(priority)) filter.priority = priority;
    if (ESCALATION_LEVELS.includes(escalation)) filter["leaderReview.escalationLevel"] = escalation;
    if (overdue === "true") {
      filter.targetDate = { $lt: new Date() };
      filter.status = { $nin: ["Resolved", "Closed"] };
    }
    if (unassigned === "true") filter.assignedTo = null;

    if (search?.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: safe, $options: "i" } },
        { description: { $regex: safe, $options: "i" } },
        { location: { $regex: safe, $options: "i" } },
      ];
    }

    const issues = await Issue.find(filter)
      .populate("createdBy", "name email")
      .populate("department", "name code")
      .populate("assignedTo", "name email role")
      .populate("leaderReview.reviewedBy", "name role")
      .sort({ priority: -1, targetDate: 1, createdAt: -1 })
      .limit(200);

    res.status(200).json(enrichIssues(issues));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLeaderTeam = async (req, res) => {
  try {
    const authorities = await User.find({
      role: "authority",
      isActive: true,
      department: req.user.department,
    }).select("name email department").populate("department", "name code").sort({ name: 1 });
    res.status(200).json(authorities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLeaderIssue = async (req, res) => {
  try {
    const issue = await Issue.findOne({ _id: req.params.id, department: req.user.department });
    if (!issue) return res.status(404).json({ message: "Department issue not found" });

    const { status, priority, assignedTo, targetDate, note, escalationLevel, escalationReason } = req.body;
    const previousStatus = issue.status;
    const previousAssignee = issue.assignedTo?.toString() || null;

    if (status !== undefined && !STATUS_VALUES.includes(status)) return res.status(400).json({ message: "Invalid issue status" });
    if (priority !== undefined && !PRIORITIES.includes(priority)) return res.status(400).json({ message: "Invalid issue priority" });
    if (escalationLevel !== undefined && !ESCALATION_LEVELS.includes(escalationLevel)) return res.status(400).json({ message: "Invalid escalation level" });

    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === "") {
        issue.assignedTo = null;
      } else {
        const authority = await User.findOne({
          _id: assignedTo,
          role: "authority",
          isActive: true,
          department: req.user.department,
        }).select("_id");
        if (!authority) return res.status(400).json({ message: "Authority must be active and belong to this department" });
        issue.assignedTo = authority._id;
      }
    }

    if (targetDate !== undefined) {
      if (!targetDate) {
        issue.targetDate = null;
      } else {
        const parsedDate = new Date(targetDate);
        if (Number.isNaN(parsedDate.getTime())) return res.status(400).json({ message: "Invalid target date" });
        issue.targetDate = parsedDate;
      }
    }

    if (status !== undefined) issue.status = status;
    if (priority !== undefined) issue.priority = priority;

    const reviewNote = typeof note === "string" ? note.trim().slice(0, 1000) : "";
    issue.leaderReview = {
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      note: reviewNote || issue.leaderReview?.note || "",
      escalationLevel: escalationLevel || issue.leaderReview?.escalationLevel || "Normal",
      escalationReason: typeof escalationReason === "string" ? escalationReason.trim().slice(0, 500) : (issue.leaderReview?.escalationReason || ""),
    };

    await issue.save();

    const historyNoteParts = [];
    if (status && status !== previousStatus) historyNoteParts.push(`Status: ${previousStatus} → ${status}`);
    if (priority) historyNoteParts.push(`Priority: ${priority}`);
    if (assignedTo !== undefined) historyNoteParts.push(assignedTo ? "Authority assigned" : "Authority unassigned");
    if (issue.leaderReview.escalationLevel !== "Normal") historyNoteParts.push(`${issue.leaderReview.escalationLevel} escalation`);
    if (reviewNote) historyNoteParts.push(reviewNote);

    if (historyNoteParts.length) {
      await IssueStatusHistory.create({
        issue: issue._id,
        status: issue.status,
        note: historyNoteParts.join(" | ").slice(0, 1000),
        changedBy: req.user._id,
      });
    }

    const notifications = [];
    if (status && status !== previousStatus) {
      notifications.push({
        recipient: issue.createdBy,
        issue: issue._id,
        type: "status_changed",
        title: "Issue reviewed by department leader",
        message: `Your issue “${issue.title}” is now ${status}.`,
      });
    }
    if (assignedTo !== undefined && issue.assignedTo?.toString() !== previousAssignee) {
      if (issue.assignedTo) {
        notifications.push({
          recipient: issue.assignedTo,
          issue: issue._id,
          type: "system",
          title: "New issue assigned by leader",
          message: `You have been assigned “${issue.title}” by your department leader.`,
        });
      }
      notifications.push({
        recipient: issue.createdBy,
        issue: issue._id,
        type: "system",
        title: "Issue ownership updated",
        message: issue.assignedTo ? "A department authority is now responsible for your issue." : "Your issue is awaiting authority assignment.",
      });
    }
    if (issue.leaderReview.escalationLevel === "Escalated") {
      notifications.push({
        recipient: issue.createdBy,
        issue: issue._id,
        type: "system",
        title: "Issue escalated",
        message: "A department leader has escalated your issue for additional attention.",
      });
    }
    if (notifications.length) await Notification.insertMany(notifications);

    const populated = await issue.populate([
      { path: "createdBy", select: "name email" },
      { path: "department", select: "name code" },
      { path: "assignedTo", select: "name email role" },
      { path: "leaderReview.reviewedBy", select: "name role" },
    ]);

    res.status(200).json(populated.toObject({ virtuals: true }));
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLeaderOverview,
  getLeaderIssues,
  getLeaderTeam,
  updateLeaderIssue,
};
