import { useState } from "react";

function ReportIssue() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,

      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log(formData);
  };

  return (
    <div className="container">
      <h1>Report Issue</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Issue Title"
          onChange={handleChange}
        />

        <br />
        <br />

        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
        />

        <br />
        <br />

        <input
          type="text"
          name="location"
          placeholder="Location"
          onChange={handleChange}
        />

        <br />
        <br />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default ReportIssue;