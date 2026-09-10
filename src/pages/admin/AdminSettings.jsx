import { useEffect, useState } from "react";
import {
  Save,
  Settings,
  Store,
  Bell,
  ShieldCheck,
  CreditCard,
  Wrench,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
// import "./AdminSettings.css";

const DEFAULT_SETTINGS = {
  marketplace_name: "SellaHub",
  marketplace_description:
    "Buy, sell, and connect with trusted sellers on SellaHub.",
  support_email: "",
  support_phone: "",
  default_currency: "NGN",
  default_country: "Nigeria",

  allow_registrations: true,
  require_email_verification: true,
  require_seller_verification: false,
  require_listing_approval: true,
  allow_listing_reports: true,
  allow_featured_listings: true,

  notify_new_listing: true,
  notify_listing_approved: true,
  notify_listing_rejected: true,
  notify_new_report: true,
  notify_verification_submitted: true,
  notify_verification_reviewed: true,
  notify_payment_received: true,

  maintenance_mode: false,
  maintenance_message:
    "SellaHub is currently undergoing maintenance. Please check back shortly.",
};

const BOOLEAN_SETTINGS = [
  "allow_registrations",
  "require_email_verification",
  "require_seller_verification",
  "require_listing_approval",
  "allow_listing_reports",
  "allow_featured_listings",
  "notify_new_listing",
  "notify_listing_approved",
  "notify_listing_rejected",
  "notify_new_report",
  "notify_verification_submitted",
  "notify_verification_reviewed",
  "notify_payment_received",
  "maintenance_mode",
];

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;

  return String(value).toLowerCase() === "true";
};

const normalizeSettings = (rows = []) => {
  const settings = { ...DEFAULT_SETTINGS };

  rows.forEach((row) => {
    if (!row?.setting_key) return;

    if (BOOLEAN_SETTINGS.includes(row.setting_key)) {
      settings[row.setting_key] = parseBoolean(row.setting_value);
    } else {
      settings[row.setting_key] =
        row.setting_value ?? DEFAULT_SETTINGS[row.setting_key] ?? "";
    }
  });

  return settings;
};

const Toggle = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      className={`sh-admin-settings-switch ${checked ? "active" : ""} ${
        disabled ? "disabled" : ""
      }`}
      onClick={() => !disabled && onChange(!checked)}
      aria-pressed={checked}
      disabled={disabled}
    >
      <span className="sh-admin-settings-switch-thumb" />
    </button>
  );
};

