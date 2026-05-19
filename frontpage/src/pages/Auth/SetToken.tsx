import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getEmployeePortalUrl } from "../../lib/auth";

export default function SetToken() {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token") || "";
    const dest = params.get("dest") || getEmployeePortalUrl();
    if (token) {
      localStorage.setItem("token", token);
    }
    const url = new URL(dest);
    if (token) {
      url.searchParams.set("token", token);
    }
    window.location.href = url.toString();
  }, [location.search]);

  return null;
}
