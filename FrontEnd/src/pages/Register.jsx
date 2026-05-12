import { useState } from "react";
import toast from "react-hot-toast";
import { registerUser } from "../services/authService";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
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
      const data = await registerUser(formData);

      console.log(data);
      toast.success("User Registered Successfully");
    } catch (error) {
      console.log(error);
      toast.error("Registration Failed");;
    }
  };

  return (
    <div className="container">
      <h1>Register</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Enter Name"
          onChange={handleChange}
        />

        <br />

        <input
          type="email"
          name="email"
          placeholder="Enter Email"
          onChange={handleChange}
        />

        <br />

        <input
          type="password"
          name="password"
          placeholder="Enter Password"
          onChange={handleChange}
        />

        <br />

        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;