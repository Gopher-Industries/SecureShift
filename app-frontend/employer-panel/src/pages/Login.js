import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
        <div style={{ padding: "2rem" }}>
            <h1>Login Page</h1>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ display: "block", margin: "0.5rem 0" }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ display: "block", margin: "0.5rem 0" }}
                />
                <button type="submit">Login</button>
            </form>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}
