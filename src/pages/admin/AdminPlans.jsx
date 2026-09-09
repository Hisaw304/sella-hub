import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Star,
  ShieldCheck,
  Image,
  Eye,
  Headphones,
  BadgeCheck,
  Home,
  SearchCheck,
  Layers3,
  X,
  Save,
  Loader2,
  MoreVertical,
  ToggleLeft,
  ToggleRight,
  Package,
} from "lucide-react";
// import "./AdminPlans.css";

const EMPTY_FORM = {
  name: "",
  slug: "",
  price: "",
  description: "",
  features: "",
  max_listings: 1,
  max_images: 1,
  visibility_level: "standard",
  priority_category_placement: false,
  priority_search_placement: false,
  priority_support: false,
  featured_homepage: false,
  verified_buisness_badge: false,
  is_popular: false,
  is_active: true,
};

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(price || 0));
};

const createSlug = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const parseFeatures = (features) => {
  if (!features) return [];

  if (Array.isArray(features)) {
    return features;
  }

  try {
    const parsed = JSON.parse(features);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const featuresToDatabase = (featuresText) => {
  return featuresText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
};

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [openMenu, setOpenMenu] = useState(null);
  const [deletePlan, setDeletePlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: plansError } = await supabase
        .from("pricing_plans")
        .select("*")
        .order("price", { ascending: true });

      if (plansError) throw plansError;

      setPlans(data || []);
    } catch (err) {
      console.error("Admin plans error:", err);
      setError(err.message || "Unable to load pricing plans.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();

    return plans.filter((plan) => {
      const matchesSearch =
        !query ||
        plan.name?.toLowerCase().includes(query) ||
        plan.slug?.toLowerCase().includes(query) ||
        plan.description?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && plan.is_active) ||
        (statusFilter === "inactive" && !plan.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [plans, search, statusFilter]);

  const stats = useMemo(() => {
    const active = plans.filter((plan) => plan.is_active);
    const popular = plans.filter((plan) => plan.is_popular);

    return {
      total: plans.length,
      active: active.length,
      inactive: plans.length - active.length,
      popular: popular.length,
    };
  }, [plans]);

  const openAddModal = () => {
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    const features = parseFeatures(plan.features);

    setEditingPlan(plan);

    setForm({
      name: plan.name || "",
      slug: plan.slug || "",
      price: plan.price ?? "",
      description: plan.description || "",
      features: features.join("\n"),
      max_listings: plan.max_listings ?? 1,
      max_images: plan.max_images ?? 1,
      visibility_level: plan.visibility_level || "standard",
      priority_category_placement: Boolean(plan.priority_category_placement),
      priority_search_placement: Boolean(plan.priority_search_placement),
      priority_support: Boolean(plan.priority_support),
      featured_homepage: Boolean(plan.featured_homepage),
      verified_buisness_badge: Boolean(plan.verified_buisness_badge),
      is_popular: Boolean(plan.is_popular),
      is_active: plan.is_active !== false,
    });

    setError("");
    setSuccess("");
    setOpenMenu(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const handleChange = (event) => {
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
      slug: editingPlan ? current.slug : createSlug(value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.name.trim()) {
        throw new Error("Plan name is required.");
      }

      if (!form.slug.trim()) {
        throw new Error("Plan slug is required.");
      }

      if (form.price === "" || Number(form.price) < 0) {
        throw new Error("Please enter a valid plan price.");
      }

      if (Number(form.max_listings) < 1) {
        throw new Error("Maximum listings must be at least 1.");
      }

      if (Number(form.max_images) < 1) {
        throw new Error("Maximum images must be at least 1.");
      }

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        price: Number(form.price),
        description: form.description.trim() || null,
        features: featuresToDatabase(form.features),
        max_listings: Number(form.max_listings),
        max_images: Number(form.max_images),
        visibility_level: form.visibility_level,
        priority_category_placement: Boolean(form.priority_category_placement),
        priority_search_placement: Boolean(form.priority_search_placement),
        priority_support: Boolean(form.priority_support),
        featured_homepage: Boolean(form.featured_homepage),
        verified_buisness_badge: Boolean(form.verified_buisness_badge),
        is_popular: Boolean(form.is_popular),
        is_active: Boolean(form.is_active),
      };

      if (editingPlan) {
        const { data, error: updateError } = await supabase
          .from("pricing_plans")
          .update({
            ...payload,
            update_at: new Date().toISOString(),
          })
          .eq("id", editingPlan.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setPlans((current) =>
          current.map((plan) => (plan.id === editingPlan.id ? data : plan))
        );

        setSuccess("Plan updated successfully.");
      } else {
        const { data, error: insertError } = await supabase
          .from("pricing_plans")
          .insert(payload)
          .select()
          .single();

        if (insertError) throw insertError;

        setPlans((current) => [...current, data]);
        setSuccess("Plan created successfully.");
      }

      setTimeout(() => {
        setShowModal(false);
        setEditingPlan(null);
        setForm(EMPTY_FORM);
        setSuccess("");
      }, 700);
    } catch (err) {
      console.error("Save plan error:", err);
      setError(err.message || "Unable to save plan.");
    } finally {
      setSaving(false);
    }
  };

  const togglePlanStatus = async (plan) => {
    try {
      setOpenMenu(null);
      setError("");
      setSuccess("");

      const newStatus = !plan.is_active;

      const { data, error: updateError } = await supabase
        .from("pricing_plans")
        .update({
          is_active: newStatus,
          update_at: new Date().toISOString(),
        })
        .eq("id", plan.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setPlans((current) =>
        current.map((item) => (item.id === plan.id ? data : item))
      );

      setSuccess(
        newStatus
          ? `${plan.name} has been activated.`
          : `${plan.name} has been deactivated.`
      );

      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error("Toggle plan error:", err);
      setError(err.message || "Unable to update plan status.");
    }
  };

  const togglePopular = async (plan) => {
    try {
      setOpenMenu(null);
      setError("");
      setSuccess("");

      const newPopular = !plan.is_popular;

      const { data, error: updateError } = await supabase
        .from("pricing_plans")
        .update({
          is_popular: newPopular,
          update_at: new Date().toISOString(),
        })
        .eq("id", plan.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setPlans((current) =>
        current.map((item) => (item.id === plan.id ? data : item))
      );

      setSuccess(
        newPopular
          ? `${plan.name} marked as popular.`
          : `${plan.name} removed from popular plans.`
      );

      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error("Popular plan error:", err);
      setError(err.message || "Unable to update popular status.");
    }
  };

  const handleDelete = async () => {
    if (!deletePlan) return;

    try {
      setSaving(true);
      setError("");

      /*
        First check whether users are subscribed to this plan.
        This prevents deleting a plan that is already referenced
        by user_plans.
      */
      const { count, error: subscriptionError } = await supabase
        .from("user_plans")
        .select("id", { count: "exact", head: true })
        .eq("plan_id", deletePlan.id);

      if (subscriptionError) {
        throw subscriptionError;
      }

      if ((count || 0) > 0) {
        throw new Error(
          "This plan cannot be deleted because users are subscribed to it. Deactivate it instead."
        );
      }

      const { error: deleteError } = await supabase
        .from("pricing_plans")
        .delete()
        .eq("id", deletePlan.id);

      if (deleteError) throw deleteError;

      setPlans((current) =>
        current.filter((plan) => plan.id !== deletePlan.id)
      );

      setDeletePlan(null);

      setSuccess(`${deletePlan.name} has been deleted.`);

      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error("Delete plan error:", err);
      setError(err.message || "Unable to delete plan.");
      setDeletePlan(null);
    } finally {
      setSaving(false);
    }
  };

  const renderFeatureIcon = (type) => {
    const icons = {
      listings: <Layers3 size={16} />,
      images: <Image size={16} />,
      visibility: <Eye size={16} />,
      category: <Package size={16} />,
      search: <SearchCheck size={16} />,
      support: <Headphones size={16} />,
      featured: <Home size={16} />,
      verified: <BadgeCheck size={16} />,
    };

    return icons[type] || <CheckCircle2 size={16} />;
  };

  return (
    <div className="sh-admin-plans-page">
      <div className="sh-admin-plans-container">
        {/* HEADER */}
        <div className="sh-admin-plans-header">
          <div>
            <span className="sh-admin-eyebrow">SELLER MANAGEMENT</span>

            <h1>Pricing Plans</h1>

            <p>
              Create and manage the subscription plans sellers use to publish
              and promote their listings.
            </p>
          </div>

          <button
            type="button"
            className="sh-admin-plans-add-btn"
            onClick={openAddModal}
          >
            <Plus size={18} />
            Add Plan
          </button>
        </div>

        {/* SUCCESS */}
        {success && (
          <div className="sh-admin-alert sh-admin-alert-success">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* ERROR */}
        {error && !showModal && (
          <div className="sh-admin-alert sh-admin-alert-error">
            <XCircle size={18} />
            <span>{error}</span>

            <button type="button" onClick={() => setError("")}>
              <X size={15} />
            </button>
          </div>
        )}

        {/* STATS */}
        <div className="sh-admin-plans-stats">
          <div className="sh-admin-plan-stat">
            <div className="sh-admin-plan-stat-icon">
              <Layers3 size={20} />
            </div>

            <div>
              <span>Total Plans</span>
              <strong>{stats.total}</strong>
            </div>
          </div>

          <div className="sh-admin-plan-stat">
            <div className="sh-admin-plan-stat-icon active">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <span>Active Plans</span>
              <strong>{stats.active}</strong>
            </div>
          </div>

          <div className="sh-admin-plan-stat">
            <div className="sh-admin-plan-stat-icon inactive">
              <XCircle size={20} />
            </div>

            <div>
              <span>Inactive Plans</span>
              <strong>{stats.inactive}</strong>
            </div>
          </div>

          <div className="sh-admin-plan-stat">
            <div className="sh-admin-plan-stat-icon popular">
              <Star size={20} />
            </div>

            <div>
              <span>Popular Plans</span>
              <strong>{stats.popular}</strong>
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="sh-admin-plans-toolbar">
          <div className="sh-admin-plans-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search plans..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button type="button" onClick={() => setSearch("")}>
                <X size={15} />
              </button>
            )}
          </div>

          <div className="sh-admin-plans-filters">
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

        {/* PLANS */}
        <div className="sh-admin-plans-card">
          {loading ? (
            <div className="sh-admin-plans-loading">
              <Loader2 className="sh-spin" size={28} />
              <p>Loading pricing plans...</p>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="sh-admin-plans-empty">
              <div className="sh-admin-plans-empty-icon">
                <Package size={30} />
              </div>

              <h3>No plans found</h3>

              <p>
                {search || statusFilter !== "all"
                  ? "Try changing your search or filter."
                  : "Create your first pricing plan to get started."}
              </p>

              {!search && statusFilter === "all" && (
                <button type="button" onClick={openAddModal}>
                  <Plus size={17} />
                  Add Plan
                </button>
              )}
            </div>
          ) : (
            <div className="sh-admin-plans-grid">
              {filteredPlans.map((plan) => {
                const planFeatures = parseFeatures(plan.features);

                return (
                  <div
                    className={`sh-admin-plan-card ${
                      plan.is_popular ? "popular" : ""
                    } ${!plan.is_active ? "inactive" : ""}`}
                    key={plan.id}
                  >
                    {plan.is_popular && (
                      <div className="sh-admin-plan-popular">
                        <Star size={13} />
                        Most Popular
                      </div>
                    )}

                    <div className="sh-admin-plan-card-top">
                      <div>
                        <div className="sh-admin-plan-name-row">
                          <h2>{plan.name}</h2>

                          <span
                            className={`sh-admin-plan-status ${
                              plan.is_active ? "active" : "inactive"
                            }`}
                          >
                            {plan.is_active ? (
                              <>
                                <CheckCircle2 size={12} />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle size={12} />
                                Inactive
                              </>
                            )}
                          </span>
                        </div>

                        <span className="sh-admin-plan-slug">/{plan.slug}</span>
                      </div>

                      <div className="sh-admin-plan-menu-wrap">
                        <button
                          type="button"
                          className="sh-admin-plan-menu-btn"
                          onClick={() =>
                            setOpenMenu(openMenu === plan.id ? null : plan.id)
                          }
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openMenu === plan.id && (
                          <div className="sh-admin-plan-menu">
                            <button
                              type="button"
                              onClick={() => openEditModal(plan)}
                            >
                              <Pencil size={15} />
                              Edit plan
                            </button>

                            <button
                              type="button"
                              onClick={() => togglePopular(plan)}
                            >
                              <Star size={15} />
                              {plan.is_popular
                                ? "Remove popular"
                                : "Mark as popular"}
                            </button>

                            <button
                              type="button"
                              onClick={() => togglePlanStatus(plan)}
                            >
                              {plan.is_active ? (
                                <>
                                  <ToggleLeft size={16} />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleRight size={16} />
                                  Activate
                                </>
                              )}
                            </button>

                            <div className="sh-admin-plan-menu-divider" />

                            <button
                              type="button"
                              className="danger"
                              onClick={() => {
                                setDeletePlan(plan);
                                setOpenMenu(null);
                              }}
                            >
                              <Trash2 size={15} />
                              Delete plan
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sh-admin-plan-price">
                      <strong>{formatPrice(plan.price)}</strong>

                      <span>/ month</span>
                    </div>

                    <p className="sh-admin-plan-description">
                      {plan.description || "No description provided."}
                    </p>

                    <div className="sh-admin-plan-capacity">
                      <div>
                        <Layers3 size={15} />
                        <span>Listings</span>
                        <strong>{plan.max_listings}</strong>
                      </div>

                      <div>
                        <Image size={15} />
                        <span>Images</span>
                        <strong>{plan.max_images}</strong>
                      </div>
                    </div>

                    <div className="sh-admin-plan-features">
                      <h4>Plan features</h4>

                      {planFeatures.length > 0 ? (
                        <ul>
                          {planFeatures.map((feature, index) => (
                            <li key={`${plan.id}-feature-${index}`}>
                              <CheckCircle2 size={15} />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="sh-admin-plan-no-features">
                          No custom features listed.
                        </div>
                      )}
                    </div>

                    <div className="sh-admin-plan-benefits">
                      {plan.priority_support && (
                        <span>
                          {renderFeatureIcon("support")}
                          Priority support
                        </span>
                      )}

                      {plan.priority_category_placement && (
                        <span>
                          {renderFeatureIcon("category")}
                          Priority category
                        </span>
                      )}

                      {plan.priority_search_placement && (
                        <span>
                          {renderFeatureIcon("search")}
                          Priority search
                        </span>
                      )}

                      {plan.featured_homepage && (
                        <span>
                          {renderFeatureIcon("featured")}
                          Homepage featured
                        </span>
                      )}

                      {plan.verified_buisness_badge && (
                        <span>
                          {renderFeatureIcon("verified")}
                          Verified badge
                        </span>
                      )}
                    </div>

                    <div className="sh-admin-plan-card-footer">
                      <span>
                        Created{" "}
                        {plan.created_at
                          ? new Date(plan.created_at).toLocaleDateString(
                              "en-NG",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </span>

                      <button type="button" onClick={() => openEditModal(plan)}>
                        <Pencil size={14} />
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div
          className="sh-admin-plan-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="sh-admin-plan-modal">
            <div className="sh-admin-plan-modal-header">
              <div>
                <span className="sh-admin-eyebrow">
                  {editingPlan ? "EDIT PLAN" : "NEW PLAN"}
                </span>

                <h2>
                  {editingPlan ? "Edit pricing plan" : "Create pricing plan"}
                </h2>

                <p>Configure what sellers receive with this subscription.</p>
              </div>

              <button
                type="button"
                className="sh-admin-plan-modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="sh-admin-alert sh-admin-alert-error">
                <XCircle size={17} />
                <span>{error}</span>
              </div>
            )}

            <form className="sh-admin-plan-form" onSubmit={handleSubmit}>
              {/* BASIC INFORMATION */}
              <div className="sh-admin-plan-form-section">
                <div className="sh-admin-plan-section-heading">
                  <div>
                    <h3>Basic information</h3>
                    <p>Set the name, pricing and description of the plan.</p>
                  </div>
                </div>

                <div className="sh-admin-plan-form-grid">
                  <label>
                    <span>Plan name *</span>

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleNameChange}
                      placeholder="e.g. Premium"
                      required
                    />
                  </label>

                  <label>
                    <span>Slug *</span>

                    <input
                      type="text"
                      name="slug"
                      value={form.slug}
                      onChange={handleChange}
                      placeholder="premium"
                      required
                    />
                  </label>

                  <label>
                    <span>Price (₦) *</span>

                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      placeholder="150000"
                      required
                    />
                  </label>

                  <label>
                    <span>Visibility level</span>

                    <select
                      name="visibility_level"
                      value={form.visibility_level}
                      onChange={handleChange}
                    >
                      <option value="standard">Standard</option>

                      <option value="enhanced">Enhanced</option>

                      <option value="premium">Premium</option>
                    </select>
                  </label>

                  <label className="full">
                    <span>Description</span>

                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Describe what this plan offers sellers..."
                      rows="4"
                    />
                  </label>
                </div>
              </div>

              {/* CAPACITY */}
              <div className="sh-admin-plan-form-section">
                <div className="sh-admin-plan-section-heading">
                  <div>
                    <h3>Listing capacity</h3>
                    <p>Control how much sellers can publish under this plan.</p>
                  </div>
                </div>

                <div className="sh-admin-plan-form-grid">
                  <label>
                    <span>Maximum listings *</span>

                    <input
                      type="number"
                      name="max_listings"
                      value={form.max_listings}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      required
                    />
                  </label>

                  <label>
                    <span>Maximum images per listing *</span>

                    <input
                      type="number"
                      name="max_images"
                      value={form.max_images}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      required
                    />
                  </label>
                </div>
              </div>

              {/* FEATURES */}
              <div className="sh-admin-plan-form-section">
                <div className="sh-admin-plan-section-heading">
                  <div>
                    <h3>Plan features</h3>
                    <p>
                      Add one feature per line. These will appear on the plan
                      card.
                    </p>
                  </div>
                </div>

                <label>
                  <span>Features</span>

                  <textarea
                    name="features"
                    value={form.features}
                    onChange={handleChange}
                    placeholder={`Unlimited seller profile customization
Up to 15 active listings
10 images per listing
Priority search placement
Featured homepage placement`}
                    rows="7"
                  />
                </label>
              </div>

              {/* PLAN BENEFITS */}
              <div className="sh-admin-plan-form-section">
                <div className="sh-admin-plan-section-heading">
                  <div>
                    <h3>Plan benefits</h3>
                    <p>Choose the platform benefits included with this plan.</p>
                  </div>
                </div>

                <div className="sh-admin-plan-toggle-grid">
                  <label className="sh-admin-plan-toggle">
                    <input
                      type="checkbox"
                      name="priority_support"
                      checked={form.priority_support}
                      onChange={handleChange}
                    />

                    <span className="sh-admin-plan-toggle-box">
                      <Headphones size={18} />
                    </span>

                    <span>
                      <strong>Priority support</strong>
                      <small>Give sellers priority assistance.</small>
                    </span>
                  </label>

                  <label className="sh-admin-plan-toggle">
                    <input
                      type="checkbox"
                      name="priority_category_placement"
                      checked={form.priority_category_placement}
                      onChange={handleChange}
                    />

                    <span className="sh-admin-plan-toggle-box">
                      <Layers3 size={18} />
                    </span>

                    <span>
                      <strong>Priority category placement</strong>
                      <small>Give listings better category positioning.</small>
                    </span>
                  </label>

                  <label className="sh-admin-plan-toggle">
                    <input
                      type="checkbox"
                      name="priority_search_placement"
                      checked={form.priority_search_placement}
                      onChange={handleChange}
                    />

                    <span className="sh-admin-plan-toggle-box">
                      <SearchCheck size={18} />
                    </span>

                    <span>
                      <strong>Priority search placement</strong>
                      <small>Give listings higher search visibility.</small>
                    </span>
                  </label>

                  <label className="sh-admin-plan-toggle">
                    <input
                      type="checkbox"
                      name="featured_homepage"
                      checked={form.featured_homepage}
                      onChange={handleChange}
                    />

                    <span className="sh-admin-plan-toggle-box">
                      <Home size={18} />
                    </span>

                    <span>
                      <strong>Featured homepage</strong>
                      <small>
                        Allow listings to appear in homepage featured areas.
                      </small>
                    </span>
                  </label>

                  <label className="sh-admin-plan-toggle">
                    <input
                      type="checkbox"
                      name="verified_buisness_badge"
                      checked={form.verified_buisness_badge}
                      onChange={handleChange}
                    />

                    <span className="sh-admin-plan-toggle-box">
                      <ShieldCheck size={18} />
                    </span>

                    <span>
                      <strong>Verified business badge</strong>
                      <small>Show the verified seller badge.</small>
                    </span>
                  </label>

                  <label className="sh-admin-plan-toggle">
                    <input
                      type="checkbox"
                      name="is_popular"
                      checked={form.is_popular}
                      onChange={handleChange}
                    />

                    <span className="sh-admin-plan-toggle-box">
                      <Star size={18} />
                    </span>

                    <span>
                      <strong>Popular plan</strong>
                      <small>Highlight this plan as the popular option.</small>
                    </span>
                  </label>
                </div>
              </div>

              {/* STATUS */}
              <div className="sh-admin-plan-form-section">
                <div className="sh-admin-plan-section-heading">
                  <div>
                    <h3>Plan status</h3>
                    <p>Inactive plans cannot be selected by new sellers.</p>
                  </div>
                </div>

                <label className="sh-admin-plan-status-toggle">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />

                  <span className="sh-admin-plan-status-switch">
                    <span />
                  </span>

                  <span>
                    <strong>
                      {form.is_active ? "Plan is active" : "Plan is inactive"}
                    </strong>

                    <small>
                      {form.is_active
                        ? "Sellers can purchase this plan."
                        : "This plan is hidden from new purchases."}
                    </small>
                  </span>
                </label>
              </div>

              {/* FOOTER */}
              <div className="sh-admin-plan-form-footer">
                <button
                  type="button"
                  className="sh-admin-plan-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="sh-admin-plan-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={17} className="sh-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      {editingPlan ? "Save changes" : "Create plan"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deletePlan && (
        <div
          className="sh-admin-plan-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeletePlan(null);
            }
          }}
        >
          <div className="sh-admin-plan-delete-modal">
            <div className="sh-admin-plan-delete-icon">
              <Trash2 size={24} />
            </div>

            <h2>Delete {deletePlan.name}?</h2>

            <p>
              This action permanently removes this pricing plan. If users have
              subscribed to it, deletion will be blocked automatically.
            </p>

            <div className="sh-admin-plan-delete-actions">
              <button
                type="button"
                onClick={() => setDeletePlan(null)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="sh-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete plan
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
