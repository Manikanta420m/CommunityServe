import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { getIssues, voteIssue } from "../services/issueService";
import IssueCard from "../components/issueCard";

const categories = ["", "Roads", "Garbage", "Streetlights", "Water", "Drainage", "Other"];
const statuses = ["", "Pending", "Under Review", "In Progress", "Resolved", "Closed"];
const priorities = ["", "Low", "Medium", "High", "Critical"];

const Dashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
    priority: "",
    sort: "newest",
  });

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setIssues(await getIssues(filters));
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load issues");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id) => {
    try {
      const data = await voteIssue(id);
      toast.success(data.message);
      await fetchIssues();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update vote");
    }
  };

  const handleFilterChange = (event) => {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const resetFilters = () => {
    setFilters({ search: "", category: "", status: "", priority: "", sort: "newest" });
  };

  useEffect(() => {
    const timer = setTimeout(fetchIssues, 250);
    return () => clearTimeout(timer);
  }, [filters.search, filters.category, filters.status, filters.priority, filters.sort]);

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <p className="eyebrow">CommunityServe</p>
          <h1>Community Issues</h1>
          <p className="muted">Find local problems, support important reports, and follow their progress.</p>
        </div>
        <Link className="primary-button" to="/create-issue">Report an issue</Link>
      </div>

      <section className="filter-panel">
        <input
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search issues or locations..."
          aria-label="Search issues"
        />
        <select name="category" value={filters.category} onChange={handleFilterChange} aria-label="Filter by category">
          <option value="">All categories</option>
          {categories.slice(1).map((category) => <option key={category}>{category}</option>)}
        </select>
        <select name="status" value={filters.status} onChange={handleFilterChange} aria-label="Filter by status">
          <option value="">All statuses</option>
          {statuses.slice(1).map((status) => <option key={status}>{status}</option>)}
        </select>
        <select name="priority" value={filters.priority} onChange={handleFilterChange} aria-label="Filter by priority">
          <option value="">All priorities</option>
          {priorities.slice(1).map((priority) => <option key={priority}>{priority}</option>)}
        </select>
        <select name="sort" value={filters.sort} onChange={handleFilterChange} aria-label="Sort issues">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="votes">Most voted</option>
        </select>
        <button type="button" className="secondary-button" onClick={resetFilters}>Reset</button>
      </section>

      {loading ? (
        <div className="empty-state"><p>Loading community issues...</p></div>
      ) : issues.length === 0 ? (
        <div className="empty-state">
          <h2>No issues found</h2>
          <p>Try changing your filters or report a new community issue.</p>
        </div>
      ) : (
        <div className="issue-grid">
          {issues.map((issue) => (
            <IssueCard key={issue._id} issue={issue} handleVote={handleVote} />
          ))}
        </div>
      )}
    </main>
  );
};

export default Dashboard;
