const mongoose = require("mongoose");

const issueStatusHistorySchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Under Review", "In Progress", "Resolved", "Closed"],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const IssueStatusHistory =
  mongoose.models.IssueStatusHistory ||
  mongoose.model("IssueStatusHistory", issueStatusHistorySchema);

module.exports = IssueStatusHistory;
