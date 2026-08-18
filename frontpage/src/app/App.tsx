import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "../components/ui/ProtectedRoute";
import EmployerDashboard from "../layouts/employer/EmployerDashboard";
import { redirectToEmployeePortal } from "../lib/auth";
import AuthChoice from "../pages/Auth/AuthChoice";
import EmployeeLogin from "../pages/Auth/EmployeeLogin";
import EmployerLogin from "../pages/Auth/EmployerLogin";
import ResetPassword from "../pages/Auth/ResetPassword";
import Bonuses from "../pages/Employer/Bonuses";
import EmployeeDetails from "../pages/Employer/EmployeeDetails";
import Employees from "../pages/Employer/Employees";
import Overview from "../pages/Employer/Overview";
import Settings from "../pages/Employer/Settings";
import Treasury from "../pages/Employer/Treasury";
import LandingPage from "../pages/Marketing/LandingPage";

function EmployeePortalRedirect() {
  useEffect(() => {
    void redirectToEmployeePortal();
  }, []);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthChoice />} />
        <Route path="/employer-login" element={<EmployerLogin />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/employee" element={<EmployeePortalRedirect />} />
        <Route path="/employee/*" element={<EmployeePortalRedirect />} />

        <Route
          path="/employer-dashboard"
          element={
            <ProtectedRoute>
              <EmployerDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id" element={<EmployeeDetails />} />
          <Route path="treasury" element={<Treasury />} />
          <Route path="bonuses" element={<Bonuses />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
