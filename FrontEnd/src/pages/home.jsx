import IssueCard from "../components/issueCard";

function Home() {
  const issues = [
    {
      id: 1,
      title: "Broken Road",
      description: "Road damaged near bus stand",
      location: "Nellore",
      status: "Pending",
      votes: 5,
    },

    {
      id: 2,
      title: "Garbage Overflow",
      description: "Garbage not cleaned",
      location: "Market Area",
      status: "In Progress",
      votes: 10,
    },
  ];

  return (
    <div className="container">
      <h1>Community Issues</h1>

      {issues.map((issue) => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
}

export default Home;