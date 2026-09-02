import { ArrowUpRight } from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";

const Footer = () => {
  const marketplaceLinks = [
    { name: "Browse Listings", path: "/browse" },
    { name: "Categories", path: "/categories" },
    { name: "Pricing Plans", path: "/pricing" },
    { name: "Featured Listings", path: "/featured" },
  ];

  const companyLinks = [
    { name: "About Us", path: "/about" },
    { name: "Contact Us", path: "/contact" },
    { name: "FAQ", path: "/faq" },
  ];

  const accountLinks = [
    { name: "Sign Up", path: "/signup" },
    { name: "Login", path: "/login" },
    { name: "Post a Listing", path: "/signup" },
  ];

  return (
    <footer className="sh-footer">
      <div className="sh-footer-container">
        {/* TOP */}
        <div className="sh-footer-top">
          {/* BRAND */}
          <div className="sh-footer-brand">
            <a href="/" className="sh-footer-logo">
              SellaHub
            </a>

            <p>
              Discover products, services, and opportunities from businesses and
              sellers all in one place.
            </p>

            <div className="sh-footer-socials">
              <a href="#" aria-label="Facebook">
                <FaFacebookF size={15} />
              </a>

              <a href="#" aria-label="Instagram">
                <FaInstagram size={15} />
              </a>

              <a href="#" aria-label="LinkedIn">
                <FaLinkedinIn size={15} />
              </a>

              <a href="#" aria-label="X">
                <FaXTwitter size={15} />
              </a>
            </div>
          </div>

          {/* MARKETPLACE */}
          <div className="sh-footer-column">
            <h3>Marketplace</h3>

            {marketplaceLinks.map((link) => (
              <a key={link.name} href={link.path}>
                {link.name}
              </a>
            ))}
          </div>

          {/* COMPANY */}
          <div className="sh-footer-column">
            <h3>Company</h3>

            {companyLinks.map((link) => (
              <a key={link.name} href={link.path}>
                {link.name}
              </a>
            ))}
          </div>

          {/* ACCOUNT */}
          <div className="sh-footer-column">
            <h3>Account</h3>

            {accountLinks.map((link) => (
              <a key={link.name} href={link.path}>
                {link.name}
              </a>
            ))}
          </div>

          {/* NEWSLETTER */}
          <div className="sh-footer-newsletter">
            <h3>Stay in the loop</h3>

            <p>
              Get marketplace updates, new listings, and useful tips delivered
              to your inbox.
            </p>

            <form className="sh-newsletter-form">
              <input
                type="email"
                placeholder="Your email address"
                aria-label="Email address"
              />

              <button type="submit" aria-label="Subscribe">
                <ArrowUpRight size={19} />
              </button>
            </form>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="sh-footer-bottom">
          <p>© {new Date().getFullYear()} SellaHub. All rights reserved.</p>

          <div className="sh-footer-legal">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