const SettingToggle = ({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="sh-admin-settings-toggle-row">
      <div className="sh-admin-settings-toggle-copy">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>

      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
};

export default function AdminSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [activeSection, setActiveSection] = useState("general");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================
     LOAD SETTINGS
  ========================================== */

  const loadSettings = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setSuccess("");

      const { data, error: settingsError } = await supabase
        .from("site_settings")
        .select("id, setting_key, setting_value, created_at, updated_at")
        .order("setting_key", { ascending: true });

      if (settingsError) {
        throw settingsError;
      }

      setSettings(normalizeSettings(data));
    } catch (err) {
      console.error("Admin settings error:", err);

      setError(err?.message || "Unable to load marketplace settings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  /* =========================================
     UPDATE LOCAL SETTING
  ========================================== */

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSuccess("");
    setError("");
  };

  /* =========================================
     SAVE SETTINGS
  ========================================== */

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const entries = Object.entries(settings);

      for (const [key, value] of entries) {
        const settingValue =
          typeof value === "boolean" ? String(value) : String(value ?? "");

        const { error: upsertError } = await supabase
          .from("site_settings")
          .upsert(
            {
              setting_key: key,
              setting_value: settingValue,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "setting_key",
            }
          );

        if (upsertError) {
          throw upsertError;
        }
      }

      setSuccess("Settings saved successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err) {
      console.error("Save settings error:", err);

      setError(err?.message || "Unable to save marketplace settings.");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     SECTION NAVIGATION
  ========================================== */

  const sections = [
    {
      id: "general",
      label: "General",
      description: "Marketplace identity and support",
      icon: <Store size={18} />,
    },
    {
      id: "marketplace",
      label: "Marketplace",
      description: "Registration and listing rules",
      icon: <Settings size={18} />,
    },
    {
      id: "notifications",
      label: "Notifications",
      description: "Marketplace notification controls",
      icon: <Bell size={18} />,
    },
    {
      id: "payments",
      label: "Payments",
      description: "Payment configuration",
      icon: <CreditCard size={18} />,
    },
    {
      id: "security",
      label: "Security",
      description: "Account and seller security",
      icon: <ShieldCheck size={18} />,
    },
    {
      id: "maintenance",
      label: "Maintenance",
      description: "Marketplace availability",
      icon: <Wrench size={18} />,
    },
  ];

  if (loading) {
    return (
      <div className="sh-admin-settings">
        <div className="sh-admin-settings-loading">
          <Loader2 size={28} className="sh-admin-settings-spinner" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sh-admin-settings">
      <div className="sh-admin-settings-container">
        {/* =====================================
            HEADER
        ====================================== */}

        <div className="sh-admin-settings-header">
          <div>
            <span className="sh-admin-settings-eyebrow">CONFIGURATION</span>

            <h1>Admin Settings</h1>

            <p>
              Manage your SellaHub marketplace configuration, policies,
              notifications, and availability.
            </p>
          </div>

          <div className="sh-admin-settings-header-actions">
            <button
              type="button"
              className="sh-admin-settings-refresh"
              onClick={() => loadSettings(true)}
              disabled={refreshing || saving}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "is-spinning" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              className="sh-admin-settings-save"
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="sh-admin-settings-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* =====================================
            FEEDBACK
        ====================================== */}

        {error && (
          <div className="sh-admin-settings-alert error">
            <AlertTriangle size={17} />

            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="sh-admin-settings-alert success">
            <CheckCircle2 size={17} />

            <span>{success}</span>
          </div>
        )}

        {/* =====================================
            SETTINGS LAYOUT
        ====================================== */}

        <div className="sh-admin-settings-layout">
          {/* =====================================
              SIDEBAR
          ====================================== */}

          <aside className="sh-admin-settings-sidebar">
            <div className="sh-admin-settings-sidebar-inner">
              <span className="sh-admin-settings-sidebar-label">SETTINGS</span>

              <nav className="sh-admin-settings-nav">
                {sections.map((section) => (
                  <button
                    type="button"
                    key={section.id}
                    className={`sh-admin-settings-nav-item ${
                      activeSection === section.id ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveSection(section.id);
                      setError("");
                      setSuccess("");
                    }}
                  >
                    <span className="sh-admin-settings-nav-icon">
                      {section.icon}
                    </span>

                    <span className="sh-admin-settings-nav-copy">
                      <strong>{section.label}</strong>
                      <small>{section.description}</small>
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* =====================================
              CONTENT
          ====================================== */}

          <main className="sh-admin-settings-content">
            {/* =====================================
                GENERAL
            ====================================== */}

            {activeSection === "general" && (
              <section className="sh-admin-settings-section">
                <div className="sh-admin-settings-section-header">
                  <div className="sh-admin-settings-section-icon">
                    <Store size={19} />
                  </div>

                  <div>
                    <h2>General</h2>
                    <p>
                      Configure the identity and basic information of your
                      marketplace.
                    </p>
                  </div>
                </div>

                <div className="sh-admin-settings-card">
                  <div className="sh-admin-settings-form-grid">
                    <div className="sh-admin-settings-field full">
                      <label htmlFor="marketplace_name">Marketplace Name</label>

                      <input
                        id="marketplace_name"
                        type="text"
                        value={settings.marketplace_name}
                        onChange={(e) =>
                          updateSetting("marketplace_name", e.target.value)
                        }
                        placeholder="SellaHub"
                      />
                    </div>

                    <div className="sh-admin-settings-field full">
                      <label htmlFor="marketplace_description">
                        Marketplace Description
                      </label>

                      <textarea
                        id="marketplace_description"
                        rows="4"
                        value={settings.marketplace_description}
                        onChange={(e) =>
                          updateSetting(
                            "marketplace_description",
                            e.target.value
                          )
                        }
                        placeholder="Describe your marketplace..."
                      />

                      <span className="sh-admin-settings-help">
                        Used as the main description for your marketplace.
                      </span>
                    </div>

                    <div className="sh-admin-settings-field">
                      <label htmlFor="support_email">Support Email</label>

                      <input
                        id="support_email"
                        type="email"
                        value={settings.support_email}
                        onChange={(e) =>
                          updateSetting("support_email", e.target.value)
                        }
                        placeholder="support@sellahub.com"
                      />
                    </div>

                    <div className="sh-admin-settings-field">
                      <label htmlFor="support_phone">Support Phone</label>

                      <input
                        id="support_phone"
                        type="tel"
                        value={settings.support_phone}
                        onChange={(e) =>
                          updateSetting("support_phone", e.target.value)
                        }
                        placeholder="+234..."
                      />
                    </div>

                    <div className="sh-admin-settings-field">
                      <label htmlFor="default_currency">Default Currency</label>

                      <select
                        id="default_currency"
                        value={settings.default_currency}
                        onChange={(e) =>
                          updateSetting("default_currency", e.target.value)
                        }
                      >
                        <option value="NGN">Nigerian Naira (NGN)</option>
                        <option value="USD">US Dollar (USD)</option>
                        <option value="GBP">British Pound (GBP)</option>
                        <option value="EUR">Euro (EUR)</option>
                      </select>
                    </div>

                    <div className="sh-admin-settings-field">
                      <label htmlFor="default_country">Default Country</label>

                      <input
                        id="default_country"
                        type="text"
                        value={settings.default_country}
                        onChange={(e) =>
                          updateSetting("default_country", e.target.value)
                        }
                        placeholder="Nigeria"
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* =====================================
                MARKETPLACE
            ====================================== */}

            {activeSection === "marketplace" && (
              <section className="sh-admin-settings-section">
                <div className="sh-admin-settings-section-header">
                  <div className="sh-admin-settings-section-icon">
                    <Settings size={19} />
                  </div>

                  <div>
                    <h2>Marketplace</h2>
                    <p>
                      Control how users, sellers, and listings interact with
                      SellaHub.
                    </p>
                  </div>
                </div>

                <div className="sh-admin-settings-card">
                  <div className="sh-admin-settings-toggle-list">
                    <SettingToggle
                      title="Allow New Registrations"
                      description="Allow new users to create SellaHub accounts."
                      checked={settings.allow_registrations}
                      onChange={(value) =>
                        updateSetting("allow_registrations", value)
                      }
                    />

                    <SettingToggle
                      title="Require Email Verification"
                      description="Require users to verify their email before accessing protected account features."
                      checked={settings.require_email_verification}
                      onChange={(value) =>
                        updateSetting("require_email_verification", value)
                      }
                    />

                    <SettingToggle
                      title="Require Seller Verification"
                      description="Require sellers to complete identity verification before selling."
                      checked={settings.require_seller_verification}
                      onChange={(value) =>
                        updateSetting("require_seller_verification", value)
                      }
                    />

                    <SettingToggle
                      title="Require Listing Approval"
                      description="New listings must be reviewed by an administrator before becoming visible."
                      checked={settings.require_listing_approval}
                      onChange={(value) =>
                        updateSetting("require_listing_approval", value)
                      }
                    />

                    <SettingToggle
                      title="Allow Listing Reports"
                      description="Allow customers to report listings they believe violate marketplace rules."
                      checked={settings.allow_listing_reports}
                      onChange={(value) =>
                        updateSetting("allow_listing_reports", value)
                      }
                    />

                    <SettingToggle
                      title="Allow Featured Listings"
                      description="Allow sellers with eligible plans to have listings featured."
                      checked={settings.allow_featured_listings}
                      onChange={(value) =>
                        updateSetting("allow_featured_listings", value)
                      }
                    />
                  </div>
                </div>
              </section>
            )}

            {/* =====================================
                NOTIFICATIONS
            ====================================== */}

            {activeSection === "notifications" && (
              <section className="sh-admin-settings-section">
                <div className="sh-admin-settings-section-header">
                  <div className="sh-admin-settings-section-icon">
                    <Bell size={19} />
                  </div>

                  <div>
                    <h2>Notifications</h2>
                    <p>
                      Control which marketplace events generate notifications.
                    </p>
                  </div>
                </div>

                <div className="sh-admin-settings-card">
                  <div className="sh-admin-settings-toggle-list">
                    <SettingToggle
                      title="New Listing Submitted"
                      description="Notify when a seller submits a new listing for review."
                      checked={settings.notify_new_listing}
                      onChange={(value) =>
                        updateSetting("notify_new_listing", value)
                      }
                    />

                    <SettingToggle
                      title="Listing Approved"
                      description="Notify sellers when their listing has been approved."
                      checked={settings.notify_listing_approved}
                      onChange={(value) =>
                        updateSetting("notify_listing_approved", value)
                      }
                    />

                    <SettingToggle
                      title="Listing Rejected"
                      description="Notify sellers when their listing has been rejected."
                      checked={settings.notify_listing_rejected}
                      onChange={(value) =>
                        updateSetting("notify_listing_rejected", value)
                      }
                    />

                    <SettingToggle
                      title="New Listing Report"
                      description="Notify administrators when a customer reports a listing."
                      checked={settings.notify_new_report}
                      onChange={(value) =>
                        updateSetting("notify_new_report", value)
                      }
                    />

                    <SettingToggle
                      title="Verification Submitted"
                      description="Notify administrators when a seller submits identity verification."
                      checked={settings.notify_verification_submitted}
                      onChange={(value) =>
                        updateSetting("notify_verification_submitted", value)
                      }
                    />

                    <SettingToggle
                      title="Verification Reviewed"
                      description="Notify sellers when their verification request is approved or rejected."
                      checked={settings.notify_verification_reviewed}
                      onChange={(value) =>
                        updateSetting("notify_verification_reviewed", value)
                      }
                    />

                    <SettingToggle
                      title="Payment Received"
                      description="Enable notifications for successful marketplace payments."
                      checked={settings.notify_payment_received}
                      onChange={(value) =>
                        updateSetting("notify_payment_received", value)
                      }
                    />
                  </div>
                </div>
              </section>
            )}

            {/* =====================================
                PAYMENTS
            ====================================== */}

            {activeSection === "payments" && (
              <section className="sh-admin-settings-section">
                <div className="sh-admin-settings-section-header">
                  <div className="sh-admin-settings-section-icon">
                    <CreditCard size={19} />
                  </div>

                  <div>
                    <h2>Payments</h2>
                    <p>
                      Review the basic payment configuration for your
                      marketplace.
                    </p>
                  </div>
                </div>

                <div className="sh-admin-settings-card">
                  <div className="sh-admin-settings-info-box">
                    <div className="sh-admin-settings-info-icon">
                      <CreditCard size={18} />
                    </div>

                    <div>
                      <strong>Payment provider</strong>

                      <p>
                        SellaHub currently uses Paystack for marketplace
                        payments. Payment verification should continue to be
                        handled by your server-side payment flow.
                      </p>
                    </div>
                  </div>

                  <div className="sh-admin-settings-form-grid">
                    <div className="sh-admin-settings-field">
                      <label>Payment Provider</label>

                      <input type="text" value="Paystack" disabled />
                    </div>

                    <div className="sh-admin-settings-field">
                      <label>Payment Currency</label>

                      <input
                        type="text"
                        value={settings.default_currency}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* =====================================
                SECURITY
            ====================================== */}

            {activeSection === "security" && (
              <section className="sh-admin-settings-section">
                <div className="sh-admin-settings-section-header">
                  <div className="sh-admin-settings-section-icon">
                    <ShieldCheck size={19} />
                  </div>

                  <div>
                    <h2>Security</h2>
                    <p>
                      Configure account and seller verification requirements.
                    </p>
                  </div>
                </div>

                <div className="sh-admin-settings-card">
                  <div className="sh-admin-settings-toggle-list">
                    <SettingToggle
                      title="Require Email Verification"
                      description="Users must verify their email address before using protected account features."
                      checked={settings.require_email_verification}
                      onChange={(value) =>
                        updateSetting("require_email_verification", value)
                      }
                    />

                    <SettingToggle
                      title="Require Seller Verification"
                      description="Sellers must submit identity documents before they can operate as verified sellers."
                      checked={settings.require_seller_verification}
                      onChange={(value) =>
                        updateSetting("require_seller_verification", value)
                      }
                    />
                  </div>

                  <div className="sh-admin-settings-security-note">
                    <ShieldCheck size={17} />

                    <p>
                      Identity verification decisions are managed through the
                      Admin Verification section.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* =====================================
                MAINTENANCE
            ====================================== */}

            {activeSection === "maintenance" && (
              <section className="sh-admin-settings-section">
                <div className="sh-admin-settings-section-header">
                  <div className="sh-admin-settings-section-icon warning">
                    <Wrench size={19} />
                  </div>

                  <div>
                    <h2>Maintenance</h2>
                    <p>
                      Temporarily control marketplace availability during
                      maintenance or major updates.
                    </p>
                  </div>
                </div>

                <div className="sh-admin-settings-card">
                  <div className="sh-admin-settings-maintenance-banner">
                    <div className="sh-admin-settings-maintenance-icon">
                      <AlertTriangle size={20} />
                    </div>

                    <div>
                      <strong>Maintenance mode</strong>

                      <p>
                        When enabled, your public marketplace can be placed into
                        maintenance mode. Make sure your frontend checks this
                        setting before displaying the normal marketplace.
                      </p>
                    </div>

                    <Toggle
                      checked={settings.maintenance_mode}
                      onChange={(value) =>
                        updateSetting("maintenance_mode", value)
                      }
                    />
                  </div>

                  <div className="sh-admin-settings-field full">
                    <label htmlFor="maintenance_message">
                      Maintenance Message
                    </label>

                    <textarea
                      id="maintenance_message"
                      rows="5"
                      value={settings.maintenance_message}
                      onChange={(e) =>
                        updateSetting("maintenance_message", e.target.value)
                      }
                      placeholder="Tell users why the marketplace is temporarily unavailable..."
                    />

                    <span className="sh-admin-settings-help">
                      This message can be displayed to customers while
                      maintenance mode is enabled.
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* =====================================
                BOTTOM SAVE
            ====================================== */}

            <div className="sh-admin-settings-bottom">
              <div>
                <span>
                  Changes are saved to your marketplace configuration.
                </span>
              </div>

              <button
                type="button"
                className="sh-admin-settings-save"
                onClick={saveSettings}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={17} className="sh-admin-settings-spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
