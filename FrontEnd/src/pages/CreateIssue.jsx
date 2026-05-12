import { useState } from "react";
import toast from "react-hot-toast";
import { createIssue } from "../services/issueService";

const CreateIssue = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createIssue(formData);
   toast.success("Issue Created Successfully");
    } catch (error) {
      console.log(error);
      toast.error("Issue Creation Failed");
    }
  };

  return (
    <div className="container">
      <h1>Create Issue</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Title"
          onChange={handleChange}
        />

        <br />

        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
        />

        <br />

        <input
          type="text"
          name="category"
          placeholder="Category"
          onChange={handleChange}
        />

        <br />

        <input
          type="text"
          name="location"
          placeholder="Location"
          onChange={handleChange}
        />

        <br />

        <button type="submit">Create Issue</button>
      </form>
    </div>
  );
};

export default CreateIssue;