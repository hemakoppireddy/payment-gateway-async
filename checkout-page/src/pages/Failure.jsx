import { useLocation } from "react-router-dom";
import "../styles/Checkout.css";

export default function Failure() {
  const params = new URLSearchParams(useLocation().search);
  const error =
    params.get("error") || "Payment could not be processed";

  return (
    <div className="result-wrapper">
      <div className="result-card failure">
        <div className="icon failure-icon">✕</div>

        <h2>Payment Failed</h2>

        <p
          className="result-message"
          data-test-id="error-message"
        >
          {error}
        </p>

        <button
          className="retry-btn"
          data-test-id="retry-button"
          onClick={() => window.history.back()}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
