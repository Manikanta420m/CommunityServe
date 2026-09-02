import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { getCurrentUser } from "../services/userService";
import { getMyIssues } from "../services/issueService";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [currentUser, myIssues] = await Promise.all([
          getCurrentUser(),
          getMyIssues(),
        ]);
        setUser(currentUser);
        setIssues(myIssues);
        localStorage.setItem("user", JSON.stringify(currentUser));
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login", { replace: true });
          return;
        }
        toast.error(error.response?.data?.message || "Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  if (loading) return <main className="container"><p>Loading profile...</p></main>;

  const resolvedCount = issues.filter((issue) => ["Resolved", "Closed"].includes(issue.status)).length;
  const activeCount = issues.length - resolvedCount;

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1>My Profile</h1>
          <p className="muted">Your CommunityServe activity at a glance.</p>
        </div>
        <Link className="secondary-button" to="/my-issues">View my issues</Link>
      </div>

      {user && (
        <section className="profile-card">
          <div className="profile-avatar">{user.name?.charAt(0)?.toUpperCase() || "U"}</div>
          <div>
            <h2>{user.name}</h2>
            <p className="muted">{user.email}</p>
            <span className="badge">{user.role}</span>
          </div>
        </section>
      )}

      <section className="stats-grid">
        <div className="stat-card"><strong>{issues.length}</strong><span>Issues reported</span></div>
        <div className="stat-card"><strong>{activeCount}</strong><span>Active issues</span></div>
        <div className="stat-card"><strong>{resolvedCount}</strong><span>Resolved</span></div>
        <div className="stat-card"><strong>{issues.reduce((sum, issue) => sum + issue.votes, 0)}</strong><span>Community votes</span></div>
      </section>
    </main>
  );
};

export default Profile;
