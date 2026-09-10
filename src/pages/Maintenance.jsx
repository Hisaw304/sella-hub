import { Wrench } from "lucide-react";
// import "./Maintenance.css";

export default function Maintenance({ message }) {
  return (
    <main className="sh-maintenance">
      <div className="sh-maintenance-content">
        <div className="sh-maintenance-icon">
          <Wrench size={28} strokeWidth={1.8} />
        </div>

        <span className="sh-maintenance-eyebrow">SELLHUB</span>

        <h1>
          We'll be back
          <br />
          shortly.
        </h1>

        <p>
          {message ||
            "SellaHub is temporarily unavailable while we make some improvements. Please check back shortly."}
        </p>

        <div className="sh-maintenance-status">
          <span />
          Maintenance in progress
        </div>
      </div>
    </main>
  );
}
