import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { getIssueById, voteIssue } from "../services/issueService";

const IssueDetails = () => {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const loadIssue = async () => {
    try {
      setLoading(true);
      setIssue(await getIssueById(id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load issue");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    try {
      setVoting(true);
      const data = await voteIssue(id);
      setIssue(data.issue);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update vote");
    } finally {
      setVoting(false);
    }
  };

  useEffect(() => {
    loadIssue();
  }, [id]);

  if (loading) return <main className="container"><p>Loading issue...</p></main>;
  if (!issue) {
    return (
      <main className="container empty-state">
        <h1>Issue not found</h1>
        <Link to="/">Back to dashboard</Link>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <p className="eyebrow">Community issue</p>
          <h1>{issue.title}</h1>
          <p className="muted">Reported by {issue.createdBy?.name || "Community member"}</p>
        </div>
        <Link className="secondary-button" to="/">Back</Link>
      </div>

      <section className="detail-card">
        <div className="detail-badges">
          <span className={`badge status-${issue.status.toLowerCase().replaceAll(" ", "-")}`}>
            {issue.status}
          </span>
          <span className="badge">{issue.category}</span>
          <span className="badge">{issue.priority} priority</span>
        </div>

        <p className="detail-description">{issue.description}</p>

        <dl className="detail-grid">
          <div><dt>Location</dt><dd>{issue.location}</dd></div>
          <div><dt>Votes</dt><dd>{issue.votes}</dd></div>
          <div><dt>Reported</dt><dd>{new Date(issue.createdAt).toLocaleString()}</dd></div>
          <div><dt>Last updated</dt><dd>{new Date(issue.updatedAt).toLocaleString()}</dd></div>
        </dl>

        <button type="button" onClick={handleVote} disabled={voting}>
          {voting ? "Updating..." : "Vote / Remove vote"}
        </button>
      </section>
    </main>
  );
};

export default IssueDetails;
