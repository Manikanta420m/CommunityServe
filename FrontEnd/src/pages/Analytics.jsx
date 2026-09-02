import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { getAnalytics } from "../services/analyticsService";

const BarList = ({ title, items, labelKey }) => (
  <section className="analytics-card">
    <div className="section-heading"><h2>{title}</h2></div>
    {items.length === 0 ? (
      <p className="muted">No data yet.</p>
    ) : (
      <div className="analytics-bars">
        {items.map((item) => {
          const max = Math.max(...items.map((entry) => entry.count), 1);
          return (
            <div key={item[labelKey]} className="analytics-bar-row">
              <div className="analytics-bar-label"><span>{item[labelKey]}</span><strong>{item.count}</strong></div>
              <div className="analytics-bar-track"><span style={{ width: `${(item.count / max) * 100}%` }} /></div>
            </div>
          );
        })}
      </div>
    )}
  </section>
);

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch((error) => toast.error(error.response?.data?.message || "Unable to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="container"><p>Loading analytics...</p></main>;
  if (!data) return <main className="container empty-state"><h1>Analytics unavailable</h1><Link to="/admin">Back to admin</Link></main>;

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administrator insights</p>
          <h1>Community Analytics</h1>
          <p className="muted">Track demand, urgency, community engagement, and resolution performance.</p>
        </div>
        <Link className="secondary-button" to="/admin">Back to Admin</Link>
      </div>

      <section className="stats-grid analytics-stats">
        <div className="stat-card"><strong>{data.totals.total}</strong><span>Total reports</span></div>
        <div className="stat-card"><strong>{data.totals.open}</strong><span>Open issues</span></div>
        <div className="stat-card"><strong>{data.totals.resolved}</strong><span>Resolved / closed</span></div>
        <div className="stat-card"><strong>{data.totals.resolutionRate}%</strong><span>Resolution rate</span></div>
      </section>

      <div className="analytics-grid">
        <BarList title="By Status" items={data.statusBreakdown} labelKey="status" />
        <BarList title="By Category" items={data.categoryBreakdown} labelKey="category" />
        <BarList title="By Priority" items={data.priorityBreakdown} labelKey="priority" />

        <section className="analytics-card">
          <div className="section-heading"><h2>Citizen feedback</h2></div>
          <div className="feedback-analytics-grid">
            <div><strong>{data.feedback?.responses || 0}</strong><span>Responses</span></div>
            <div><strong>{data.feedback?.averageRating || 0}/5</strong><span>Average rating</span></div>
            <div><strong>{data.feedback?.reopenRequests || 0}</strong><span>Review requests</span></div>
          </div>
          <p className="muted">Use feedback to identify resolutions that need improvement and departments that consistently deliver strong outcomes.</p>
        </section>

        <section className="analytics-card">
          <div className="section-heading"><h2>Community engagement</h2></div>
          <div className="engagement-highlight"><strong>{data.totals.votes}</strong><span>Total community votes</span></div>
          <p className="muted">High-vote reports are surfaced below so administrators can prioritize issues with strong community demand.</p>
        </section>
      </div>

      <section className="analytics-card">
        <div className="section-heading"><h2>Top active issues</h2></div>
        {data.topIssues.length === 0 ? <p className="muted">No active issues.</p> : (
          <div className="issue-list">
            {data.topIssues.map((issue) => (
              <Link className="issue-row analytics-issue-row" key={issue._id} to={`/issues/${issue._id}`}>
                <div><h2>{issue.title}</h2><p>{issue.location} · {issue.category} · {issue.priority}</p></div>
                <div className="issue-row-meta"><span className="badge">{issue.status}</span><strong>{issue.votes} votes</strong></div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="analytics-card">
        <div className="section-heading"><h2>Reports — last 30 days</h2></div>
        {data.recentTrend.length === 0 ? <p className="muted">No reports in the last 30 days.</p> : (
          <div className="trend-list">
            {data.recentTrend.map((point) => (
              <div key={point.date} className="trend-row"><span>{new Date(`${point.date}T00:00:00`).toLocaleDateString()}</span><strong>{point.count}</strong></div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Analytics;
