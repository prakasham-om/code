// components/ProtectedRoute.jsx
import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const user = useSelector((state) => state.user);

  if (!user || !user.email) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
