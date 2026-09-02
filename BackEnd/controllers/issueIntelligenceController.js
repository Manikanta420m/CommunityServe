const Issue = require("../models/Issue");
const {
  getCategorySuggestion,
  getPrioritySuggestion,
  findSimilarIssues,
} = require("../services/issueIntelligence");

const suggestIssueDetails = async (req, res) => {
  try {
    const { title = "", description = "", category = "Other" } = req.body;
    const categorySuggestion = getCategorySuggestion(title, description, category);
    const prioritySuggestion = getPrioritySuggestion(title, description);

    res.status(200).json({
      category: categorySuggestion,
      priority: prioritySuggestion,
      disclaimer: "Suggestions are heuristic and should be reviewed by the reporter.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const findSimilarIssueRecords = async (req, res) => {
  try {
    const { title = "", description = "", location = "", category = "Other" } = req.body;
    if (!title.trim() && !description.trim()) {
      return res.status(400).json({ message: "Title or description is required" });
    }

    const candidate = { title, description, location, category, _id: null };
    const issues = await Issue.find({ category }).sort({ createdAt: -1 }).limit(500);
    const similarIssues = findSimilarIssues(candidate, issues);

    res.status(200).json({
      matches: similarIssues,
      threshold: 0.35,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  suggestIssueDetails,
  findSimilarIssueRecords,
};
