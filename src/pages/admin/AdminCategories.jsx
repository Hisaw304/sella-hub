import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  FolderTree,
  Package,
  BriefcaseBusiness,
  X,
  Save,
  Loader2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
// import "./AdminCategories.css";

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  image_url: "",
  is_active: true,
  sort_order: 0,
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const formatDate = (date) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [openMenu, setOpenMenu] = useState(null);

  const [deleteModal, setDeleteModal] = useState(null);

  /* =====================================================
     LOAD CATEGORIES
  ===================================================== */

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: categoriesError } = await supabase
        .from("categories")
        .select(
          `
          id,
          name,
          slug,
          description,
          icon,
          image_url,
          is_active,
          sort_order,
          created_at,
          updated_at
        `
        )
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (categoriesError) throw categoriesError;

      /*
       * Get listing counts separately.
       * This avoids depending on a specific Supabase
       * relationship name.
       */
      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .select("id, category_id");

      if (listingError) throw listingError;

      const listingCounts = {};

      (listingData || []).forEach((listing) => {
        if (!listing.category_id) return;

        listingCounts[listing.category_id] =
          (listingCounts[listing.category_id] || 0) + 1;
      });

      const categoriesWithCounts = (data || []).map((category) => ({
        ...category,
        listing_count: listingCounts[category.id] || 0,
      }));

      setCategories(categoriesWithCounts);
    } catch (err) {
      console.error("Admin categories error:", err);
      setError(err.message || "Unable to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  /* =====================================================
     FILTERED CATEGORIES
  ===================================================== */

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        category.name?.toLowerCase().includes(searchValue) ||
        category.slug?.toLowerCase().includes(searchValue) ||
        category.description?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && category.is_active) ||
        (statusFilter === "inactive" && !category.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  /* =====================================================
     STATS
  ===================================================== */

  const totalCategories = categories.length;

  const activeCategories = categories.filter(
    (category) => category.is_active
  ).length;

  const inactiveCategories = categories.filter(
    (category) => !category.is_active
  ).length;

  const totalListings = categories.reduce(
    (total, category) => total + (category.listing_count || 0),
    0
  );

  /* =====================================================
     FORM
  ===================================================== */

  const openAddModal = () => {
    setEditingCategory(null);

    setForm({
      ...EMPTY_FORM,
      sort_order: categories.length,
    });

    setShowModal(true);
    setOpenMenu(null);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);

    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      icon: category.icon || "",
      image_url: category.image_url || "",
      is_active: category.is_active ?? true,
      sort_order: category.sort_order ?? 0,
    });

    setShowModal(true);
    setOpenMenu(null);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCategory(null);
    setForm(EMPTY_FORM);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNameChange = (event) => {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      name: value,
      slug: editingCategory ? current.slug : slugify(value),
    }));
  };

  /* =====================================================
     SAVE CATEGORY
  ===================================================== */

  const saveCategory = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || null,
        icon: form.icon.trim() || null,
        image_url: form.image_url.trim() || null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
        updated_at: new Date().toISOString(),
      };

      if (editingCategory) {
        const { error: updateError } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingCategory.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("categories")
          .insert(payload);

        if (insertError) throw insertError;
      }

      closeModal();
      await loadCategories();
    } catch (err) {
      console.error("Save category error:", err);
      setError(err.message || "Unable to save category.");
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     TOGGLE ACTIVE
  ===================================================== */

  const toggleCategory = async (category) => {
    try {
      setActionLoading(`toggle-${category.id}`);
      setOpenMenu(null);
      setError("");

      const { error: updateError } = await supabase
        .from("categories")
        .update({
          is_active: !category.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", category.id);

      if (updateError) throw updateError;

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? {
                ...item,
                is_active: !item.is_active,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Toggle category error:", err);
      setError(err.message || "Unable to update category.");
    } finally {
      setActionLoading("");
    }
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const confirmDelete = (category) => {
    setDeleteModal(category);
    setOpenMenu(null);
  };

  const deleteCategory = async () => {
    if (!deleteModal) return;

    try {
      setActionLoading(`delete-${deleteModal.id}`);
      setError("");

      /*
       * Prevent deleting categories that still have listings.
       */
      if ((deleteModal.listing_count || 0) > 0) {
        throw new Error(
          "This category still has listings. Move or remove those listings before deleting the category."
        );
      }

      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", deleteModal.id);

      if (deleteError) throw deleteError;

      setCategories((current) =>
        current.filter((item) => item.id !== deleteModal.id)
      );

      setDeleteModal(null);
    } catch (err) {
      console.error("Delete category error:", err);
      setError(err.message || "Unable to delete category.");
    } finally {
      setActionLoading("");
    }
  };

  /* =====================================================
     MOVE SORT ORDER
  ===================================================== */

  const moveCategory = async (category, direction) => {
    const index = categories.findIndex((item) => item.id === category.id);

    if (index === -1) return;

    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= categories.length) return;

    const target = categories[newIndex];

    try {
      setActionLoading(`sort-${category.id}`);
      setOpenMenu(null);
      setError("");

      await Promise.all([
        supabase
          .from("categories")
          .update({
            sort_order: target.sort_order,
            updated_at: new Date().toISOString(),
          })
          .eq("id", category.id),

        supabase
          .from("categories")
          .update({
            sort_order: category.sort_order,
            updated_at: new Date().toISOString(),
          })
          .eq("id", target.id),
      ]);

      await loadCategories();
    } catch (err) {
      console.error("Sort category error:", err);
      setError(err.message || "Unable to reorder categories.");
    } finally {
      setActionLoading("");
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="sh-admin-categories">
      {/* HEADER */}

      <div className="sh-admin-categories-header">
        <div>
          <span className="sh-admin-eyebrow">Marketplace structure</span>

          <h1>Categories</h1>

          <p>
            Manage the categories that organize products and services across
            SellaHub.
          </p>
        </div>

        <button
          type="button"
          className="sh-admin-primary-btn"
          onClick={openAddModal}
        >
          <Plus size={17} />
          Add category
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="sh-admin-category-error">
          <XCircle size={18} />
          <span>{error}</span>

          <button type="button" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* STATS */}

      <div className="sh-admin-category-stats">
        <div className="sh-admin-category-stat">
          <div className="sh-admin-category-stat-icon">
            <FolderTree size={19} />
          </div>

          <div>
            <span>Total categories</span>
            <strong>{totalCategories}</strong>
          </div>
        </div>

        <div className="sh-admin-category-stat">
          <div className="sh-admin-category-stat-icon">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <span>Active categories</span>
            <strong>{activeCategories}</strong>
          </div>
        </div>

        <div className="sh-admin-category-stat">
          <div className="sh-admin-category-stat-icon">
            <XCircle size={19} />
          </div>

          <div>
            <span>Inactive categories</span>
            <strong>{inactiveCategories}</strong>
          </div>
        </div>

        <div className="sh-admin-category-stat">
          <div className="sh-admin-category-stat-icon">
            <Package size={19} />
          </div>

          <div>
            <span>Listings assigned</span>
            <strong>{totalListings}</strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}

      <div className="sh-admin-category-toolbar">
        <div className="sh-admin-category-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button type="button" onClick={() => setSearch("")}>
              <X size={15} />
            </button>
          )}
        </div>

        <div className="sh-admin-category-filters">
          <button
            type="button"
            className={statusFilter === "all" ? "active" : ""}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>

          <button
            type="button"
            className={statusFilter === "active" ? "active" : ""}
            onClick={() => setStatusFilter("active")}
          >
            Active
          </button>

          <button
            type="button"
            className={statusFilter === "inactive" ? "active" : ""}
            onClick={() => setStatusFilter("inactive")}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* TABLE */}

      <div className="sh-admin-category-card">
        {loading ? (
          <div className="sh-admin-category-loading">
            <Loader2 size={25} className="sh-spin" />
            <span>Loading categories...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="sh-admin-category-empty">
            <div className="sh-admin-category-empty-icon">
              <FolderTree size={25} />
            </div>

            <h3>No categories found</h3>

            <p>
              {search
                ? "Try adjusting your search."
                : "Create your first marketplace category."}
            </p>

            {!search && (
              <button
                type="button"
                className="sh-admin-primary-btn"
                onClick={openAddModal}
              >
                <Plus size={16} />
                Add category
              </button>
            )}
          </div>
        ) : (
          <div className="sh-admin-category-table-wrap">
            <table className="sh-admin-category-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Listings</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredCategories.map((category, index) => (
                  <tr key={category.id}>
                    {/* CATEGORY */}

                    <td>
                      <div className="sh-admin-category-name">
                        <div className="sh-admin-category-image">
                          {category.image_url ? (
                            <img src={category.image_url} alt={category.name} />
                          ) : (
                            <FolderTree size={19} />
                          )}
                        </div>

                        <div>
                          <strong>{category.name}</strong>

                          <span>/{category.slug}</span>
                        </div>
                      </div>
                    </td>

                    {/* DESCRIPTION */}

                    <td>
                      <p className="sh-admin-category-description">
                        {category.description || "No description"}
                      </p>
                    </td>

                    {/* LISTINGS */}

                    <td>
                      <span className="sh-admin-category-listing-count">
                        {category.listing_count || 0}
                      </span>
                    </td>

                    {/* SORT */}

                    <td>
                      <div className="sh-admin-category-order">
                        <span>{category.sort_order}</span>

                        <div className="sh-admin-sort-buttons">
                          <button
                            type="button"
                            disabled={
                              index === 0 ||
                              actionLoading === `sort-${category.id}`
                            }
                            onClick={() => moveCategory(category, -1)}
                            title="Move up"
                          >
                            <ChevronUp size={13} />
                          </button>

                          <button
                            type="button"
                            disabled={
                              index === filteredCategories.length - 1 ||
                              actionLoading === `sort-${category.id}`
                            }
                            onClick={() => moveCategory(category, 1)}
                            title="Move down"
                          >
                            <ChevronDown size={13} />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* STATUS */}

                    <td>
                      <span
                        className={`sh-admin-category-status ${
                          category.is_active ? "active" : "inactive"
                        }`}
                      >
                        {category.is_active ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <XCircle size={14} />
                        )}

                        {category.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* UPDATED */}

                    <td>
                      <span className="sh-admin-category-date">
                        {formatDate(category.updated_at || category.created_at)}
                      </span>
                    </td>

                    {/* ACTIONS */}

                    <td>
                      <div className="sh-admin-category-actions">
                        <button
                          type="button"
                          className="sh-admin-category-menu-trigger"
                          onClick={() =>
                            setOpenMenu(
                              openMenu === category.id ? null : category.id
                            )
                          }
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {openMenu === category.id && (
                          <div className="sh-admin-category-menu">
                            <button
                              type="button"
                              onClick={() => openEditModal(category)}
                            >
                              <Pencil size={15} />
                              Edit category
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleCategory(category)}
                            >
                              {category.is_active ? (
                                <>
                                  <XCircle size={15} />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={15} />
                                  Activate
                                </>
                              )}
                            </button>

                            <div className="sh-admin-category-menu-divider" />

                            <button
                              type="button"
                              className="danger"
                              onClick={() => confirmDelete(category)}
                            >
                              <Trash2 size={15} />
                              Delete category
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <div
          className="sh-admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="sh-admin-category-modal">
            <div className="sh-admin-category-modal-header">
              <div>
                <span className="sh-admin-eyebrow">
                  {editingCategory ? "Category settings" : "New category"}
                </span>

                <h2>{editingCategory ? "Edit category" : "Add category"}</h2>
              </div>

              <button type="button" onClick={closeModal} disabled={saving}>
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveCategory}>
              <div className="sh-admin-category-form-grid">
                <div className="sh-admin-form-field">
                  <label>
                    Category name <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Electronics"
                    required
                  />
                </div>

                <div className="sh-admin-form-field">
                  <label>Slug</label>

                  <input
                    type="text"
                    name="slug"
                    value={form.slug}
                    onChange={handleFormChange}
                    placeholder="electronics"
                  />

                  <small>Used in the public category URL.</small>
                </div>
              </div>

              <div className="sh-admin-form-field">
                <label>Description</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Describe what belongs in this category..."
                  rows={4}
                />
              </div>

              <div className="sh-admin-category-form-grid">
                <div className="sh-admin-form-field">
                  <label>Icon</label>

                  <input
                    type="text"
                    name="icon"
                    value={form.icon}
                    onChange={handleFormChange}
                    placeholder="e.g. Smartphone"
                  />

                  <small>Store the icon name used by the frontend.</small>
                </div>

                <div className="sh-admin-form-field">
                  <label>Sort order</label>

                  <input
                    type="number"
                    name="sort_order"
                    value={form.sort_order}
                    onChange={handleFormChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="sh-admin-form-field">
                <label>Image URL</label>

                <div className="sh-admin-image-input">
                  <ImageIcon size={17} />

                  <input
                    type="url"
                    name="image_url"
                    value={form.image_url}
                    onChange={handleFormChange}
                    placeholder="https://..."
                  />
                </div>

                <small>
                  Optional. Your current public category images are local React
                  assets, so this can remain empty for now.
                </small>
              </div>

              {form.image_url && (
                <div className="sh-admin-category-image-preview">
                  <img src={form.image_url} alt="Category preview" />
                </div>
              )}

              <label className="sh-admin-category-toggle">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleFormChange}
                />

                <span className="sh-admin-toggle-ui" />

                <span>
                  <strong>Active category</strong>
                  <small>
                    Allow customers and sellers to use this category.
                  </small>
                </span>
              </label>

              <div className="sh-admin-category-modal-footer">
                <button
                  type="button"
                  className="sh-admin-secondary-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="sh-admin-primary-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="sh-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingCategory ? "Save changes" : "Create category"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}

      {deleteModal && (
        <div
          className="sh-admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeleteModal(null);
            }
          }}
        >
          <div className="sh-admin-delete-modal">
            <div className="sh-admin-delete-icon">
              <Trash2 size={21} />
            </div>

            <h2>Delete category?</h2>

            <p>
              You're about to delete <strong>{deleteModal.name}</strong>. This
              action cannot be undone.
            </p>

            {deleteModal.listing_count > 0 && (
              <div className="sh-admin-delete-warning">
                This category currently has{" "}
                <strong>
                  {deleteModal.listing_count} listing
                  {deleteModal.listing_count === 1 ? "" : "s"}
                </strong>
                . You must move those listings to another category before
                deleting it.
              </div>
            )}

            <div className="sh-admin-category-modal-footer">
              <button
                type="button"
                className="sh-admin-secondary-btn"
                onClick={() => setDeleteModal(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="sh-admin-danger-btn"
                disabled={
                  deleteModal.listing_count > 0 ||
                  actionLoading === `delete-${deleteModal.id}`
                }
                onClick={deleteCategory}
              >
                {actionLoading === `delete-${deleteModal.id}` ? (
                  <>
                    <Loader2 size={16} className="sh-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete category
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
