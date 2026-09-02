import { useState } from "react";
import {
  Menu,
  X,
  Home,
  Search,
  Layers3,
  BadgeDollarSign,
  Info,
  Phone,
  CircleHelp,
} from "lucide-react";

const navLinks = [
  {
    name: "Home",
    path: "/",
    icon: Home,
  },
  {
    name: "Browse",
    path: "/browse",
    icon: Search,
  },
  {
    name: "Categories",
    path: "/categories",
    icon: Layers3,
  },
  {
    name: "Pricing",
    path: "/pricing",
    icon: BadgeDollarSign,
  },
  {
    name: "About",
    path: "/about",
    icon: Info,
  },
  {
    name: "FAQ",
    path: "/faq",
    icon: CircleHelp,
  },
  {
    name: "Contact",
    path: "/contact",
    icon: Phone,
  },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="sh-navbar">
      <div className="sh-navbar-container">
        {/* LOGO */}
        <a href="/" className="sh-logo" onClick={closeMenu}>
          SellaHub
        </a>

        {/* DESKTOP NAVIGATION */}
        <nav className="sh-desktop-nav">
          {navLinks.map((link) => {
            const Icon = link.icon;

            return (
              <a key={link.name} href={link.path} className="sh-nav-link">
                <Icon size={17} strokeWidth={1.8} />
                <span>{link.name}</span>
              </a>
            );
          })}
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="sh-navbar-actions">
          <a href="/login" className="sh-login-btn">
            Login
          </a>

          <a href="/signup" className="sh-post-btn">
            Post Listing
          </a>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          className="sh-menu-btn"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <X size={24} strokeWidth={1.8} />
          ) : (
            <Menu size={24} strokeWidth={1.8} />
          )}
        </button>
      </div>

      {/* MOBILE MENU */}
      <div className={`sh-mobile-menu ${menuOpen ? "is-open" : ""}`}>
        <nav className="sh-mobile-nav">
          {navLinks.map((link) => {
            const Icon = link.icon;

            return (
              <a
                key={link.name}
                href={link.path}
                className="sh-mobile-link"
                onClick={closeMenu}
              >
                <span className="sh-mobile-icon">
                  <Icon size={18} strokeWidth={1.8} />
                </span>

                <span>{link.name}</span>
              </a>
            );
          })}
        </nav>

        <div className="sh-mobile-actions">
          <a href="/login" className="sh-mobile-login" onClick={closeMenu}>
            Login
          </a>

          <a href="/signup" className="sh-mobile-post" onClick={closeMenu}>
            Post a Listing
          </a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
