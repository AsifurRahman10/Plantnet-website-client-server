import { Navigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../components/Shared/LoadingSpinner";
import useRole from "../hooks/useRole";

export const AdminRoute = ({ children }) => {
  const [role, isLoading] = useRole();
  console.log(role);

  if (isLoading) return <LoadingSpinner />;
  if (role.role === "admin") return children;
  return <Navigate to="/dashboard" replace="true" />;
};
