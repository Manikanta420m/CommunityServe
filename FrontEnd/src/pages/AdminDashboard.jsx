import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";

import { getCurrentUser } from "../services/userService";
import { getIssues, updateIssue } from "../services/issueService";

const statuses = ["Pending", "Under Review", "In Progress", "Resolved", "Closed"];

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser.role !== "admin") return;
      setIssues(await getIssues({ sort: "newest" }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => ({
    total: issues.length,
    pending: issues.filter((issue) => issue.status === "Pending").length,
    progress: issues.filter((issue) => issue.status === "In Progress").length,
    resolved: issues.filter((issue) => ["Resolved", "Closed"].includes(issue.status)).length,
  }), [issues]);

  const changeStatus = async (issue, status) => {
    try {
      setUpdatingId(issue._id);
      const updated = await updateIssue(issue._id, { status });
      setIssues((current) => current.map((item) => item._id === updated._id ? updated : item));
      toast.success("Issue status updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <main className="container"><p>Loading admin dashboard...</p></main>;
  if (!user || user.role !== "admin") return <Navigate to="/" replace />;

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Issue Management</h1>
          <p className="muted">Review community reports and move them through the resolution workflow.</p>
        </div>
      </div>

      <section className="stats-grid">
        <div className="stat-card"><strong>{stats.total}</strong><span>Total issues</span></div>
        <div className="stat-card"><strong>{stats.pending}</strong><span>Pending</span></div>
        <div className="stat-card"><strong>{stats.progress}</strong><span>In progress</span></div>
        <div className="stat-card"><strong>{stats.resolved}</strong><span>Resolved / closed</span></div>
      </section>

      <section className="issue-list" style={{ marginTop: 20 }}>
        {issues.map((issue) => (
          <div className="issue-row" key={issue._id}>
            <div>
              <h2>{issue.title}</h2>
              <p>{issue.location} · {issue.votes} votes</p>
            </div>
            <select
              value={issue.status}
              onChange={(event) => changeStatus(issue, event.target.value)}
              disabled={updatingId === issue._id}
              aria-label={`Status for ${issue.title}`}
            >
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        ))}
      </section>
    </main>
  );
};

export default AdminDashboard;
