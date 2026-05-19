import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getAuthRole } from "../../lib/api";

type Props = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: Props) {
  const token = localStorage.getItem("token");
  const role = getAuthRole();

  if (!token || (role !== "employer" && role !== "admin")) {
    return <Navigate to="/employer-login" replace />;
  }

  return <>{children}</>;
}
