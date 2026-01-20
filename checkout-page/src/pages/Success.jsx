import { useLocation } from "react-router-dom";
import "../styles/Checkout.css";

export default function Success() {
  const params = new URLSearchParams(useLocation().search);
  const paymentId = params.get("payment_id");

  return (
    <div className="result-wrapper">
      <div className="result-card success">
        <div className="icon success-icon">✓</div>

        <h2>Payment Successful</h2>

        <p className="result-id">
          Payment ID:
          <span data-test-id="payment-id">
            {paymentId}
          </span>
        </p>

        <p
          className="result-message"
          data-test-id="success-message"
        >
          Your payment has been processed successfully.
        </p>
      </div>
    </div>
  );
}
