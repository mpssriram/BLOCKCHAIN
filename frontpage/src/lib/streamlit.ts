const defaultDashboardUrl = "http://127.0.0.1:8501";

export const streamlitDashboardUrl =
  (import.meta as any).env?.VITE_STREAMLIT_DASHBOARD_URL?.trim() || defaultDashboardUrl;

export function redirectToStreamlitDashboard() {
  window.location.assign(streamlitDashboardUrl);
}
