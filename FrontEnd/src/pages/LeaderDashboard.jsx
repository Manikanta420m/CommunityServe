import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";

import { getCurrentUser } from "../services/userService";
import { getLeaderIssues, getLeaderOverview, getLeaderTeam, updateLeaderIssue } from "../services/leaderService";

const statusOptions = ["Pending", "Under Review", "In Progress", "Resolved", "Closed"];
const priorityOptions = ["Low", "Medium", "High", "Critical"];
const escalationOptions = ["Normal", "Watch", "Escalated"];

const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "Not set";

const LeaderDashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [overview, setOverview] = useState(null);
  const [issues, setIssues] = useState([]);
  const [team, setTeam] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "", priority: "", escalation: "", overdue: false, unassigned: false });
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [form, setForm] = useState({ status: "", priority: "", assignedTo: "", targetDate: "", note: "", escalationLevel: "Normal", escalationReason: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const me = await getCurrentUser();
      setCurrentUser(me);
      if (me.role !== "corporate_leader") return;
      const [overviewData, issueData, teamData] = await Promise.all([
        getLeaderOverview(),
        getLeaderIssues(),
        getLeaderTeam(),
      ]);
      setOverview(overviewData);
      setIssues(issueData);
      setTeam(teamData);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load leader workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const reloadIssues = async () => {
    try {
      const data = await getLeaderIssues({
        search: filters.search || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        escalation: filters.escalation || undefined,
        overdue: filters.overdue ? "true" : undefined,
        unassigned: filters.unassigned ? "true" : undefined,
      });
      setIssues(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to filter issues");
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== "corporate_leader") return;
    const timer = setTimeout(reloadIssues, 250);
    return () => clearTimeout(timer);
  }, [filters, currentUser]);

  const openReview = (issue) => {
    setSelectedIssue(issue);
    setForm({
      status: issue.status,
      priority: issue.priority,
      assignedTo: issue.assignedTo?._id || "",
      targetDate: issue.targetDate ? new Date(issue.targetDate).toISOString().slice(0, 10) : "",
      note: issue.leaderReview?.note || "",
      escalationLevel: issue.leaderReview?.escalationLevel || "Normal",
      escalationReason: issue.leaderReview?.escalationReason || "",
    });
  };

  const saveReview = async (event) => {
    event.preventDefault();
    if (!selectedIssue) return;
    try {
      setSaving(true);
      await updateLeaderIssue(selectedIssue._id, {
        status: form.status,
        priority: form.priority,
        assignedTo: form.assignedTo || null,
        targetDate: form.targetDate || null,
        note: form.note,
        escalationLevel: form.escalationLevel,
        escalationReason: form.escalationReason,
      });
      toast.success("Issue leadership decision saved");
      setSelectedIssue(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save leadership decision");
    } finally {
      setSaving(false);
    }
  };

  const topWorkloads = useMemo(() => [...team].sort((a, b) => b.open - a.open), [team]);

  if (loading) return <main className="container"><p>Loading leader workspace...</p></main>;
  if (!currentUser || currentUser.role !== "corporate_leader") return <Navigate to="/" replace />;

  const metrics = overview?.metrics || {};

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <p className="eyebrow">Leadership command center</p>
          <h1>Community Resolution Office</h1>
          <p className="muted">Review citizen problems, direct the department team, protect SLAs, and keep resolution accountable.</p>
        </div>
        <Link className="secondary-button" to="/">Citizen dashboard</Link>
      </div>

      {currentUser.department?.name && (
        <div className="detail-card" style={{ marginBottom: 18 }}>
          <strong>{currentUser.department.name}</strong>
          <span className="muted" style={{ marginLeft: 8 }}>{currentUser.department.code}</span>
          <p className="muted" style={{ margin: "8px 0 0" }}>Leader access is restricted to this department, so every assignment and review stays within the correct operational team.</p>
        </div>
      )}

      <section className="stats-grid" style={{ marginBottom: 26 }}>
        {[
          ["Total reports", metrics.total ?? 0],
          ["Need attention", (metrics.overdue ?? 0) + (metrics.critical ?? 0)],
          ["Unassigned", metrics.unassigned ?? 0],
          ["Resolution rate", `${metrics.resolutionRate ?? 0}%`],
          ["Pending", metrics.pending ?? 0],
          ["In progress", metrics.inProgress ?? 0],
          ["Resolved / closed", metrics.resolved ?? 0],
          ["Reopen requests", metrics.reopenRequests ?? 0],
        ].map(([label, value]) => (
          <article className="stat-card" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className="detail-card" style={{ marginBottom: 26 }}>
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <p className="eyebrow">Operational alerts</p>
            <h2 style={{ margin: "4px 0 6px" }}>What needs a leader today</h2>
            <p className="muted">Critical, overdue, unassigned and escalated cases appear here first.</p>
          </div>
        </div>
        {overview?.attention?.length ? (
          <div className="issue-list">
            {overview.attention.map((issue) => (
              <div className="issue-row" key={issue._id}>
                <div>
                  <h2>{issue.title}</h2>
                  <p>{issue.location} · {issue.isOverdue ? "Overdue" : issue.targetDate ? `Due ${formatDate(issue.targetDate)}` : "No target date"}</p>
                </div>
                <div className="issue-row-meta">
                  <span className="badge">{issue.priority}</span>
                  <span className={`badge status-${issue.status.toLowerCase().replaceAll(" ", "-")}`}>{issue.status}</span>
                  {!issue.assignedTo && <span className="badge">Unassigned</span>}
                  <button className="secondary-button" type="button" onClick={() => openReview(issue)}>Review</button>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="empty-state"><h3>No urgent leadership alerts</h3><p>Your department has no immediate escalations in the current snapshot.</p></div>}
      </section>

      <section className="detail-card" style={{ marginBottom: 26 }}>
        <div className="page-header" style={{ marginBottom: 18 }}>
          <div>
            <p className="eyebrow">Department queue</p>
            <h2 style={{ margin: "4px 0 6px" }}>Review & direct cases</h2>
          </div>
          <button className="secondary-button" type="button" onClick={load}>Refresh</button>
        </div>

        <div className="filter-panel" style={{ gridTemplateColumns: "minmax(220px, 2fr) repeat(3, minmax(130px, 1fr))", marginBottom: 18 }}>
          <input value={filters.search} placeholder="Search title, description or location" onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">All statuses</option>
            {statusOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
            <option value="">All priorities</option>
            {priorityOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={filters.escalation} onChange={(event) => setFilters((current) => ({ ...current, escalation: event.target.value }))}>
            <option value="">All escalations</option>
            {escalationOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 18 }}>
          <label className="checkbox-label" style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
            <input type="checkbox" checked={filters.overdue} onChange={(event) => setFilters((current) => ({ ...current, overdue: event.target.checked }))} /> Overdue only
          </label>
          <label className="checkbox-label" style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
            <input type="checkbox" checked={filters.unassigned} onChange={(event) => setFilters((current) => ({ ...current, unassigned: event.target.checked }))} /> Unassigned only
          </label>
          <span className="muted">{issues.length} department cases</span>
        </div>

        {issues.length ? (
          <div className="issue-list">
            {issues.map((issue) => (
              <div className="issue-row" key={issue._id} style={{ alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div className="detail-badges">
                    <span className="badge">{issue.priority}</span>
                    <span className={`badge status-${issue.status.toLowerCase().replaceAll(" ", "-")}`}>{issue.status}</span>
                    {issue.leaderReview?.escalationLevel !== "Normal" && <span className="badge">{issue.leaderReview.escalationLevel}</span>}
                    {issue.isOverdue && <span className="badge">Overdue</span>}
                  </div>
                  <h2 style={{ marginTop: 10 }}>{issue.title}</h2>
                  <p>{issue.location} · Reported {formatDate(issue.createdAt)}</p>
                  <div className="assignment-summary">
                    <span className="muted">Citizen: {issue.createdBy?.name || "Unknown"}</span>
                    <span className="muted">Authority: {issue.assignedTo?.name || "Unassigned"}</span>
                    <span className="muted">Target: {formatDate(issue.targetDate)}</span>
                  </div>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <Link className="secondary-button" to={`/issues/${issue._id}`}>Open</Link>
                  <button className="primary-button" type="button" onClick={() => openReview(issue)}>Leader review</button>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="empty-state"><h3>No matching cases</h3><p>Adjust the filters to inspect a different part of the department queue.</p></div>}
      </section>

      <section className="detail-card">
        <p className="eyebrow">Team capacity</p>
        <h2 style={{ margin: "4px 0 6px" }}>Authority workload</h2>
        <p className="muted">Use workload visibility to spread assignments before service levels are missed.</p>
        {topWorkloads.length ? (
          <div className="issue-list" style={{ marginTop: 16 }}>
            {topWorkloads.map((person) => (
              <div className="issue-row" key={person.id}>
                <div><h2>{person.name}</h2><p>{person.email}</p></div>
                <div className="issue-row-meta"><span>{person.open} open</span><span>{person.overdue} overdue</span><span>{person.resolved} resolved</span></div>
              </div>
            ))}
          </div>
        ) : <div className="empty-state"><p>No active authorities are currently assigned to this department.</p></div>}
      </section>

      {selectedIssue && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,.48)", display: "grid", placeItems: "center", padding: 20, zIndex: 50 }}>
          <form className="auth-card" style={{ width: "min(720px, 100%)", maxHeight: "90vh", overflow: "auto" }} onSubmit={saveReview}>
            <div className="page-header" style={{ marginBottom: 20 }}>
              <div>
                <p className="eyebrow">Leader review</p>
                <h2 style={{ margin: "4px 0" }}>{selectedIssue.title}</h2>
                <p className="muted">Make the operational decision, capture the reason, and keep the citizen informed.</p>
              </div>
              <button className="secondary-button" type="button" onClick={() => setSelectedIssue(null)}>Close</button>
            </div>
            <div className="assignment-grid">
              <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statusOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{priorityOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Target date<input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} /></label>
              <label>Responsible authority<select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}><option value="">Unassigned</option>{team.map((person) => <option key={person._id} value={person._id}>{person.name}</option>)}</select></label>
              <label>Escalation<select value={form.escalationLevel} onChange={(e) => setForm({ ...form, escalationLevel: e.target.value })}>{escalationOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Escalation reason<input value={form.escalationReason} maxLength={500} onChange={(e) => setForm({ ...form, escalationReason: e.target.value })} placeholder="Why does this need extra attention?" /></label>
            </div>
            <label style={{ display: "grid", gap: 7, marginTop: 14, color: "#344054", fontWeight: 700 }}>Leadership note<textarea rows="5" value={form.note} maxLength={1000} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Decision, next steps, coordination notes, or instructions for the authority..." /></label>
            <div className="assignment-summary" style={{ justifyContent: "flex-end" }}>
              <button className="secondary-button" type="button" onClick={() => setSelectedIssue(null)}>Cancel</button>
              <button className="primary-button" type="submit" disabled={saving}>{saving ? "Saving..." : "Save leadership decision"}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default LeaderDashboard;
