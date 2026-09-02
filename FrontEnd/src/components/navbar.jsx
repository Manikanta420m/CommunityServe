import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const logoutHandler = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="brand">CommunityServe</Link>
      <div className="nav-links">
        {isLoggedIn ? (
          <>
            <Link to="/">Dashboard</Link>
            <Link to="/my-issues">My Issues</Link>
            <Link to="/create-issue">Report Issue</Link>
            {storedUser?.role === "admin" && (
              <>
                <Link to="/admin">Admin</Link>
                <Link to="/admin/users">Users</Link>
              </>
            )}
            <Link to="/profile">Profile</Link>
            <button className="logout-btn" onClick={logoutHandler}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="nav-register">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
