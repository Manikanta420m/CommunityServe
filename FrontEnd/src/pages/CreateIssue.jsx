import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { createIssue } from "../services/issueService";
import IssueIntelligence from "../components/IssueIntelligence";

const categories = ["Roads", "Garbage", "Streetlights", "Water", "Drainage", "Other"];
const priorities = ["Low", "Medium", "High", "Critical"];

const CreateIssue = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Roads",
    location: "",
    priority: "Medium",
    images: [],
    coordinates: null,
  });

  const remainingImages = useMemo(() => 5 - formData.images.length, [formData.images.length]);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const applyAiSuggestions = (category, priority) => {
    setFormData((current) => ({ ...current, category, priority }));
  };

  const addImage = () => {
    const url = imageUrl.trim();
    if (!url) return;
    if (formData.images.length >= 5) {
      toast.error("You can add up to 5 evidence images");
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error("Enter a valid image URL");
      return;
    }
    setFormData((current) => ({ ...current, images: [...current.images, url] }));
    setImageUrl("");
  };

  const removeImage = (url) => {
    setFormData((current) => ({ ...current, images: current.images.filter((image) => image !== url) }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setFormData((current) => ({
          ...current,
          coordinates: {
            latitude: Number(coords.latitude.toFixed(6)),
            longitude: Number(coords.longitude.toFixed(6)),
          },
        }));
        toast.success("GPS coordinates captured");
        setLocating(false);
      },
      () => {
        toast.error("Unable to access your location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
      toast.error("Please complete all required fields");
      return;
    }
    try {
      setLoading(true);
      const issue = await createIssue({ ...formData, title: formData.title.trim(), description: formData.description.trim(), location: formData.location.trim() });
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

          <IssueIntelligence
            title={formData.title}
            description={formData.description}
            location={formData.location}
            category={formData.category}
            onApply={applyAiSuggestions}
          />

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

          <div className="location-tools">
            <button type="button" className="secondary-button" onClick={detectLocation} disabled={locating}>{locating ? "Getting GPS..." : "Use my current location"}</button>
            {formData.coordinates && <span className="muted">GPS: {formData.coordinates.latitude}, {formData.coordinates.longitude}</span>}
          </div>

          <label>
            Evidence image URL
            <div className="inline-form-row">
              <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://example.com/photo.jpg" />
              <button type="button" className="secondary-button" onClick={addImage} disabled={!imageUrl.trim() || remainingImages === 0}>Add</button>
            </div>
          </label>

          {formData.images.length > 0 && (
            <div className="image-preview-grid">
              {formData.images.map((url) => (
                <figure key={url} className="evidence-preview">
                  <img src={url} alt="Issue evidence" />
                  <button type="button" onClick={() => removeImage(url)} aria-label="Remove evidence image">Remove</button>
                </figure>
              ))}
            </div>
          )}

          <p className="muted">{remainingImages} evidence image slot{remainingImages === 1 ? "" : "s"} remaining.</p>
          <button type="submit" disabled={loading}>{loading ? "Submitting report..." : "Submit issue"}</button>
        </form>
      </section>
    </main>
  );
};

export default CreateIssue;
