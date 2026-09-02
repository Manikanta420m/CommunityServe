const mongoose = require("mongoose");
const Issue = require("../models/Issue");
const IssueFeedback = require("../models/IssueFeedback");

const getAnalytics = async (req, res) => {
  try {
    const [totals, statusBreakdown, categoryBreakdown, priorityBreakdown, recentTrend, topIssues, feedbackStats] =
      await Promise.all([
        Issue.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              resolved: { $sum: { $cond: [{ $in: ["$status", ["Resolved", "Closed"]] }, 1, 0] } },
              open: { $sum: { $cond: [{ $in: ["$status", ["Pending", "Under Review", "In Progress"]] }, 1, 0] } },
              votes: { $sum: { $size: { $ifNull: ["$voters", []] } } },
            },
          },
        ]),
        Issue.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $project: { _id: 0, status: "$_id", count: 1 } },
        ]),
        Issue.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $project: { _id: 0, category: "$_id", count: 1 } },
        ]),
        Issue.aggregate([
          { $group: { _id: "$priority", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $project: { _id: 0, priority: "$_id", count: 1 } },
        ]),
        Issue.aggregate([
          { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, date: "$_id", count: 1 } },
        ]),
        Issue.find({ status: { $nin: ["Closed"] } })
          .sort({ voters: -1, createdAt: -1 })
          .limit(5)
          .select("title status category priority location createdAt voters")
          .lean(),
        IssueFeedback.aggregate([
          {
            $group: {
              _id: null,
              responses: { $sum: 1 },
              averageRating: { $avg: "$rating" },
              reopenRequests: { $sum: { $cond: ["$reopenRequested", 1, 0] } },
            },
          },
        ]),
      ]);

    const total = totals[0]?.total || 0;
    const resolved = totals[0]?.resolved || 0;
    const open = totals[0]?.open || 0;
    const feedback = feedbackStats[0] || {};

    res.status(200).json({
      totals: {
        total,
        resolved,
        open,
        votes: totals[0]?.votes || 0,
        resolutionRate: total ? Number(((resolved / total) * 100).toFixed(1)) : 0,
      },
      feedback: {
        responses: feedback.responses || 0,
        averageRating: feedback.averageRating ? Number(feedback.averageRating.toFixed(1)) : 0,
        reopenRequests: feedback.reopenRequests || 0,
      },
      statusBreakdown,
      categoryBreakdown,
      priorityBreakdown,
      recentTrend,
      topIssues: topIssues.map((issue) => ({ ...issue, votes: issue.voters?.length || 0 })),
    });
  } catch (error) {
    if (error instanceof mongoose.Error) return res.status(400).json({ message: error.message });
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics };
