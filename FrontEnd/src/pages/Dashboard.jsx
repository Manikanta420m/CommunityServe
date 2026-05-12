import { useEffect, useState } from "react";

import {
  getIssues,
  voteIssue,
} from "../services/issueService";

import IssueCard from "../components/issueCard";

const Dashboard = () => {
  const [issues, setIssues] = useState([]);

  const fetchIssues = async () => {
    try {
      const data = await getIssues();

      setIssues(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleVote = async (id) => {
    try {
      await voteIssue(id);

      fetchIssues();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  return (
<div className="container">
      <h1>Community Issues Dashboard</h1>

      {issues.map((issue) => (
        <IssueCard
          key={issue._id}
          issue={issue}
          handleVote={handleVote}
        />
      ))}
    </div>
  );
};

export default Dashboard;