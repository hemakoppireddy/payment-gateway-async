import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (email === "test@example.com") {
      localStorage.setItem("api_key", "key_test_abc123");
      localStorage.setItem("api_secret", "secret_test_xyz789");
      navigate("/dashboard");
    } else {
      alert("Invalid email");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <h1>Merchant Login</h1>
          <p>Payment Gateway Dashboard</p>
        </header>

        <form data-test-id="login-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Email</label>
            <input
              data-test-id="email-input"
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label>Password</label>
            <input
              data-test-id="password-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button data-test-id="login-button" type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
