import { useRef, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
  Phone,
} from "lucide-react";

import { supabase } from "../lib/supabase";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);

    const fullName = formData.get("name")?.trim();
    const email = formData.get("email")?.trim();
    const phone = formData.get("phone")?.trim();
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,

        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      });

      if (error) {
        throw error;
      }

      setSuccess(
        "Account created successfully. Please check your email to verify your account."
      );

      formRef.current?.reset();
    } catch (error) {
      console.error("Signup error:", error);

      if (error.message?.toLowerCase().includes("rate limit")) {
        setError(
          "Too many signup attempts. Please wait a few minutes and try again."
        );
      } else {
        setError(
          error.message || "Something went wrong while creating your account."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="sh-signup-page">
      {/* ========================================
          LEFT SIDE
      ======================================== */}

      <section className="sh-signup-intro">
        <div className="sh-signup-intro-inner">
          <a href="/" className="sh-signup-logo">
            SellaHub
          </a>

          <div className="sh-signup-intro-content">
            <span className="sh-signup-label">Join SellaHub</span>

            <h1>
              Put your business
              <span> on the map.</span>
            </h1>

            <p>
              Create your account and get access to a marketplace built to help
              businesses, sellers, and service providers get discovered.
            </p>

            <div className="sh-signup-points">
              <div>
                <span>01</span>
                <p>Create your seller profile</p>
              </div>

              <div>
                <span>02</span>
                <p>Choose a listing plan</p>
              </div>

              <div>
                <span>03</span>
                <p>Publish and manage your listings</p>
              </div>
            </div>
          </div>

          <div className="sh-signup-intro-bottom">
            <span>© {new Date().getFullYear()} SellaHub</span>

            <a href="/contact">Need help?</a>
          </div>
        </div>
      </section>

      {/* ========================================
          SIGNUP FORM
      ======================================== */}

      <section className="sh-signup-form-section">
        <div className="sh-signup-form-wrapper">
          <div className="sh-signup-mobile-logo">
            <a href="/" className="sh-signup-logo">
              SellaHub
            </a>
          </div>
          <div className="sh-signup-form-header">
            <span>Create account</span>

            <h2>
              Start <span>selling.</span>
            </h2>

            <p>Create your SellaHub account to get started.</p>
          </div>

          <form
            ref={formRef}
            className="sh-signup-form"
            onSubmit={handleSignup}
          >
            {/* NAME */}
            <div className="sh-signup-field">
              <label htmlFor="name">Full name</label>

              <div className="sh-signup-input">
                <User size={17} />

                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="sh-signup-field">
              <label htmlFor="email">Email address</label>

              <div className="sh-signup-input">
                <Mail size={17} />

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* PHONE */}
            <div className="sh-signup-field">
              <label htmlFor="phone">Phone number</label>

              <div className="sh-signup-input">
                <Phone size={17} />

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="+234 800 000 0000"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="sh-signup-field">
              <label htmlFor="password">Password</label>

              <div className="sh-signup-input">
                <LockKeyhole size={17} />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="sh-signup-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="sh-signup-field">
              <label htmlFor="confirmPassword">Confirm password</label>

              <div className="sh-signup-input">
                <LockKeyhole size={17} />

                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="sh-signup-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* TERMS */}
            <label className="sh-signup-terms">
              <input type="checkbox" required />

              <span>
                I agree to the <a href="/terms">Terms & Conditions</a> and{" "}
                <a href="/privacy">Privacy Policy</a>.
              </span>
            </label>

            {/* MESSAGES */}

            {error && (
              <div className="sh-signup-message sh-signup-error">{error}</div>
            )}

            {success && (
              <div className="sh-signup-message sh-signup-success">
                {success}
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              className="sh-signup-submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}

              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          {/* LOGIN */}
          <div className="sh-signup-login">
            <span>Already have an account?</span>

            <a href="/login">Sign in</a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Signup;
