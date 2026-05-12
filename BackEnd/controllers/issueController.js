const Issue = require("../models/Issue");

const createIssue = async (req, res) => {
  try {
    const { title, description, category, location } = req.body;

    const issue = await Issue.create({
      title,
      description,
      category,
      location,
      createdBy: req.user._id,
    });

    res.status(201).json(issue);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getIssues = async (req, res) => {
  try {
    const issues = await Issue.find().populate(
      "createdBy",
      "name email"
    );

    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    issue.status = req.body.status || issue.status;

    const updatedIssue = await issue.save();

    res.status(200).json(updatedIssue);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    await issue.deleteOne();

    res.status(200).json({
      message: "Issue deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const voteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    issue.votes += 1;

    await issue.save();

    res.status(200).json(issue);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createIssue,
  getIssues,
  updateIssue,
  deleteIssue,
  voteIssue,
};