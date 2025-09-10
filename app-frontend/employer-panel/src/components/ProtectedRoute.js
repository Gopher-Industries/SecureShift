// components/ProtectedRoute.js
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, twoFAPending } = useContext(AuthContext);

  // Allow access if 2FA is pending
  if (!user && !twoFAPending) return <Navigate to="/login" />;

  return children;
};

export default ProtectedRoute;