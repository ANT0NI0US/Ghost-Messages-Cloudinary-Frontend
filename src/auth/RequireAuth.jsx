import { Navigate, useLocation } from "react-router-dom";
import { Loading } from "../components/ui.jsx";
import { useAuth } from "./AuthProvider.jsx";

export const RequireAuth = ({ admin = false, children }) => {
  const { user, ready, isAdmin } = useAuth();
  const location = useLocation();

  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && !isAdmin) return <Navigate to="/inbox" replace />;
  return children;
};

// login / signup pages send a signed-in user straight to the inbox
export const GuestOnly = ({ children }) => {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (user) return <Navigate to="/inbox" replace />;
  return children;
};
