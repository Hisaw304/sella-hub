import {
  ArrowUpRight,
  Eye,
  Megaphone,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

const benefits = [
  {
    number: "01",
    icon: Eye,
    title: "Get discovered",
    description:
      "Put your products and services in front of people actively browsing for what you offer.",
  },
  {
    number: "02",
    icon: Megaphone,
    title: "Increase visibility",
    description:
      "Give your business more exposure with listing options designed to help you stand out.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Grow your reach",
    description:
      "Connect with new customers beyond your existing audience and expand your market.",
  },
  {
    number: "04",
    icon: ShieldCheck,
    title: "Build trust",
    description:
      "Present your business professionally with a dedicated listing and verified business presence.",
  },
];

const WhySell = () => {
  return (
    <section className="sh-why-sell">
      <div className="sh-why-sell-container">
        {/* HEADER */}
        <div className="sh-why-sell-header">
          <div className="sh-why-sell-heading">
            <span className="sh-section-label">Built for sellers</span>

            <h2>
              More visibility.
              <br />
              <span>More opportunity.</span>
            </h2>
          </div>

          <div className="sh-why-sell-intro">
            <p>
              Your business deserves to be seen. SellaHub gives you a dedicated
              space to showcase what you offer and connect with people looking
              for it.
            </p>

            <a href="/pricing" className="sh-why-sell-link">
              See listing plans
              <ArrowUpRight size={17} />
            </a>
          </div>
        </div>

        {/* BENEFITS */}
        <div className="sh-why-sell-grid">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div className="sh-benefit-card" key={benefit.number}>
                <div className="sh-benefit-top">
                  <span className="sh-benefit-number">{benefit.number}</span>

                  <div className="sh-benefit-icon">
                    <Icon size={21} strokeWidth={1.7} />
                  </div>
                </div>

                <div className="sh-benefit-content">
                  <h3>{benefit.title}</h3>

                  <p>{benefit.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM CTA */}
        <div className="sh-why-sell-bottom">
          <div>
            <span>Ready to put your business out there?</span>
            <strong>Start your first listing on SellaHub.</strong>
          </div>

          <a href="/pricing" className="sh-why-sell-button">
            Start selling
            <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default WhySell;
