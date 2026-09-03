import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { supabase } from "../lib/supabase";
const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    const formData = new FormData(e.currentTarget);

    const email = formData.get("email")?.trim();
    const password = formData.get("password");

    try {
      setLoading(true);

      // SIGN IN
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const user = data.user;

      if (!user) {
        throw new Error("Unable to sign in.");
      }

      // GET USER ROLE
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      // REDIRECT BASED ON ROLE
      if (profile?.role === "admin") {
        window.location.href = "/admin";
        return;
      }

      // NORMAL SELLER / USER
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Invalid email or password. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="sh-login-page">
      {/* ========================================
          LEFT SIDE
      ======================================== */}

      <section className="sh-login-intro">
        <div className="sh-login-intro-inner">
          <a href="/" className="sh-login-logo">
            SellaHub
          </a>

          <div className="sh-login-intro-content">
            <span className="sh-login-label">Welcome back</span>

            <h1>
              Your marketplace
              <span> starts here.</span>
            </h1>

            <p>
              Sign in to manage your listings, update your profile, view your
              plan, and keep your SellaHub account up to date.
            </p>
          </div>

          <div className="sh-login-intro-bottom">
            <span>© {new Date().getFullYear()} SellaHub</span>

            <a href="/contact">Need help?</a>
          </div>
        </div>
      </section>

      {/* ========================================
          LOGIN FORM
      ======================================== */}

      <section className="sh-login-form-section">
        <div className="sh-login-form-wrapper">
          <div className="sh-login-mobile-logo">
            <a href="/" className="sh-login-logo">
              SellaHub
            </a>
          </div>

          <div className="sh-login-form-header">
            <span>Account login</span>

            <h2>
              Welcome <span>back.</span>
            </h2>

            <p>Enter your details to access your account.</p>
          </div>

          <form className="sh-login-form" onSubmit={handleLogin}>
            {/* EMAIL */}
            <div className="sh-login-field">
              <label htmlFor="email">Email address</label>

              <div className="sh-login-input">
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

            {/* PASSWORD */}
            <div className="sh-login-field">
              <div className="sh-login-password-label">
                <label htmlFor="password">Password</label>

                <a href="/forgot-password">Forgot password?</a>
              </div>

              <div className="sh-login-input">
                <LockKeyhole size={17} />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="sh-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* REMEMBER */}
            <div className="sh-login-options">
              <label className="sh-remember">
                <input type="checkbox" />

                <span>Remember me</span>
              </label>
            </div>

            {/* ERROR */}

            {error && (
              <div className="sh-login-message sh-login-error">{error}</div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              className="sh-login-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}

              {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          {/* SIGN UP */}
          <div className="sh-login-signup">
            <span>Don't have an account?</span>

            <a href="/signup">Create an account</a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
