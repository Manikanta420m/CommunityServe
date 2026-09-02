const mongoose = require("mongoose");
const Issue = require("../models/Issue");

const createIssue = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      location,
      priority,
      images = [],
      coordinates,
    } = req.body;

    if (
      !title?.trim() ||
      !description?.trim() ||
      !category?.trim() ||
      !location?.trim()
    ) {
      return res.status(400).json({
        message: "Title, description, category and location are required",
      });
    }

    if (!Array.isArray(images) || images.length > 5) {
      return res.status(400).json({
        message: "A maximum of 5 evidence images is allowed",
      });
    }

    const issue = await Issue.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      priority,
      images: images.filter((url) => typeof url === "string" && url.trim()),
      coordinates: coordinates || undefined,
      createdBy: req.user._id,
    });

    const populatedIssue = await issue.populate("createdBy", "name email");
    res.status(201).json(populatedIssue);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const buildIssueFilter = (query) => {
  const { status, category, priority, search } = query;
  const filter = {};

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;

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
    let issues = await Issue.find(buildIssueFilter(req.query)).populate(
      "createdBy",
      "name email"
    );

    if (sort === "votes") {
      issues.sort((a, b) => b.votes - a.votes);
    } else if (sort === "oldest") {
      issues.sort((a, b) => a.createdAt - b.createdAt);
    } else {
      issues.sort((a, b) => b.createdAt - a.createdAt);
    }

    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyIssues = async (req, res) => {
  try {
    const issues = await Issue.find({
      ...buildIssueFilter(req.query),
      createdBy: req.user._id,
    }).populate("createdBy", "name email");

    issues.sort((a, b) => b.createdAt - a.createdAt);
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getIssueById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid issue id" });
    }

    const issue = await Issue.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.status(200).json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const isOwner = issue.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You cannot update this issue" });
    }

    const {
      title,
      description,
      category,
      location,
      priority,
      status,
      images,
      coordinates,
    } = req.body;

    if (isOwner && !isAdmin && status && status !== issue.status) {
      return res.status(403).json({
        message: "Only an admin can change issue status",
      });
    }

    if (title !== undefined) issue.title = title.trim();
    if (description !== undefined) issue.description = description.trim();
    if (category !== undefined) issue.category = category.trim();
    if (location !== undefined) issue.location = location.trim();
    if (priority !== undefined) issue.priority = priority;
    if (images !== undefined) issue.images = images;
    if (coordinates !== undefined) issue.coordinates = coordinates;
    if (isAdmin && status !== undefined) issue.status = status;

    const updatedIssue = await issue.save();
    const populatedIssue = await updatedIssue.populate("createdBy", "name email");
    res.status(200).json(populatedIssue);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const isOwner = issue.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You cannot delete this issue" });
    }

    await issue.deleteOne();
    res.status(200).json({ message: "Issue deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const voteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const userId = req.user._id;
    const alreadyVoted = issue.voters.some(
      (voter) => voter.toString() === userId.toString()
    );

    if (alreadyVoted) {
      issue.voters.pull(userId);
    } else {
      issue.voters.push(userId);
    }

    await issue.save();

    res.status(200).json({
      message: alreadyVoted ? "Vote removed" : "Vote added",
      issue,
      voted: !alreadyVoted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createIssue,
  getIssues,
  getMyIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  voteIssue,
};
