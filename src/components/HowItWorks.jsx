import { ArrowRight, Compass, MessageCircle, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Compass,
    title: "Discover",
    description:
      "Explore products, services, and businesses across a growing marketplace built around what you need.",
  },
  {
    number: "02",
    icon: MessageCircle,
    title: "Connect",
    description:
      "Find the right listing, learn more about the seller, and connect directly to take the next step.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Grow",
    description:
      "List your products or services, reach more potential customers, and give your business greater visibility.",
  },
];

const HowItWorks = () => {
  return (
    <section className="sh-how">
      <div className="sh-how-container">
        {/* HEADER */}
        <div className="sh-how-header">
          <div>
            <span className="sh-section-label">Simple by design</span>

            <h2>
              How SellaHub
              <span> works.</span>
            </h2>
          </div>

          <p>
            Whether you're looking for something to buy or looking for people to
            buy from you, SellaHub keeps the process simple.
          </p>
        </div>

        {/* STEPS */}
        <div className="sh-how-grid">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div className="sh-how-step" key={step.number}>
                <div className="sh-how-step-top">
                  <span className="sh-how-number">{step.number}</span>

                  <div className="sh-how-icon">
                    <Icon size={22} strokeWidth={1.7} />
                  </div>
                </div>

                <div className="sh-how-step-content">
                  <h3>{step.title}</h3>

                  <p>{step.description}</p>
                </div>

                {index < steps.length - 1 && (
                  <div className="sh-how-connector">
                    <ArrowRight size={18} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
