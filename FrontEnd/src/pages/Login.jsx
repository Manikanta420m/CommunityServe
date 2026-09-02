import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginUser } from "../services/authService";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await loginUser(formData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Welcome back!");
      navigate(data.user.role === "corporate_leader" ? "/leader" : "/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Citizen & staff access</p>
        <h1>Welcome back</h1>
        <p>Login to report, support and track community issues.</p>

        <div className="auth-form">
          <label>Email<input type="email" name="email" value={formData.email} placeholder="Enter your email" onChange={handleChange} required /></label>
          <label>Password<input type="password" name="password" value={formData.password} placeholder="Enter your password" onChange={handleChange} required /></label>
          <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        </div>

        <p className="auth-footer" style={{ marginTop: 20 }}>New here? <Link to="/register">Create an account</Link></p>
        <p className="auth-footer" style={{ marginTop: 10 }}>Department leader? <Link to="/leader-login">Open the Leader Portal</Link></p>
      </form>
    </div>
  );
};

export default Login;
