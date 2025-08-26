import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../logo.png"

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

        <div style={styles.loginContainer}>
            {/* Left side - Login Form */}
            <div style={styles.loginFormSection}>
                <div style={styles.formContainer}>
                    <div style={styles.headerSection}>
                        <p style={styles.employerText}>Employer</p>
                        <h1 style={styles.loginTitle}>Log In</h1>
                        <p style={styles.welcomeText}>Welcome Back!</p>
                    </div>

                    <form onSubmit={handleLogin} style={styles.loginForm}>
                        <div style={styles.inputGroup}>
                            <label style={styles.inputLabel}>Email</label>
                            <input
                                type="email"
                                placeholder="example@mail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={styles.formInput}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.inputLabel}>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={styles.formInput}
                            />
                            <div style={styles.forgotPassword}>
                                <a href="#" style={styles.forgotLink}>Forgot Password?</a>
                            </div>
                        </div>

                        {error && (
                            <div style={styles.errorMessage}>
                                {error}
                            </div>
                        )}

                        <button type="submit" style={styles.loginButton}>
                            Log In
                        </button>
                    </form>

                    <div style={styles.partnerLink}>
                        <a href="#" style={styles.partnerText}>
                            Want to partner with us? Submit an expression of interest!
                        </a>
                    </div>
                </div>
            </div>

            {/* Right side - Logo/Brand */}
            <div style={styles.brandSection}>             
                <div style={styles.logoContainer}>
                        <img src={logo} alt="Secure Shift Logo" style={styles.logoImage} />
                </div>
            </div>
        </div>
    );
}

const styles = {
    loginContainer: {
        minHeight: '100vh',
        display: 'flex',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
    },
    loginFormSection: {
        width: '60%',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
    },
    formContainer: {
        width: '100%',
        maxWidth: '400px'
    },
    headerSection: {
        marginBottom: '2rem'
    },
    employerText: {
        color: '#6b7280',
        fontSize: '2rem',
        margin:'0'
    },
    loginTitle: {
        fontSize: '3.5rem',
        fontWeight: 'bold',
        color: '#000000',
        margin:'0'
    },
    welcomeText: {
        color: '#374151'
    },
    loginForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column'
    },
    inputLabel: {
        color: '#374151',
        fontSize: '0.875rem',
        fontWeight: '500',
        marginBottom: '0.5rem'
    },
    formInput: {
        width: '100%',
        padding: '0.75rem 1rem',
        backgroundColor: '#d1d5db',
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem',
        outline: 'none',
        fontSize: '1rem',
    },
    forgotPassword: {
        textAlign: 'right',
        marginTop: '0.5rem'
    },
    forgotLink: {
        color: '#ef4444',
        fontSize: '0.875rem',
        textDecoration: 'none'
    },
    errorMessage: {
        color: '#ef4444',
        fontSize: '0.875rem',
        backgroundColor: '#fef2f2',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid #fecaca'
    },
    loginButton: {
        width: '60%',
        backgroundColor: '#072261',
        color: 'white',
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '0.5rem',
        fontWeight: '500',
        cursor: 'pointer',
        fontSize: '1rem',
        margin: '0 auto'
    },
    partnerLink: {
        marginTop: '2rem',
        textAlign: 'center'
    },
    partnerText: {
        color: '#ef4444',
        fontSize: '0.875rem',
        textDecoration: 'none'
    },
    brandSection: {
        width: '40%',
        background: '#072261',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        textAlign: 'center'
    },
    logoImage: {
        width: '400px',
        height: 'auto',
        objectFit: 'contain',
    },
};