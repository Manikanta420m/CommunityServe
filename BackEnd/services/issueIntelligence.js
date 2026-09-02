const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "to", "of", "in", "on", "for", "with", "near",
  "at", "is", "are", "be", "this", "that", "it", "was", "there", "from", "by",
]);

const CATEGORY_KEYWORDS = {
  Roads: ["pothole", "road", "street", "crack", "asphalt", "traffic", "speed breaker", "footpath", "sidewalk"],
  Garbage: ["garbage", "trash", "waste", "dump", "litter", "bin", "smell", "dumping"],
  Streetlights: ["streetlight", "street light", "lamp", "light pole", "dark street", "lighting"],
  Water: ["water", "tap", "pipe", "pipeline", "drinking water", "leak", "supply"],
  Drainage: ["drain", "drainage", "sewage", "sewer", "flood", "waterlogging", "clogged"],
};

const tokenize = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const getCategorySuggestion = (title, description, selectedCategory) => {
  const text = `${title} ${description}`.toLowerCase();
  const scores = Object.fromEntries(
    Object.entries(CATEGORY_KEYWORDS).map(([category, keywords]) => [
      category,
      keywords.reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0),
    ])
  );

  const [category, score] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0] || ["Other", 0];
  const suggestion = score > 0 ? category : selectedCategory || "Other";

  return {
    suggestion,
    confidence: score > 1 ? "high" : score === 1 ? "medium" : "low",
    matchedKeywords: score,
  };
};

const getPrioritySuggestion = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  const criticalSignals = ["danger", "accident", "injury", "collapsed", "electrical fire", "contamination", "unsafe", "emergency"];
  const highSignals = ["blocked", "flood", "major leak", "school", "hospital", "heavy traffic", "no water", "broken pipeline"];
  const mediumSignals = ["pothole", "garbage", "streetlight", "crack", "drain", "leak"];

  if (criticalSignals.some((signal) => text.includes(signal))) return { suggestion: "Critical", reason: "Potential safety or emergency impact" };
  if (highSignals.some((signal) => text.includes(signal))) return { suggestion: "High", reason: "Likely significant community disruption" };
  if (mediumSignals.some((signal) => text.includes(signal))) return { suggestion: "Medium", reason: "Likely requires timely attention" };
  return { suggestion: "Low", reason: "No high-impact urgency signals detected" };
};

const getSimilarity = (leftText, rightText) => {
  const left = new Set(tokenize(leftText));
  const right = new Set(tokenize(rightText));
  if (!left.size || !right.size) return 0;

  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / Math.sqrt(left.size * right.size);
};

const findSimilarIssues = (candidate, issues, limit = 5) => {
  const candidateText = `${candidate.title} ${candidate.description} ${candidate.location}`;

  return issues
    .filter((issue) => issue._id.toString() !== candidate._id?.toString())
    .map((issue) => ({
      issue,
      score: getSimilarity(candidateText, `${issue.title} ${issue.description} ${issue.location}`),
    }))
    .filter(({ score }) => score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ issue, score }) => ({
      _id: issue._id,
      title: issue.title,
      description: issue.description,
      location: issue.location,
      category: issue.category,
      priority: issue.priority,
      status: issue.status,
      votes: issue.votes,
      similarity: Number(score.toFixed(2)),
    }));
};

module.exports = {
  getCategorySuggestion,
  getPrioritySuggestion,
  findSimilarIssues,
};
