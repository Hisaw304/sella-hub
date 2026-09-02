import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Camera,
  Save,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "../lib/supabase";

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [profile, setProfile] = useState({
    full_name: "",
    business_name: "",
    phone: "",
    location: "",
    avatar_url: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  ========================================
  LOAD PROFILE
  ========================================
  */

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          navigate("/login");
          return;
        }

        setUser(user);

        /*
        ========================================
        FETCH PROFILE
        ========================================
        */

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select(
            `
    id,
    full_name,
    email,
    phone,
    avatar_url,
    role,
    business_name,
    location
  `
          )
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (data) {
          setProfile({
            full_name: data.full_name || "",
            business_name: data.business_name || "",
            phone: data.phone || "",
            location: data.location || "",
            avatar_url: data.avatar_url || "",
          });

          setAvatarPreview(data.avatar_url || "");
        }

        if (data) {
          setProfile({
            full_name: data.full_name || "",
            business_name: data.business_name || "",
            phone: data.phone || "",
            location: data.location || "",
            avatar_url: data.avatar_url || "",
          });

          setAvatarPreview(data.avatar_url || "");
        }
      } catch (err) {
        console.error("Profile loading error:", err);

        setError(err.message || "Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  /*
  ========================================
  HANDLE INPUT
  ========================================
  */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
  ========================================
  AVATAR SELECT
  ========================================
  */

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setAvatarFile(file);

    const preview = URL.createObjectURL(file);

    setAvatarPreview(preview);
  };

  /*
  ========================================
  UPLOAD AVATAR
  ========================================
  */

  const uploadAvatar = async () => {
    if (!avatarFile || !user) {
      return profile.avatar_url;
    }

    // Make sure the current Supabase session exists
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session?.user) {
      throw new Error("Your session has expired. Please log in again.");
    }

    const extension = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${
      session.user.id
    }/avatar-${crypto.randomUUID()}.${extension}`;

    console.log("Avatar upload user:", session.user.id);
    console.log("Avatar upload path:", fileName);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, avatarFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: avatarFile.type,
      });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName);

    return publicUrl;
  };

  /*
  ========================================
  SAVE PROFILE
  ========================================
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!profile.full_name.trim()) {
        throw new Error("Please enter your full name.");
      }

      if (!profile.phone.trim()) {
        throw new Error("Please enter your phone number.");
      }

      if (!profile.location.trim()) {
        throw new Error("Please enter your location.");
      }

      let avatarUrl = profile.avatar_url;

      /*
      ========================================
      UPLOAD NEW AVATAR
      ========================================
      */

      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      /*
      ========================================
      UPDATE PROFILE
      ========================================
      */

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name.trim(),

          business_name: profile.business_name.trim() || null,

          phone: profile.phone.trim(),

          location: profile.location.trim(),

          avatar_url: avatarUrl || null,
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile((current) => ({
        ...current,
        avatar_url: avatarUrl || "",
      }));

      setAvatarFile(null);

      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      console.error("Profile update error:", err);

      setError(err.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  };

  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <div className="sh-profile-loading">
        <LoaderCircle size={24} className="sh-profile-spinner" />

        <p>Loading profile...</p>
      </div>
    );
  }

  /*
  ========================================
  PAGE
  ========================================
  */

  return (
    <div className="sh-profile-page">
      <div className="sh-profile-container">
        {/* HEADER */}

        <header className="sh-profile-header">
          <Link to="/dashboard" className="sh-profile-back">
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <div>
            <span className="sh-profile-eyebrow">Account settings</span>

            <h1>Your profile</h1>

            <p>Manage your personal and business information.</p>
          </div>
        </header>

        {/* FORM */}

        <form className="sh-profile-form" onSubmit={handleSubmit}>
          {/* PROFILE CARD */}

          <section className="sh-profile-card">
            <div className="sh-profile-card-header">
              <div>
                <span>Profile</span>

                <h2>Personal information</h2>
              </div>
            </div>

            {/* AVATAR */}

            <div className="sh-profile-avatar-section">
              <div className="sh-profile-avatar">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={profile.full_name || "Profile"}
                  />
                ) : (
                  <User size={30} />
                )}
              </div>

              <div className="sh-profile-avatar-content">
                <strong>Profile photo</strong>

                <p>Use a clear photo or your business logo.</p>

                <label className="sh-profile-upload">
                  <Camera size={14} />
                  Change photo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
            </div>

            {/* NAME */}

            <div className="sh-profile-field">
              <label htmlFor="full_name">Full name</label>

              <div className="sh-profile-input">
                <User size={17} />

                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={profile.full_name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* EMAIL */}

            <div className="sh-profile-field">
              <label htmlFor="email">Email address</label>

              <div className="sh-profile-input sh-profile-input-disabled">
                <Mail size={17} />

                <input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                />
              </div>

              <small>
                Your email address is managed through your account security
                settings.
              </small>
            </div>

            {/* PHONE */}

            <div className="sh-profile-field">
              <label htmlFor="phone">Phone number</label>

              <div className="sh-profile-input">
                <Phone size={17} />

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="+234 800 000 0000"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            {/* LOCATION */}

            <div className="sh-profile-field">
              <label htmlFor="location">Location</label>

              <div className="sh-profile-input">
                <MapPin size={17} />

                <input
                  id="location"
                  name="location"
                  type="text"
                  value={profile.location}
                  onChange={handleChange}
                  placeholder="Lagos, Nigeria"
                  required
                />
              </div>
            </div>
          </section>

          {/* BUSINESS CARD */}

          <section className="sh-profile-card">
            <div className="sh-profile-card-header">
              <div>
                <span>Marketplace</span>

                <h2>Business information</h2>
              </div>
            </div>

            <div className="sh-profile-field">
              <label htmlFor="business_name">Business name</label>

              <div className="sh-profile-input">
                <Building2 size={17} />

                <input
                  id="business_name"
                  name="business_name"
                  type="text"
                  value={profile.business_name}
                  onChange={handleChange}
                  placeholder="Your business name"
                  autoComplete="organization"
                />
              </div>

              <small>
                Leave this empty if you are listing as an individual seller.
              </small>
            </div>
          </section>

          {/* VERIFICATION */}

          <section className="sh-profile-verification">
            <div className="sh-profile-verification-icon">
              <ShieldCheck size={19} />
            </div>

            <div>
              <span>Account verification</span>

              <h3>Identity verification</h3>

              <p>
                Verification helps buyers identify trusted sellers on SellaHub.
              </p>

              <Link
                to="/dashboard/verification"
                className="sh-profile-verification-link"
              >
                Manage verification
              </Link>
            </div>
          </section>

          {/* MESSAGES */}

          {error && (
            <div className="sh-profile-message sh-profile-error">{error}</div>
          )}

          {success && (
            <div className="sh-profile-message sh-profile-success">
              {success}
            </div>
          )}

          {/* ACTIONS */}

          <div className="sh-profile-actions">
            <Link to="/dashboard" className="sh-profile-cancel">
              Cancel
            </Link>

            <button type="submit" className="sh-profile-save" disabled={saving}>
              {saving ? (
                <>
                  <LoaderCircle size={16} className="sh-profile-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
