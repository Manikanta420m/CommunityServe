const mongoose = require("mongoose");
const Issue = require("../models/Issue");
const IssueStatusHistory = require("../models/IssueStatusHistory");
const Notification = require("../models/Notification");
const Department = require("../models/Department");
const User = require("../models/user");

const STATUS_VALUES = ["Pending", "Under Review", "In Progress", "Resolved", "Closed"];

const createIssue = async (req, res) => {
  try {
    const { title, description, category, location, priority, images = [], coordinates } = req.body;
    if (!title?.trim() || !description?.trim() || !category?.trim() || !location?.trim()) {
      return res.status(400).json({ message: "Title, description, category and location are required" });
    }
    if (!Array.isArray(images) || images.length > 5) {
      return res.status(400).json({ message: "A maximum of 5 evidence images is allowed" });
    }

    const issue = await Issue.create({
      title: title.trim(), description: description.trim(), category: category.trim(),
      location: location.trim(), priority,
      images: images.filter((url) => typeof url === "string" && url.trim()).slice(0, 5),
      coordinates: coordinates || undefined,
      createdBy: req.user._id,
    });

    await IssueStatusHistory.create({ issue: issue._id, status: issue.status, note: "Issue reported", changedBy: req.user._id });
    const populatedIssue = await issue.populate("createdBy", "name email");
    res.status(201).json(populatedIssue);
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

const buildIssueFilter = (query) => {
  const { status, category, priority, search, department } = query;
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (department && mongoose.isValidObjectId(department)) filter.department = department;
  if (search?.trim()) {
    const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { title: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } },
      { location: { $regex: safeSearch, $options: "i" } },
    ];
  }
  return filter;
};

const getIssues = async (req, res) => {
  try {
    const { sort = "newest" } = req.query;
    let issues = await Issue.find(buildIssueFilter(req.query))
      .populate("createdBy", "name email")
      .populate("department", "name code")
      .populate("assignedTo", "name email role");
    if (sort === "votes") issues.sort((a, b) => b.votes - a.votes);
    else if (sort === "oldest") issues.sort((a, b) => a.createdAt - b.createdAt);
    else issues.sort((a, b) => b.createdAt - a.createdAt);
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ ...buildIssueFilter(req.query), createdBy: req.user._id })
      .populate("createdBy", "name email")
      .populate("department", "name code")
      .populate("assignedTo", "name email role");
    issues.sort((a, b) => b.createdAt - a.createdAt);
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getIssueById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid issue id" });
    const issue = await Issue.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("department", "name code description")
      .populate("assignedTo", "name email role");
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    res.status(200).json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    const isOwner = issue.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "You cannot update this issue" });

    const { title, description, category, location, priority, status, images, coordinates, statusNote, department, assignedTo, targetDate } = req.body;
    if (isOwner && !isAdmin && status && status !== issue.status) {
      return res.status(403).json({ message: "Only an admin can change issue status" });
    }
    if (title !== undefined) issue.title = title.trim();
    if (description !== undefined) issue.description = description.trim();
    if (category !== undefined) issue.category = category.trim();
    if (location !== undefined) issue.location = location.trim();
    if (priority !== undefined) issue.priority = priority;
    if (images !== undefined) {
      if (!Array.isArray(images) || images.length > 5) return res.status(400).json({ message: "A maximum of 5 evidence images is allowed" });
      issue.images = images;
    }
    if (coordinates !== undefined) issue.coordinates = coordinates;

    if (isAdmin && department !== undefined) {
      if (!department) issue.department = null;
      else {
        if (!mongoose.isValidObjectId(department)) return res.status(400).json({ message: "Invalid department" });
        const departmentRecord = await Department.findOne({ _id: department, active: true });
        if (!departmentRecord) return res.status(404).json({ message: "Department not found" });
        issue.department = departmentRecord._id;
      }
    }

    if (isAdmin && assignedTo !== undefined) {
      if (!assignedTo) issue.assignedTo = null;
      else {
        if (!mongoose.isValidObjectId(assignedTo)) return res.status(400).json({ message: "Invalid assignee" });
        const assignee = await User.findById(assignedTo).select("_id name email role");
        if (!assignee) return res.status(404).json({ message: "Assignee not found" });
        issue.assignedTo = assignee._id;
      }
    }

    if (isAdmin && targetDate !== undefined) {
      if (!targetDate) issue.targetDate = null;
      else {
        const parsed = new Date(targetDate);
        if (Number.isNaN(parsed.getTime())) return res.status(400).json({ message: "Invalid target date" });
        issue.targetDate = parsed;
      }
    }

    const previousStatus = issue.status;
    if (isAdmin && status !== undefined) {
      if (!STATUS_VALUES.includes(status)) return res.status(400).json({ message: "Invalid issue status" });
      issue.status = status;
    }

    const updatedIssue = await issue.save();

    if (isAdmin && status !== undefined && status !== previousStatus) {
      await IssueStatusHistory.create({
        issue: issue._id, status,
        note: typeof statusNote === "string" ? statusNote.trim().slice(0, 1000) : "",
        changedBy: req.user._id,
      });
      await Notification.create({
        recipient: issue.createdBy, issue: issue._id, type: "status_changed",
        title: "Issue status updated",
        message: `Your issue “${issue.title}” is now ${status}.`,
      });
    }

    const populatedIssue = await updatedIssue.populate([
      { path: "createdBy", select: "name email" },
      { path: "department", select: "name code description" },
      { path: "assignedTo", select: "name email role" },
    ]);
    res.status(200).json(populatedIssue);
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    const isOwner = issue.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "You cannot delete this issue" });
    await Promise.all([
      issue.deleteOne(),
      IssueStatusHistory.deleteMany({ issue: issue._id }),
      Notification.deleteMany({ issue: issue._id }),
    ]);
    res.status(200).json({ message: "Issue deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const voteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    const userId = req.user._id;
    const alreadyVoted = issue.voters.some((voter) => voter.toString() === userId.toString());
    if (alreadyVoted) issue.voters.pull(userId);
    else issue.voters.push(userId);
    await issue.save();
    res.status(200).json({ message: alreadyVoted ? "Vote removed" : "Vote added", issue, voted: !alreadyVoted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createIssue, getIssues, getMyIssues, getIssueById, updateIssue, deleteIssue, voteIssue };
