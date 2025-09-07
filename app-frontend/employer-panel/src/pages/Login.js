// src/pages/Login.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../logo.png";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      navigate("/2fa", { state: { email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pageContainer">
      <div className="loginContainer">
        {/* Left Section */}
        <div className="loginFormSection">
          <div className="formContainer">
            <div className="headerSection">
              <p className="employerText">Employer</p>
              <h1 className="loginTitle">Log In</h1>
              <p className="welcomeText">Welcome Back!</p>
            </div>

            <form className="loginForm" onSubmit={handleLogin}>
              <div className="inputGroup">
                <label className="inputLabel" htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="formInput"
                />
              </div>

              <div className="inputGroup">
                <label className="inputLabel" htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="formInput"
                />
              </div>

              <div className="forgotPasswordContainer">
                <a href="/forgot-password" className="forgotPassword">Forgot Password?</a>
              </div>

              {error && <div className="errorMessage">{error}</div>}
              {loading && <div className="loadingMessage">Sending OTP...</div>}

              <button type="submit" className="loginButton" disabled={loading}>
                {loading ? "Please wait..." : "Log In"}
              </button>
            </form>

            <div className="partnerLink">
              <p>
                Want to partner with us?{" "}
                <a href="/expression-of-interest" className="partnerText">
                  Submit an expression of interest!
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="brandSection">
          <img src={logo} alt="Secure Shift Logo" className="logoImage" />
        </div>
      </div>
    </div>
  );
}
