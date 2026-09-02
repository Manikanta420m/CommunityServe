import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";

import { getDepartments } from "../services/departmentService";
import { getUsers, updateUser } from "../services/adminUserService";
import { getCurrentUser } from "../services/userService";

const roles = ["user", "authority", "admin"];

const UserManagement = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const me = await getCurrentUser();
      setCurrentUser(me);
      if (me.role !== "admin") return;
      const [userData, departmentData] = await Promise.all([
        getUsers(),
        getDepartments(),
      ]);
      setUsers(userData);
      setDepartments(departmentData);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesSearch = !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const saveUser = async (userId, patch) => {
    try {
      setSavingId(userId);
      const updated = await updateUser(userId, patch);
      setUsers((current) => current.map((item) => item._id === updated._id ? updated : item));
      toast.success("User updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update user");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <main className="container"><p>Loading user management...</p></main>;
  if (!currentUser || currentUser.role !== "admin") return <Navigate to="/" replace />;

  return (
    <main className="container">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>User Management</h1>
          <p className="muted">Promote staff, assign authorities to departments, and deactivate accounts when needed.</p>
        </div>
        <Link className="secondary-button" to="/admin">Back to admin</Link>
      </div>

      <section className="filter-panel user-filter-panel">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email"
          aria-label="Search users"
        />
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter by role">
          <option value="">All roles</option>
          {roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
      </section>

      <section className="user-list">
        {visibleUsers.length === 0 ? (
          <div className="empty-state"><h3>No users found</h3><p>Try a different search or role filter.</p></div>
        ) : visibleUsers.map((user) => (
          <article className="user-admin-card" key={user._id}>
            <div className="user-admin-summary">
              <div>
                <h2>{user.name}</h2>
                <p>{user.email}</p>
                <span className={`badge ${user.isActive ? "" : "status-closed"}`}>
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="user-admin-controls">
                <label>
                  Role
                  <select
                    value={user.role}
                    disabled={savingId === user._id || user._id === currentUser.id}
                    onChange={(event) => saveUser(user._id, {
                      role: event.target.value,
                      department: event.target.value === "authority" ? user.department?._id || "" : null,
                    })}
                  >
                    {roles.map((role) => <option key={role}>{role}</option>)}
                  </select>
                </label>

                {user.role === "authority" && (
                  <label>
                    Department
                    <select
                      value={user.department?._id || ""}
                      disabled={savingId === user._id}
                      onChange={(event) => saveUser(user._id, { department: event.target.value })}
                    >
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option key={department._id} value={department._id}>{department.name}</option>
                      ))}
                    </select>
                  </label>
                )}

                <button
                  type="button"
                  className={user.isActive ? "danger-button" : "secondary-button"}
                  disabled={savingId === user._id || user._id === currentUser.id}
                  onClick={() => saveUser(user._id, { isActive: !user.isActive })}
                >
                  {user.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>

            <div className="assignment-summary">
              <span className="muted">Department: {user.department?.name || "None"}</span>
              <span className="muted">Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
};

export default UserManagement;
