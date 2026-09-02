import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";

import { getCurrentUser } from "../services/userService";
import { getAuthorityIssues, updateAuthorityIssue } from "../services/authorityService";

const statuses = ["Pending", "Under Review", "In Progress", "Resolved", "Closed"];

const AuthorityDashboard = () => {
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [updatingId, setUpdatingId] = useState(null);
  const [notes, setNotes] = useState({});

  const loadIssues = async (currentFilter = filter) => {
    try {
      const params = currentFilter === "overdue"
        ? { overdue: "true" }
        : currentFilter === "active"
          ? { status: "In Progress" }
          : {};
      setIssues(await getAuthorityIssues(params));
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load assigned issues");
    }
  };

  const load = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser.role === "authority") await loadIssues();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load authority dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (user?.role === "authority") loadIssues(filter); }, [filter, user?.role]);

  const stats = useMemo(() => ({
    total: issues.length,
    overdue: issues.filter((issue) => issue.isOverdue).length,
    inProgress: issues.filter((issue) => issue.status === "In Progress").length,
    resolved: issues.filter((issue) => ["Resolved", "Closed"].includes(issue.status)).length,
  }), [issues]);

  const updateStatus = async (issue, status) => {
    try {
      setUpdatingId(issue._id);
      const updated = await updateAuthorityIssue(issue._id, {
        status,
        note: notes[issue._id] || "",
      });
      setIssues((current) => current.map((item) => item._id === updated._id ? updated : item));
      toast.success("Issue progress updated");
      setNotes((current) => ({ ...current, [issue._id]: "" }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update issue");
    } finally {
      setUpdatingId(null);
    }
  };

  const updateEvidence = async (issue) => {
    const urls = window.prompt("Add resolution evidence image URLs, separated by commas:", (issue.resolutionEvidence || []).join(", "));
    if (urls === null) return;
    const resolutionEvidence = urls.split(",").map((url) => url.trim()).filter(Boolean);
    try {
      setUpdatingId(issue._id);
      const updated = await updateAuthorityIssue(issue._id, { resolutionEvidence });
      setIssues((current) => current.map((item) => item._id === updated._id ? updated : item));
      toast.success("Resolution evidence updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update evidence");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <main className="container"><p>Loading authority workspace...</p></main>;
  if (!user || user.role !== "authority") return <Navigate to="/" replace />;

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <p className="eyebrow">Authority workspace</p>
          <h1>My Assigned Issues</h1>
          <p className="muted">{user.department?.name || "Department"} · Work your assigned queue and keep residents informed.</p>
        </div>
      </div>

      <section className="stats-grid">
        <div className="stat-card"><strong>{stats.total}</strong><span>Issues in view</span></div>
        <div className="stat-card"><strong>{stats.inProgress}</strong><span>In progress</span></div>
        <div className="stat-card"><strong>{stats.overdue}</strong><span>Overdue</span></div>
        <div className="stat-card"><strong>{stats.resolved}</strong><span>Resolved / closed</span></div>
      </section>

      <div className="filter-panel authority-filters" style={{ marginTop: 24 }}>
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="active">In progress</option>
          <option value="overdue">Overdue</option>
          <option value="all">All assigned</option>
        </select>
      </div>

      <section className="issue-list">
        {issues.length === 0 ? (
          <div className="empty-state"><h3>No issues in this queue</h3><p className="muted">There are no assigned reports matching this filter.</p></div>
        ) : issues.map((issue) => (
          <article className="issue-row admin-issue-row" key={issue._id}>
            <div className="admin-issue-main">
              <div>
                <h2>{issue.title}</h2>
                <p>{issue.location} · {issue.category} · {issue.priority} priority</p>
              </div>
              {issue.isOverdue && <span className="badge status-pending">Overdue</span>}
            </div>

            <div className="assignment-summary">
              <span className="badge">{issue.department?.code || user.department?.code || "DEPARTMENT"}</span>
              <span className="muted">Target: {issue.targetDate ? new Date(issue.targetDate).toLocaleDateString() : "Not set"}</span>
              {issue.daysUntilTarget !== null && <span className="muted">{issue.daysUntilTarget >= 0 ? `${issue.daysUntilTarget} day(s) left` : `${Math.abs(issue.daysUntilTarget)} day(s) late`}</span>}
              <Link to={`/issues/${issue._id}`} className="secondary-button">View issue</Link>
            </div>

            <div className="authority-update-grid">
              <label>
                Status
                <select value={issue.status} onChange={(event) => updateStatus(issue, event.target.value)} disabled={updatingId === issue._id}>
                  {statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <label>
                Progress / resolution note
                <textarea value={notes[issue._id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [issue._id]: event.target.value }))} rows={3} maxLength={1000} placeholder="What changed? What was fixed?" />
              </label>
              <button type="button" className="secondary-button" onClick={() => updateEvidence(issue)} disabled={updatingId === issue._id}>Resolution evidence</button>
            </div>

            {issue.resolutionEvidence?.length > 0 && (
              <div className="image-preview-grid detail-images">
                {issue.resolutionEvidence.map((url) => (
                  <a href={url} target="_blank" rel="noreferrer" key={url}><img src={url} alt="Resolution evidence" loading="lazy" /></a>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
};

export default AuthorityDashboard;
