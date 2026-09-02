import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { getMyIssues } from "../services/issueService";

const MyIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIssues = async () => {
      try {
        setIssues(await getMyIssues());
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load your issues");
      } finally {
        setLoading(false);
      }
    };

    loadIssues();
  }, []);

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <p className="eyebrow">Your reports</p>
          <h1>My Issues</h1>
          <p className="muted">Track every issue you have reported to the community.</p>
        </div>
        <Link className="primary-button" to="/create-issue">Report issue</Link>
      </div>

      {loading ? (
        <p>Loading your issues...</p>
      ) : issues.length === 0 ? (
        <div className="empty-state">
          <h2>No issues reported yet</h2>
          <p>Start by reporting a problem in your community.</p>
          <Link to="/create-issue">Create your first issue</Link>
        </div>
      ) : (
        <div className="issue-list">
          {issues.map((issue) => (
            <Link className="issue-row" to={`/issues/${issue._id}`} key={issue._id}>
              <div>
                <h2>{issue.title}</h2>
                <p>{issue.location}</p>
              </div>
              <div className="issue-row-meta">
                <span className="badge">{issue.status}</span>
                <span>{issue.votes} votes</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
};

export default MyIssues;
