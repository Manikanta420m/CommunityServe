import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <h2>Civic Reporter</h2>

      <div>
        <Link to="/">Home</Link>

        <Link to="/report">Report Issue</Link>
      </div>
    </nav>
  );
}

export default Navbar;