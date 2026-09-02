import { useState } from "react";
import { ArrowUpRight, ChevronDown, HelpCircle } from "lucide-react";
import FooterCTA from "../components/FooterCTA";

const faqs = [
  {
    question: "What is SellaHub?",
    answer:
      "SellaHub is a marketplace platform where businesses, sellers, and service providers can showcase their products or services and connect with people looking for what they offer.",
  },
  {
    question: "How do I create a listing?",
    answer:
      "Create your SellaHub account, choose a listing plan, complete your payment, and then use your dashboard to add your product or service details, images, category, pricing, and other relevant information.",
  },
  {
    question: "Do I need an account to publish a listing?",
    answer:
      "Yes. You need a SellaHub account to create and manage listings. Your dashboard gives you access to your listings, profile, selected plan, and account settings.",
  },
  {
    question: "What are the Basic, Standard, and Premium plans?",
    answer:
      "The plans are different listing packages designed for different seller needs. Depending on the selected plan, you may receive different listing limits, visibility options, image limits, featured placement, and other benefits.",
  },
  {
    question: "When will my listing be published?",
    answer:
      "After you select a plan and your payment is successfully verified, you can complete your listing. Depending on the platform's moderation settings, your listing may be published immediately or reviewed before going live.",
  },
  {
    question: "Can I edit my listing after publishing it?",
    answer:
      "Yes. You can manage your listings from your dashboard and update information such as the title, description, images, price, contact information, and other listing details.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "Payments can be securely processed through the payment provider supported by SellaHub. Available payment methods may include cards, bank transfers, and other options provided by the payment gateway.",
  },
  {
    question: "Can I delete my listing?",
    answer:
      "Yes. Sellers can manage their listings from their dashboard, including removing listings they no longer want to display on the marketplace.",
  },
  {
    question: "How can I get help with my account or listing?",
    answer:
      "You can contact the SellaHub support team through the Contact page. Include as much information as possible about your question or issue so the team can assist you more quickly.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="sh-faq-page">
      {/* ========================================
          HERO
      ======================================== */}

      <section className="sh-faq-hero">
        <div className="sh-faq-container">
          <div className="sh-faq-hero-content">
            <span className="sh-section-label">Frequently asked questions</span>

            <h1>
              Questions?
              <span> We've got answers.</span>
            </h1>

            <p>
              Everything you need to know about creating listings, choosing a
              plan, making payments, and using SellaHub.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          FAQ CONTENT
      ======================================== */}

      <section className="sh-faq-section">
        <div className="sh-faq-container">
          <div className="sh-faq-grid">
            {/* LEFT */}
            <div className="sh-faq-intro">
              <div className="sh-faq-icon">
                <HelpCircle size={21} strokeWidth={1.7} />
              </div>

              <span className="sh-faq-small-label">Need some help?</span>

              <h2>
                We've made it
                <span> simple.</span>
              </h2>

              <p>
                Can't find the answer you're looking for? Our team is ready to
                help you with your account, listing, payment, or anything else
                related to SellaHub.
              </p>

              <a href="/contact" className="sh-faq-contact-link">
                Contact support
                <ArrowUpRight size={16} />
              </a>
            </div>

            {/* RIGHT */}
            <div className="sh-faq-list">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                  <div
                    className={`sh-faq-item ${isOpen ? "is-open" : ""}`}
                    key={faq.question}
                  >
                    <button
                      type="button"
                      className="sh-faq-question"
                      onClick={() => toggleFAQ(index)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.question}</span>

                      <span className="sh-faq-chevron">
                        <ChevronDown size={17} />
                      </span>
                    </button>

                    <div
                      className="sh-faq-answer"
                      style={{
                        gridTemplateRows: isOpen ? "1fr" : "0fr",
                      }}
                    >
                      <div>
                        <p>{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      <FooterCTA />
    </main>
  );
};

export default FAQ;
