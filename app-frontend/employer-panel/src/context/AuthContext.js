import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [twoFAPending, setTwoFAPending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("jwt");

    if (token) {
      fetch("http://localhost:5000/api/v1/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error("Token invalid");
          return res.json();
        })
        .then(data => {
          setUser(data);
          if (window.location.pathname === "/" || window.location.pathname === "/login") {
            navigate("/employer-dashboard");
          }
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem("jwt");
          if (!twoFAPending && window.location.pathname !== "/login") {
            navigate("/login");
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      if (!twoFAPending && window.location.pathname !== "/login") navigate("/login");
    }
  }, [twoFAPending]);

  const login = (userData, token) => {
    localStorage.setItem("jwt", token); // store JWT consistently
    setUser(userData);
    setTwoFAPending(false);
    navigate("/employer-dashboard");
  };

  const startTwoFA = () => setTwoFAPending(true);

  const logout = () => {
    localStorage.removeItem("jwt");
    setUser(null);
    navigate("/login");
  };

  if (loading) return null; 

  return (
    <AuthContext.Provider value={{ user, login, logout, startTwoFA, twoFAPending }}>
      {children}
    </AuthContext.Provider>
  );
};