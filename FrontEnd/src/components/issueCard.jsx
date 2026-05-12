const IssueCard = ({ issue, handleVote }) => {
  return (
    <div
      style={{
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "20px",
  marginBottom: "20px",
  backgroundColor: "white",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
}}
    >
      <h2>{issue.title}</h2>

      <p>{issue.description}</p>

      <p>Category: {issue.category}</p>

      <p>Location: {issue.location}</p>

      <p>Status: {issue.status}</p>

      <p>Votes: {issue.votes}</p>

      <button onClick={() => handleVote(issue._id)}>
        Vote
      </button>
    </div>
  );
};

export default IssueCard;