# PayStream Employer Frontend

This React application provides the public entry page, employer sign-in, password reset, and protected employer dashboard.

Run it locally from this directory:

```powershell
npm install
npm run dev
```

It serves on `http://127.0.0.1:5173` and proxies `/api` calls to the FastAPI backend on port 8000.

Employee sign-in begins here and redirects to the separate React employee portal using a short-lived one-time code. No bearer token is included in the browser URL.

Run `python configure_local.py` from the repository root to create the backend and shared frontend configuration files. For the complete setup and deployment guide, read the repository [README](../README.md).
