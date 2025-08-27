import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../logo.png";
import "./Login.css";

const mockUsers = [
  { email: "demo@example.com", password: "password123" },
  { email: "user@test.com", password: "testpass" },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Simulate a login check against mock users Start
    //TODO: Replace this with actual authentication logic
    const user = mockUsers.find((u) => u.email === email);
    if (!user || user.password !== password) {
      setError("Either email or password is incorrect.");
    } else {
      setError("");
      navigate("/dashboard");
    }
    // Simulate a login check against mock users END
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
              <div className="forgotPassword">
                <a href="#" className="forgotLink">
                  Forgot Password?
                </a>
              </div>
            </div>

            {error && <div className="errorMessage">{error}</div>}

            <button type="submit" className="loginButton">
              Log In
            </button>
          </form>

          <div className="partnerLink">
            <a href="#" className="partnerText">
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
