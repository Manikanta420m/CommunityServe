import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { findSimilarIssues, suggestIssueDetails } from "../services/aiIssueService";

const CATEGORIES = ["Roads", "Garbage", "Streetlights", "Water", "Drainage", "Other"];

const IssueIntelligence = ({ title, description, location, category, onApply }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async () => {
    if (!title.trim() && !description.trim()) {
      toast.error("Add a title or description first");
      return;
    }
    try {
      setLoading(true);
      const [suggestions, similar] = await Promise.all([
        suggestIssueDetails({ title, description, category }),
        findSimilarIssues({ title, description, location, category }),
      ]);
      setResult({ ...suggestions, matches: similar.matches || [] });
      toast.success("Report analysis complete");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to analyze report");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!result) return;
    const nextCategory = CATEGORIES.includes(result.category?.suggestion)
      ? result.category.suggestion
      : category;
    onApply(nextCategory, result.priority?.suggestion || "Medium");
    toast.success("Smart suggestions applied");
  };

  return (
    <div className="ai-tools-card">
      <div className="ai-tools-header">
        <div>
          <p className="eyebrow">Smart triage</p>
          <h2>Analyze before submitting</h2>
          <p className="muted">Get category and urgency suggestions and check for similar community reports.</p>
        </div>
        <button type="button" className="secondary-button" onClick={analyze} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze report"}
        </button>
      </div>

      {result && (
        <div className="insights-card">
          <div className="insight-grid">
            <div><span className="muted">Category</span><strong>{result.category?.suggestion}</strong><small>{result.category?.confidence} confidence</small></div>
            <div><span className="muted">Priority</span><strong>{result.priority?.suggestion}</strong><small>{result.priority?.reason}</small></div>
          </div>
          <button type="button" className="primary-button" onClick={apply}>Apply suggestions</button>

          {result.matches.length > 0 && (
            <div className="similar-issues">
              <h3>Possible duplicate reports</h3>
              {result.matches.map((match) => (
                <Link to={`/issues/${match._id}`} className="similar-issue" key={match._id}>
                  <div><strong>{match.title}</strong><span>{match.location} · {match.status}</span></div>
                  <b>{Math.round(match.similarity * 100)}% similar</b>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IssueIntelligence;
