import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../logo.png";
import "./Login.css";
import http from "../lib/http";

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
      const { data } = await http.post("/auth/login", { email, password });

      // ✅ Login succeeded → redirect to OTP page
      navigate("/2fa", { state: { email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginContainer">
      {/* Left side - Login Form */}
      <div className="loginFormSection">
        <div className="formContainer">
          <div className="headerSection">
            <p className="employerText">Employer</p>
            <h1 className="loginTitle">Log In</h1>
            <p className="welcomeText">Welcome Back!</p>
          </div>

          <form onSubmit={handleLogin} className="loginForm">
            <div className="inputGroup">
              <label className="inputLabel">Email</label>
              <input
                type="email"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="formInput"
              />
            </div>

            <div className="inputGroup">
              <label className="inputLabel">Password</label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="formInput"
              />
            </div>

            {error && <div className="errorMessage">{error}</div>}
            {loading && <div className="loadingMessage">Sending OTP...</div>}

            <button type="submit" className="loginButton" disabled={loading}>
              {loading ? "Please wait..." : "Log In"}
            </button>
          </form>

          <div className="partnerLink">
            <a href="/expression-of-interest" className="partnerText">
              Want to partner with us? Submit an expression of interest!
            </a>
          </div>
        </div>
      </div>

      {/* Right side - Logo/Brand */}
      <div className="brandSection">
        <div className="logoContainer">
          <img src={logo} alt="Secure Shift Logo" className="logoImage" />
        </div>
      </div>
    </div>
  );
}
