import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { registerUser } from "../services/authService";
import { getPublicDepartments } from "../services/departmentService";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "user",
  department: "",
};

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const isLeader = formData.role === "corporate_leader";

  useEffect(() => {
    if (!isLeader) return;
    getPublicDepartments()
      .then(setDepartments)
      .catch(() => toast.error("Unable to load departments"));
  }, [isLeader]);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must contain at least 6 characters");
      return;
    }

    if (isLeader && !formData.department) {
      toast.error("Select the department you lead");
      return;
    }

    try {
      setLoading(true);
      const data = await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        department: isLeader ? formData.department : undefined,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success(isLeader ? "Leader account created successfully" : "Citizen account created successfully");
      navigate(isLeader ? "/leader" : "/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Join CommunityServe</p>
        <h1>Create your account</h1>
        <p>{isLeader ? "Create a department leader account to review and drive resolution of community issues." : "Report local problems, support your community and track resolutions."}</p>

        <div className="role-choice-grid" role="radiogroup" aria-label="Choose account type">
          <button type="button" className={`role-choice ${!isLeader ? "selected" : ""}`} onClick={() => setFormData((current) => ({ ...current, role: "user", department: "" }))}>
            <strong>Citizen</strong>
            <span>Report issues, vote, comment and track resolutions.</span>
          </button>
          <button type="button" className={`role-choice ${isLeader ? "selected" : ""}`} onClick={() => setFormData((current) => ({ ...current, role: "corporate_leader" }))}>
            <strong>Corporate Leader</strong>
            <span>Review department issues, manage teams and drive resolution.</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Full Name
            <input type="text" name="name" value={formData.name} placeholder="Your name" onChange={handleChange} autoComplete="name" required />
          </label>

          <label>
            Email
            <input type="email" name="email" value={formData.email} placeholder="you@example.com" onChange={handleChange} autoComplete="email" required />
          </label>

          {isLeader && (
            <label>
              Department
              <select name="department" value={formData.department} onChange={handleChange} required>
                <option value="">Select your department</option>
                {departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
              </select>
            </label>
          )}

          <label>
            Password
            <input type="password" name="password" value={formData.password} placeholder="At least 6 characters" onChange={handleChange} autoComplete="new-password" minLength={6} required />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : isLeader ? "Create Leader Account" : "Create Citizen Account"}
          </button>
        </form>

        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
        {isLeader && <p className="auth-footer" style={{ marginTop: 10 }}>Leader already registered? <Link to="/leader-login">Use Leader Login</Link></p>}
      </section>
    </main>
  );
};

export default Register;
