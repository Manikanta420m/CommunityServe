import { useState } from "react";
import toast from "react-hot-toast";
import { loginUser } from "../services/authService";

const [loading, setLoading] = useState(false);

const Login = () => {
  const [formData, setFormData] = useState({
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
      const data = await loginUser(formData);

      console.log(data);

      localStorage.setItem("token", data.token);

      toast.success("Login Successful");
    } catch (error) {
      console.log(error);

      toast.error("Login Failed");
    }
  };

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
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

<button type="submit">
  {loading ? "Loading..." : "Login"}
</button>
      </form>
    </div>
  );
};

export default Login;