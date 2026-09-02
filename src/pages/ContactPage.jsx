import {
  ArrowRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import FooterCTA from "../components/FooterCTA";

const ContactPage = () => {
  return (
    <main className="sh-contact-page">
      <section className="sh-contact-hero">
        <div className="sh-contact-container">
          <div className="sh-contact-hero-content">
            <span className="sh-section-label">Get in touch</span>

            <h1>
              Let's start a<span> conversation.</span>
            </h1>

            <p>
              Have a question about SellaHub, need help with a listing, or
              interested in putting your business on the platform? We'd love to
              hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          CONTACT CONTENT
      ======================================== */}

      <section className="sh-contact-section">
        <div className="sh-contact-container">
          <div className="sh-contact-grid">
            {/* LEFT */}
            <div className="sh-contact-info">
              <div className="sh-contact-info-header">
                <span className="sh-contact-small-label">Contact SellaHub</span>

                <h2>
                  We're here
                  <br />
                  <span>to help.</span>
                </h2>

                <p>
                  Whether you're a buyer, seller, or business owner, reach out
                  and our team will get back to you as soon as possible.
                </p>
              </div>

              {/* CONTACT ITEMS */}
              <div className="sh-contact-details">
                <a
                  href="mailto:hello@sellahub.com"
                  className="sh-contact-detail"
                >
                  <div className="sh-contact-detail-icon">
                    <Mail size={19} />
                  </div>

                  <div>
                    <span>Email us</span>
                    <strong>hello@sellahub.com</strong>
                  </div>
                </a>

                <a href="tel:+2340000000000" className="sh-contact-detail">
                  <div className="sh-contact-detail-icon">
                    <Phone size={19} />
                  </div>

                  <div>
                    <span>Call us</span>
                    <strong>+234 000 000 0000</strong>
                  </div>
                </a>

                <div className="sh-contact-detail">
                  <div className="sh-contact-detail-icon">
                    <MapPin size={19} />
                  </div>

                  <div>
                    <span>Our location</span>
                    <strong>Nigeria</strong>
                  </div>
                </div>

                <div className="sh-contact-detail">
                  <div className="sh-contact-detail-icon">
                    <Clock3 size={19} />
                  </div>

                  <div>
                    <span>Support hours</span>
                    <strong>Mon — Fri, 9am — 5pm</strong>
                  </div>
                </div>
              </div>

              {/* QUICK HELP */}
              <div className="sh-contact-help">
                <div className="sh-contact-help-icon">
                  <MessageCircle size={18} />
                </div>

                <div>
                  <strong>Looking for something?</strong>
                  <p>
                    Browse listings and discover products, services, and
                    businesses on SellaHub.
                  </p>
                </div>

                <a href="/browse">
                  <ArrowRight size={17} />
                </a>
              </div>
            </div>

            {/* RIGHT — FORM */}
            <div className="sh-contact-form-wrapper">
              <div className="sh-contact-form-header">
                <span>Send us a message</span>

                <h2>
                  How can we
                  <span> help?</span>
                </h2>
              </div>

              <form className="sh-contact-form">
                <div className="sh-contact-form-row">
                  <div className="sh-form-group">
                    <label htmlFor="name">Your name</label>

                    <input
                      id="name"
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="sh-form-group">
                    <label htmlFor="email">Email address</label>

                    <input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="sh-form-group">
                  <label htmlFor="subject">Subject</label>

                  <select id="subject" name="subject" defaultValue="" required>
                    <option value="" disabled>
                      Select a subject
                    </option>

                    <option value="general">General enquiry</option>

                    <option value="listing">Listing support</option>

                    <option value="payment">Payment issue</option>

                    <option value="business">Business enquiry</option>

                    <option value="partnership">Partnership</option>

                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="sh-form-group">
                  <label htmlFor="message">Message</label>

                  <textarea
                    id="message"
                    name="message"
                    rows="7"
                    placeholder="Tell us how we can help..."
                    required
                  ></textarea>
                </div>

                <button type="submit" className="sh-contact-submit">
                  Send message
                  <ArrowRight size={17} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <FooterCTA />
    </main>
  );
};

export default ContactPage;
