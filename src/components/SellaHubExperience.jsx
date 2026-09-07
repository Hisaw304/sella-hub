import { useEffect, useState } from "react";
import {
  Search,
  MapPin,
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
// import "./SellaHubExperience.css";

const SellaHubExperience = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="sh-experience">
      <div className="sh-experience-container">
        {/* LEFT CONTENT */}
        <div className="sh-experience-content">
          <span className="sh-experience-eyebrow">
            <span className="sh-eyebrow-dot"></span>
            THE SELLАHUB EXPERIENCE
          </span>

          <h2>
            Find it.
            <br />
            <span>Connect with them.</span>
            <br />
            Get it done.
          </h2>

          <p className="sh-experience-description">
            SellaHub brings buyers and sellers together in one simple
            marketplace. Discover products, explore services, find properties,
            and connect directly with people around you.
          </p>

          <a href="/browse" className="sh-experience-button">
            Explore Listings
            <ArrowRight size={17} />
          </a>

          <div className="sh-experience-features">
            <div className="sh-experience-feature">
              <div className="sh-feature-icon">
                <Search size={17} />
              </div>

              <div>
                <strong>Discover</strong>
                <span>Find what you're looking for.</span>
              </div>
            </div>

            <div className="sh-experience-feature">
              <div className="sh-feature-icon">
                <MessageCircle size={17} />
              </div>

              <div>
                <strong>Connect</strong>
                <span>Talk directly with sellers.</span>
              </div>
            </div>

            <div className="sh-experience-feature">
              <div className="sh-feature-icon">
                <CheckCircle2 size={17} />
              </div>

              <div>
                <strong>Choose</strong>
                <span>Make the right decision.</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PHONE AREA */}
        <div className="sh-phone-area">
          {/* FLOATING CARD - TOP */}
          <div className="sh-floating-card sh-floating-top">
            <div className="sh-floating-icon">
              <ShoppingBag size={15} />
            </div>

            <div>
              <strong>New listing</strong>
              <span>Just posted</span>
            </div>
          </div>

          {/* PHONE */}
          <div className="sh-phone">
            {/* PHONE SIDE BUTTONS */}
            <div className="sh-phone-button sh-phone-button-one"></div>
            <div className="sh-phone-button sh-phone-button-two"></div>

            <div className="sh-phone-frame">
              {/* DYNAMIC ISLAND */}
              <div className="sh-phone-island">
                <span></span>
              </div>

              {/* SCREEN */}
              <div className="sh-phone-screen">
                {/* HEADER */}
                <div className="sh-phone-header">
                  <div className="sh-phone-brand">
                    <div className="sh-phone-logo">S</div>

                    <div>
                      <strong>SellaHub</strong>
                      <span>Marketplace</span>
                    </div>
                  </div>

                  <div className="sh-phone-header-icon">
                    <MessageCircle size={16} />
                  </div>
                </div>

                {/* DATE */}
                <div className="sh-phone-date">TODAY</div>

                {/* CHAT */}
                <div className="sh-phone-chat">
                  {/* USER MESSAGE */}
                  <div
                    className={`sh-chat-row sh-chat-user ${
                      step >= 0 ? "sh-chat-visible" : ""
                    }`}
                  >
                    <div className="sh-chat-bubble sh-user-bubble">
                      I'm looking for a laptop under
                      <strong> ₦500,000</strong> in Lagos.
                    </div>
                  </div>

                  {/* TYPING */}
                  {step === 1 && (
                    <div className="sh-chat-row sh-chat-seller sh-typing-row">
                      <div className="sh-seller-avatar">S</div>

                      <div className="sh-typing-bubble">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}

                  {/* SELLER RESPONSE */}
                  {step >= 2 && (
                    <div className="sh-chat-row sh-chat-seller">
                      <div className="sh-seller-avatar">S</div>

                      <div className="sh-chat-bubble sh-seller-bubble">
                        Sure! Here are a few options that match your budget.
                      </div>
                    </div>
                  )}

                  {/* LISTING CARD */}
                  {step >= 3 && (
                    <div className="sh-mini-listing">
                      <div className="sh-mini-listing-image">
                        <div className="sh-laptop-placeholder">
                          <div className="sh-laptop-screen"></div>
                          <div className="sh-laptop-base"></div>
                        </div>
                      </div>

                      <div className="sh-mini-listing-info">
                        <div className="sh-mini-listing-title">
                          HP EliteBook 840
                        </div>

                        <div className="sh-mini-listing-price">₦420,000</div>

                        <div className="sh-mini-listing-location">
                          <MapPin size={10} />
                          Ikeja, Lagos
                        </div>
                      </div>

                      <ArrowRight size={14} className="sh-mini-listing-arrow" />
                    </div>
                  )}

                  {/* SECOND LISTING */}
                  {step >= 3 && (
                    <div className="sh-mini-listing sh-mini-listing-second">
                      <div className="sh-mini-listing-image sh-second-image">
                        <div className="sh-laptop-placeholder sh-dark-laptop">
                          <div className="sh-laptop-screen"></div>
                          <div className="sh-laptop-base"></div>
                        </div>
                      </div>

                      <div className="sh-mini-listing-info">
                        <div className="sh-mini-listing-title">
                          Lenovo ThinkPad
                        </div>

                        <div className="sh-mini-listing-price">₦475,000</div>

                        <div className="sh-mini-listing-location">
                          <MapPin size={10} />
                          Lagos
                        </div>
                      </div>

                      <ArrowRight size={14} className="sh-mini-listing-arrow" />
                    </div>
                  )}

                  {/* SELLER MESSAGE */}
                  {step === 0 && (
                    <div className="sh-chat-row sh-chat-seller sh-delayed-message">
                      <div className="sh-seller-avatar">S</div>

                      <div className="sh-typing-bubble">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}

                  {step === 0 && (
                    <div className="sh-phone-search-hint">
                      <Search size={13} />
                      Search SellaHub
                    </div>
                  )}
                </div>

                {/* INPUT */}
                <div className="sh-phone-input">
                  <span>Type a message...</span>

                  <div className="sh-phone-send">
                    <ArrowRight size={14} />
                  </div>
                </div>

                {/* HOME INDICATOR */}
                <div className="sh-phone-home-indicator"></div>
              </div>
            </div>
          </div>

          {/* FLOATING CARD - BOTTOM */}
          <div className="sh-floating-card sh-floating-bottom">
            <div className="sh-floating-check">
              <CheckCircle2 size={15} />
            </div>

            <div>
              <strong>Seller responded</strong>
              <span>Just now</span>
            </div>
          </div>

          {/* SMALL DECORATIVE ELEMENT */}
          <div className="sh-phone-sparkle">
            <Sparkles size={18} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SellaHubExperience;
