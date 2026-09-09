import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  UserRound,
  ShieldCheck,
  Store,
  MoreHorizontal,
  Eye,
  Pencil,
  X,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  Mail,
  CalendarDays,
  Building2,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
// import "./AdminUsers.css";

const PAGE_SIZE = 10;

const ROLE_OPTIONS = [
  { value: "all", label: "All users" },
  { value: "user", label: "Customers" },
  { value: "admin", label: "Admins" },
];

const EMPTY_USER = {
  id: "",
  full_name: "",
  business_name: "",
  avatar_url: "",
  role: "user",
  created_at: "",
};

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name) {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);

  const [openMenu, setOpenMenu] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [editUser, setEditUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const { data, error: usersError } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          business_name,
          avatar_url,
          role,
          created_at
        `
        )
        .order("created_at", { ascending: false });

      if (usersError) {
        throw usersError;
      }

      setUsers(data || []);
    } catch (err) {
      console.error("Admin users loading error:", err);
      setError(err.message || "Unable to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === "all" ||
        String(user.role || "").toLowerCase() === roleFilter;

      const matchesSearch =
        !query ||
        String(user.full_name || "")
          .toLowerCase()
          .includes(query) ||
        String(user.business_name || "")
          .toLowerCase()
          .includes(query) ||
        String(user.id || "")
          .toLowerCase()
          .includes(query);

      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const totalUsers = users.length;

  const totalCustomers = users.filter((user) => user.role === "user").length;

  const totalAdmins = users.filter((user) => user.role === "admin").length;

  const userIds = users.map((user) => user.id);

  const [activeSellerIds, setActiveSellerIds] = useState(new Set());

  const loadActiveSellers = async () => {
    try {
      if (userIds.length === 0) {
        setActiveSellerIds(new Set());
        return;
      }

      const { data, error } = await supabase
        .from("user_plans")
        .select("user_id")
        .eq("status", "active")
        .gt("expired_at", new Date().toISOString())
        .in("user_id", userIds);

      if (error) {
        console.error("Active seller loading error:", error);
        return;
      }

      setActiveSellerIds(new Set((data || []).map((plan) => plan.user_id)));
    } catch (err) {
      console.error("Active seller error:", err);
    }
  };

  useEffect(() => {
    loadActiveSellers();
  }, [users]);

  const totalActiveSellers = activeSellerIds.size;

  const getRoleLabel = (role) => {
    if (role === "admin") return "Admin";
    return "Customer";
  };

  const getRoleIcon = (role) => {
    if (role === "admin") {
      return <ShieldCheck size={14} />;
    }

    return <UserRound size={14} />;
  };

  const getRoleClass = (role) => {
    if (role === "admin") return "admin";
    return "customer";
  };

  const handleRoleChange = async () => {
    if (!editUser) return;

    if (editUser.id === (await getCurrentUserId())) {
      alert("You cannot change your own admin role from here.");
      return;
    }

    try {
      setSaving(true);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          role: editUser.role,
        })
        .eq("id", editUser.id);

      if (updateError) {
        throw updateError;
      }

      setUsers((current) =>
        current.map((user) =>
          user.id === editUser.id ? { ...user, role: editUser.role } : user
        )
      );

      setEditUser(null);
      setOpenMenu(null);
    } catch (err) {
      console.error("Role update error:", err);
      alert(err.message || "Unable to update user role.");
    } finally {
      setSaving(false);
    }
  };

  const getCurrentUserId = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id;
  };

  const openEdit = (user) => {
    setEditUser({
      ...user,
      role: user.role || "user",
    });

    setOpenMenu(null);
  };

  const openDetails = (user) => {
    setSelectedUser(user);
    setOpenMenu(null);
  };

  const closeMenus = () => {
    setOpenMenu(null);
  };

  if (loading) {
    return (
      <div className="sh-admin-users-page">
        <div className="sh-admin-users-loading">
          <LoaderCircle size={28} className="sh-admin-users-spinner" />
          <span>Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sh-admin-users-page" onClick={closeMenus}>
      <div className="sh-admin-users-container">
        {/* HEADER */}
        <div className="sh-admin-users-header">
          <div>
            <span className="sh-admin-users-eyebrow">USER MANAGEMENT</span>

            <h1>Users</h1>

            <p>
              Manage SellaHub customers, sellers, and administrators from one
              place.
            </p>
          </div>

          <button
            type="button"
            className="sh-admin-users-refresh"
            onClick={() => loadUsers(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "sh-admin-users-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="sh-admin-users-error">
            <span>{error}</span>

            <button type="button" onClick={() => loadUsers()}>
              Try again
            </button>
          </div>
        )}

        {/* STATS */}
        <div className="sh-admin-users-stats">
          <div className="sh-admin-user-stat">
            <div className="sh-admin-user-stat-icon">
              <Users size={19} />
            </div>

            <div>
              <span>Total users</span>
              <strong>{totalUsers}</strong>
            </div>
          </div>

          <div className="sh-admin-user-stat">
            <div className="sh-admin-user-stat-icon seller">
              <Store size={19} />
            </div>

            <div>
              <span>Active sellers</span>
              <strong>{totalActiveSellers}</strong>
            </div>
          </div>

          <div className="sh-admin-user-stat">
            <div className="sh-admin-user-stat-icon customer">
              <UserRound size={19} />
            </div>

            <div>
              <span>Customers</span>
              <strong>{totalCustomers}</strong>
            </div>
          </div>

          <div className="sh-admin-user-stat">
            <div className="sh-admin-user-stat-icon admin">
              <ShieldCheck size={19} />
            </div>

            <div>
              <span>Administrators</span>
              <strong>{totalAdmins}</strong>
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="sh-admin-users-toolbar">
          <div className="sh-admin-users-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search users or business name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="sh-admin-users-clear-search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="sh-admin-users-filters">
            {ROLE_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                className={roleFilter === option.value ? "active" : ""}
                onClick={() => setRoleFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div className="sh-admin-users-card">
          <div className="sh-admin-users-card-top">
            <div>
              <h2>All users</h2>

              <span>
                {filteredUsers.length}{" "}
                {filteredUsers.length === 1 ? "user" : "users"} found
              </span>
            </div>
          </div>

          {paginatedUsers.length === 0 ? (
            <div className="sh-admin-users-empty">
              <div className="sh-admin-users-empty-icon">
                <Users size={24} />
              </div>

              <h3>No users found</h3>

              <p>Try changing your search or filter to find another user.</p>
            </div>
          ) : (
            <div className="sh-admin-users-table-wrap">
              <table className="sh-admin-users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Account</th>
                    <th>Joined</th>
                    <th className="actions-column">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedUsers.map((user) => {
                    const isSeller = activeSellerIds.has(user.id);

                    return (
                      <tr key={user.id}>
                        {/* USER */}
                        <td>
                          <div className="sh-admin-user-person">
                            <div className="sh-admin-user-avatar">
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.full_name || "User"}
                                />
                              ) : (
                                getInitials(
                                  user.full_name || user.business_name
                                )
                              )}
                            </div>

                            <div className="sh-admin-user-name">
                              <strong>
                                {user.full_name || "Unnamed user"}
                              </strong>

                              {user.business_name && (
                                <span>
                                  <Building2 size={12} />
                                  {user.business_name}
                                </span>
                              )}

                              <small>{user.id.slice(0, 8)}...</small>
                            </div>
                          </div>
                        </td>

                        {/* ROLE */}
                        <td>
                          <span
                            className={`sh-admin-user-role ${getRoleClass(
                              user.role
                            )}`}
                          >
                            {getRoleIcon(user.role)}
                            {getRoleLabel(user.role)}
                          </span>
                        </td>

                        {/* ACCOUNT */}
                        <td>
                          {isSeller ? (
                            <span className="sh-admin-user-account seller">
                              <Store size={14} />
                              Active seller
                            </span>
                          ) : (
                            <span className="sh-admin-user-account customer">
                              <UserRound size={14} />
                              Customer
                            </span>
                          )}
                        </td>

                        {/* JOINED */}
                        <td>
                          <div className="sh-admin-user-date">
                            <CalendarDays size={14} />
                            {formatDate(user.created_at)}
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td>
                          <div className="sh-admin-user-actions">
                            <button
                              type="button"
                              className="sh-admin-user-menu-trigger"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenu(
                                  openMenu === user.id ? null : user.id
                                );
                              }}
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {openMenu === user.id && (
                              <div
                                className="sh-admin-user-menu"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => openDetails(user)}
                                >
                                  <Eye size={15} />
                                  View user
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openEdit(user)}
                                >
                                  <Pencil size={15} />
                                  Change role
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          {filteredUsers.length > PAGE_SIZE && (
            <div className="sh-admin-users-pagination">
              <span>
                Page {currentPage} of {totalPages}
              </span>

              <div>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIEW USER MODAL */}
      {selectedUser && (
        <div
          className="sh-admin-user-modal-backdrop"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="sh-admin-user-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sh-admin-user-modal-header">
              <div>
                <span>User details</span>
                <h2>{selectedUser.full_name || "Unnamed user"}</h2>
              </div>

              <button type="button" onClick={() => setSelectedUser(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="sh-admin-user-profile">
              <div className="sh-admin-user-profile-avatar">
                {selectedUser.avatar_url ? (
                  <img
                    src={selectedUser.avatar_url}
                    alt={selectedUser.full_name || "User"}
                  />
                ) : (
                  getInitials(
                    selectedUser.full_name || selectedUser.business_name
                  )
                )}
              </div>

              <div>
                <h3>{selectedUser.full_name || "Unnamed user"}</h3>

                {selectedUser.business_name && (
                  <p>{selectedUser.business_name}</p>
                )}
              </div>
            </div>

            <div className="sh-admin-user-details-grid">
              <div>
                <span>Role</span>

                <strong>{getRoleLabel(selectedUser.role)}</strong>
              </div>

              <div>
                <span>Account</span>

                <strong>
                  {activeSellerIds.has(selectedUser.id)
                    ? "Active seller"
                    : "Customer"}
                </strong>
              </div>

              <div>
                <span>Joined</span>

                <strong>{formatDate(selectedUser.created_at)}</strong>
              </div>

              <div>
                <span>User ID</span>

                <strong className="sh-admin-user-id">{selectedUser.id}</strong>
              </div>
            </div>

            <div className="sh-admin-user-modal-footer">
              <button
                type="button"
                className="secondary"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>

              <button
                type="button"
                className="primary"
                onClick={() => {
                  setSelectedUser(null);
                  openEdit(selectedUser);
                }}
              >
                <Pencil size={15} />
                Change role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {editUser && (
        <div
          className="sh-admin-user-modal-backdrop"
          onClick={() => !saving && setEditUser(null)}
        >
          <div
            className="sh-admin-user-modal sh-admin-user-edit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sh-admin-user-modal-header">
              <div>
                <span>User management</span>
                <h2>Change role</h2>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => setEditUser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="sh-admin-user-edit-person">
              <div className="sh-admin-user-profile-avatar small">
                {editUser.avatar_url ? (
                  <img
                    src={editUser.avatar_url}
                    alt={editUser.full_name || "User"}
                  />
                ) : (
                  getInitials(editUser.full_name || editUser.business_name)
                )}
              </div>

              <div>
                <strong>{editUser.full_name || "Unnamed user"}</strong>

                {editUser.business_name && (
                  <span>{editUser.business_name}</span>
                )}
              </div>
            </div>

            <label className="sh-admin-user-form-label">
              Account role
              <select
                value={editUser.role}
                onChange={(e) =>
                  setEditUser((current) => ({
                    ...current,
                    role: e.target.value,
                  }))
                }
                disabled={saving}
              >
                <option value="user">Customer</option>
                <option value="admin">Administrator</option>
              </select>
            </label>

            <div className="sh-admin-user-role-warning">
              <ShieldCheck size={17} />

              <p>
                Administrator access gives this account access to the SellaHub
                admin area. Only assign this role to trusted administrators.
              </p>
            </div>

            <div className="sh-admin-user-modal-footer">
              <button
                type="button"
                className="secondary"
                disabled={saving}
                onClick={() => setEditUser(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary"
                disabled={saving}
                onClick={handleRoleChange}
              >
                {saving ? (
                  <>
                    <LoaderCircle
                      size={15}
                      className="sh-admin-users-spinner"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Pencil size={15} />
                    Save role
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
