import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { isDemoLoginEnabled, loginWithFirebase, redirectToEmployeePortal } from "../../lib/auth";

export default function AutoLogin() {
  const location = useLocation();
  const [status, setStatus] = useState("Logging in...");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const role = (params.get("role") || "employee").toLowerCase();
    const destParam = params.get("dest");
    const employerDest = "/employer-dashboard/overview";
    const isDashboardRole = role === "employer" || role === "admin";
    const fallbackUrl = isDashboardRole ? "/employer-login" : "/employee-login";

    if (!isDemoLoginEnabled()) {
      window.location.href = fallbackUrl;
      return;
    }

    const demoEmployerEmail = (import.meta as any).env?.VITE_DEMO_EMPLOYER_EMAIL || "";
    const demoEmployerPassword = (import.meta as any).env?.VITE_DEMO_EMPLOYER_PASSWORD || "";
    const demoEmployeeEmail = (import.meta as any).env?.VITE_DEMO_EMPLOYEE_EMAIL || "";
    const demoEmployeePassword = (import.meta as any).env?.VITE_DEMO_EMPLOYEE_PASSWORD || "";

    const email = isDashboardRole ? demoEmployerEmail : demoEmployeeEmail;
    const password = isDashboardRole ? demoEmployerPassword : demoEmployeePassword;

    if (!email || !password) {
      setStatus("Demo login is enabled, but demo credentials are not configured.");
      return;
    }

    loginWithFirebase(email, password, isDashboardRole ? "employer" : "employee")
      .then(() => {
        if (isDashboardRole) {
          window.location.href = destParam || employerDest;
        } else {
          redirectToEmployeePortal();
        }
      })
      .catch(() => setStatus("Login failed"))
      .finally(() => { });
  }, [location.search]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ fontSize: 16 }}>{status}</div>
    </div>
  );
}
