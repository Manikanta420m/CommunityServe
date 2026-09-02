const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Issue = require("../models/Issue");

const getComments = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.issueId)) {
      return res.status(400).json({ message: "Invalid issue id" });
    }

    const issueExists = await Issue.exists({ _id: req.params.issueId });
    if (!issueExists) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const comments = await Comment.find({ issue: req.params.issueId })
      .populate("author", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const { issueId } = req.params;

    if (!mongoose.isValidObjectId(issueId)) {
      return res.status(400).json({ message: "Invalid issue id" });
    }

    if (!content?.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const issueExists = await Issue.exists({ _id: issueId });
    if (!issueExists) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const comment = await Comment.create({
      issue: issueId,
      author: req.user._id,
      content: content.trim(),
    });

    const populatedComment = await comment.populate(
      "author",
      "name email role"
    );

    res.status(201).json(populatedComment);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.commentId)) {
      return res.status(400).json({ message: "Invalid comment id" });
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const isOwner = comment.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You cannot delete this comment" });
    }

    await comment.deleteOne();
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getComments, createComment, deleteComment };
