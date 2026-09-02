const Issue = require("../models/Issue");

const createIssue = async (req, res) => {
  try {
    const { title, description, category, location, priority } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({
        message: "Title, description, category and location are required",
      });
    }

    const issue = await Issue.create({
      title,
      description,
      category,
      location,
      priority,
      createdBy: req.user._id,
    });

    const populatedIssue = await issue.populate("createdBy", "name email");
    res.status(201).json(populatedIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getIssues = async (req, res) => {
  try {
    const { status, category, priority, search, sort = "newest" } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    let issues = await Issue.find(filter).populate("createdBy", "name email");

    if (sort === "votes") {
      issues = issues.sort((a, b) => b.votes - a.votes);
    } else if (sort === "oldest") {
      issues = issues.sort((a, b) => a.createdAt - b.createdAt);
    } else {
      issues = issues.sort((a, b) => b.createdAt - a.createdAt);
    }

    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getIssueById = async (req, res) => {
  try {
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

    const { title, description, category, location, priority, status } = req.body;

    if (isOwner && !isAdmin && status && status !== issue.status) {
      return res.status(403).json({
        message: "Only an admin can change issue status",
      });
    }

    if (title) issue.title = title;
    if (description) issue.description = description;
    if (category) issue.category = category;
    if (location) issue.location = location;
    if (priority) issue.priority = priority;
    if (isAdmin && status) issue.status = status;

    const updatedIssue = await issue.save();
    res.status(200).json(updatedIssue);
  } catch (error) {
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
      issue.voters = issue.voters.filter(
        (voter) => voter.toString() !== userId.toString()
      );
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
  getIssueById,
  updateIssue,
  deleteIssue,
  voteIssue,
};
