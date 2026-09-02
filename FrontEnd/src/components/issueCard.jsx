import { Link } from "react-router-dom";

const IssueCard = ({ issue, handleVote }) => {
  return (
    <article className="issue-card">
      <div className="issue-card-topline">
        <span className="badge">{issue.category}</span>
        <span className={`badge status-${issue.status.toLowerCase().replaceAll(" ", "-")}`}>
          {issue.status}
        </span>
      </div>

      <Link className="issue-title" to={`/issues/${issue._id}`}>
        <h2>{issue.title}</h2>
      </Link>

      <p className="issue-description">{issue.description}</p>
      <p className="muted">{issue.location}</p>

      <div className="issue-card-bottom">
        <span>{issue.votes} vote{issue.votes === 1 ? "" : "s"}</span>
        <span>{issue.priority} priority</span>
        <button type="button" onClick={() => handleVote(issue._id)}>
          Vote
        </button>
      </div>
    </article>
  );
};

export default IssueCard;
