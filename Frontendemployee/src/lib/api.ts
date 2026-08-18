// Same-origin API. Vite dev: proxy /api to backend. Production: set VITE_API_BASE to your Backend Vercel URL.
// Example: VITE_API_BASE=https://corepayroll-api.vercel.app
const BASE = (import.meta as any).env?.VITE_API_BASE || "";
const EMPLOYEE_LOGIN_URL = (import.meta as any).env?.VITE_EMPLOYEE_LOGIN_URL || "/employee-login";

export async function exchangePortalHandoff(code: string) {
  const res = await fetch(`${BASE}/api/portal-handoff/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Portal sign-in has expired.");
  }
  return res.json();
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: getAuthHeaders(),
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    if (window.location.pathname !== "/employee-login") {
      window.location.href = EMPLOYEE_LOGIN_URL;
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export async function getMyProfile() {
  return apiRequest("/api/me/profile");
}

export async function getMyTransactions() {
  return apiRequest("/api/me/transactions");
}

export async function getBlockchainConfig() {
  return apiRequest("/api/blockchain/config");
}

export async function updateMyWallet(wallet_address: string) {
  return apiRequest("/api/me/wallet", {
    method: "PUT",
    body: JSON.stringify({ wallet_address }),
  });
}

export async function recordMyWithdrawal(tx_hash: string, amount?: number) {
  return apiRequest("/api/me/withdrawals/record", {
    method: "POST",
    body: JSON.stringify({
      tx_hash,
      amount: typeof amount === "number" ? amount : null,
    }),
  });
}
