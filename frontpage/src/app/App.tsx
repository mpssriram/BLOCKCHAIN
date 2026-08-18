import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { redirectToEmployeePortal } from "../lib/auth";
import { redirectToStreamlitDashboard } from "../lib/streamlit";
import AuthChoice from "../pages/Auth/AuthChoice";
import AutoLogin from "../pages/Auth/AutoLogin";
import EmployeeLogin from "../pages/Auth/EmployeeLogin";
import SetToken from "../pages/Auth/SetToken";
import LandingPage from "../pages/Marketing/LandingPage";

function EmployeePortalRedirect() {
  useEffect(() => {
    redirectToEmployeePortal();
  }, []);
  return null;
}

function StreamlitDashboardRedirect() {
  useEffect(() => {
    redirectToStreamlitDashboard();
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
        <Route path="/employer-login" element={<StreamlitDashboardRedirect />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/set-token" element={<SetToken />} />
        <Route path="/auto-login" element={<AutoLogin />} />

        <Route path="/employee" element={<EmployeePortalRedirect />} />
        <Route path="/employee/*" element={<EmployeePortalRedirect />} />

        <Route path="/employer-dashboard/*" element={<StreamlitDashboardRedirect />} />

      </Routes>
    </BrowserRouter>
  );
}

