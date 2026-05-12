import { Link, useNavigate } from "react-router-dom";
<Link to="/profile">Profile</Link>
flexWrap: "wrap"
const Navbar = () => {
  const navigate = useNavigate();

  const logoutHandler = () => {
    localStorage.removeItem("token");

    navigate("/login");
  };

  return (
    <div
      style={{
  display: "flex",
  gap: "20px",
  padding: "20px",
  backgroundColor: "#222",
  color: "white",
  flexWrap: "wrap",
  alignItems: "center",
}}
    >
      <Link
  to="/"
  style={{ color: "white", textDecoration: "none" }}
>
  Dashboard
</Link>

      <Link to="/create-issue">Create Issue</Link>

      <Link to="/login">Login</Link>

      <Link to="/register">Register</Link>

      <button onClick={logoutHandler}>Logout</button>
    </div>
  );
};

export default Navbar;