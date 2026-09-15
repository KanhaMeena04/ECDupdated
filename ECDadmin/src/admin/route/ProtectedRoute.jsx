import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ role, children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/", { replace: true });
        
      } else if (role && user?.role !== role) {
        navigate("/", { replace: true });
      }
    }
  }, [loading, isAuthenticated, role, user, navigate]);

  if (loading || !isAuthenticated) {
    return <div className="p-6 text-gray-500">Checking authentication...</div>;
  }

  // If a child element (like <AppLayout />) was provided, render it so
  // nested routes will mount into its <Outlet />. Otherwise fall back to Outlet.
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
