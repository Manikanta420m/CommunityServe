import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { createIssue } from "../services/issueService";

const categories = ["Roads", "Garbage", "Streetlights", "Water", "Drainage", "Other"];
const priorities = ["Low", "Medium", "High", "Critical"];

const CreateIssue = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Roads",
    location: "",
    priority: "Medium",
  });

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      setLoading(true);
      const issue = await createIssue({
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
      });
      toast.success("Issue reported successfully");
      navigate(`/issues/${issue._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Issue creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <p className="eyebrow">Make an impact</p>
          <h1>Report a Community Issue</h1>
          <p className="muted">Give your neighbors and local authorities enough detail to act.</p>
        </div>
      </div>

      <section className="detail-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Issue title
            <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Large pothole near main road" minLength={3} maxLength={120} required />
          </label>

          <label>
            Description
            <textarea name="description" value={formData.description} onChange={handleChange} rows={6} placeholder="Explain what is happening, how serious it is, and anything that helps locate it." minLength={10} maxLength={2000} required />
          </label>

          <div className="detail-grid">
            <label>
              Category
              <select name="category" value={formData.category} onChange={handleChange}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>

            <label>
              Priority
              <select name="priority" value={formData.priority} onChange={handleChange}>
                {priorities.map((priority) => <option key={priority}>{priority}</option>)}
              </select>
            </label>
          </div>

          <label>
            Location
            <input name="location" value={formData.location} onChange={handleChange} placeholder="Street, landmark, area or address" required />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Submitting report..." : "Submit issue"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default CreateIssue;
