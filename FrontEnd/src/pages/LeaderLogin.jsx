import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginUser } from "../services/authService";

const LeaderLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await loginUser({ ...formData, role: "corporate_leader" });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Leader portal access granted");
      navigate("/leader");
    } catch (error) {
      toast.error(error.response?.data?.message || "Leader login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">CommunityServe leadership</p>
        <h1>Leader Portal</h1>
        <p>Review department-wide citizen problems, coordinate authorities, protect SLAs and drive verified resolution.</p>

        <div className="ai-tools-card" style={{ margin: "22px 0" }}>
          <strong>Controlled access</strong>
          <span className="muted">Only accounts promoted to Corporate Leader by an administrator can enter this workspace.</span>
        </div>

        <div className="auth-form">
          <label>Email<input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Leader email" required /></label>
          <label>Password<input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Password" required /></label>
          <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Enter Leader Portal"}</button>
        </div>

        <p className="auth-footer" style={{ marginTop: 20 }}>
          Citizen or staff login? <Link to="/login">Return to standard login</Link>
        </p>
      </form>
    </div>
  );
};

export default LeaderLogin;
