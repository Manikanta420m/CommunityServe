import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";

import { getCurrentUser } from "../services/userService";
import { getIssues, updateIssue } from "../services/issueService";
import { getDepartments } from "../services/departmentService";

const statuses = ["Pending", "Under Review", "In Progress", "Resolved", "Closed"];

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser.role !== "admin") return;
      const [issueData, departmentData] = await Promise.all([
        getIssues({ sort: "newest" }),
        getDepartments(),
      ]);
      setIssues(issueData);
      setDepartments(departmentData);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: issues.length,
    pending: issues.filter((issue) => issue.status === "Pending").length,
    progress: issues.filter((issue) => issue.status === "In Progress").length,
    resolved: issues.filter((issue) => ["Resolved", "Closed"].includes(issue.status)).length,
    unassigned: issues.filter((issue) => !issue.department).length,
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

  const updateAssignment = async (issue, field, value) => {
    try {
      setUpdatingId(issue._id);
      const updated = await updateIssue(issue._id, { [field]: value });
      setIssues((current) => current.map((item) => item._id === updated._id ? updated : item));
      toast.success(field === "department" ? "Department updated" : "Officer updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update assignment");
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
          <p className="muted">Review reports, assign the responsible authority, and move issues through resolution.</p>
        </div>
        <Link className="secondary-button" to="/analytics">View Analytics</Link>
      </div>

      <section className="stats-grid">
        <div className="stat-card"><strong>{stats.total}</strong><span>Total issues</span></div>
        <div className="stat-card"><strong>{stats.pending}</strong><span>Pending</span></div>
        <div className="stat-card"><strong>{stats.progress}</strong><span>In progress</span></div>
        <div className="stat-card"><strong>{stats.unassigned}</strong><span>Awaiting assignment</span></div>
      </section>

      <section className="issue-list" style={{ marginTop: 20 }}>
        {issues.map((issue) => (
          <article className="issue-row admin-issue-row" key={issue._id}>
            <div className="admin-issue-main">
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

            <div className="assignment-grid">
              <label>
                Department
                <select
                  value={issue.department?._id || ""}
                  onChange={(event) => updateAssignment(issue, "department", event.target.value)}
                  disabled={updatingId === issue._id}
                >
                  <option value="">Unassigned</option>
                  {departments.map((department) => (
                    <option key={department._id} value={department._id}>{department.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Target date
                <input
                  type="date"
                  value={issue.targetDate ? new Date(issue.targetDate).toISOString().slice(0, 10) : ""}
                  onChange={(event) => updateAssignment(issue, "targetDate", event.target.value)}
                  disabled={updatingId === issue._id}
                />
              </label>

              <label>
                Assigned officer
                <input
                  value={issue.assignedTo?.name || ""}
                  placeholder="Officer name / user ID"
                  onChange={(event) => {
                    const value = event.target.value.trim();
                    if (value && value === issue.assignedTo?.name) return;
                  }}
                  disabled
                  title="Officer assignment is supported by the API; officer directory UI will be added with authority accounts."
                />
              </label>
            </div>

            <div className="assignment-summary">
              <span className="badge">{issue.department?.code || "NO DEPARTMENT"}</span>
              <span className="muted">Officer: {issue.assignedTo?.name || "Not assigned"}</span>
              {issue.targetDate && <span className="muted">Target: {new Date(issue.targetDate).toLocaleDateString()}</span>}
              <Link to={`/issues/${issue._id}`} className="secondary-button">View issue</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
};

export default AdminDashboard;
