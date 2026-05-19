import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ui/ProtectedRoute";
import { redirectToEmployeePortal } from "../lib/auth";
import AuthChoice from "../pages/Auth/AuthChoice";
import AutoLogin from "../pages/Auth/AutoLogin";
import EmployeeLogin from "../pages/Auth/EmployeeLogin";
import EmployerLogin from "../pages/Auth/EmployerLogin";
import SetToken from "../pages/Auth/SetToken";
/* Employer Pages */
import Bonuses from "../pages/Employer/Bonuses";
import EmployeeDetails from "../pages/Employer/EmployeeDetails";
import Employees from "../pages/Employer/Employees";
import Overview from "../pages/Employer/Overview";
import Settings from "../pages/Employer/Settings";
import Treasury from "../pages/Employer/Treasury";
import LandingPage from "../pages/Marketing/LandingPage";
import EmployerLayout from "../layouts/employer/EmployerDashboard";

function EmployeePortalRedirect() {
  useEffect(() => {
    redirectToEmployeePortal();
  }, []);
  return null;
}
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthChoice />} />
        <Route path="/employer-login" element={<EmployerLogin />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/set-token" element={<SetToken />} />
        <Route path="/auto-login" element={<AutoLogin />} />

        <Route path="/employee" element={<EmployeePortalRedirect />} />
        <Route path="/employee/*" element={<EmployeePortalRedirect />} />

        {/* Employer Dashboard (Protected + Nested Routes) */}
        <Route
          path="/employer-dashboard"
          element={
            <ProtectedRoute>
              <EmployerLayout />
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

