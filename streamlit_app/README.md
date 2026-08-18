# Streamlit Employer Dashboard

This is the Streamlit migration for the employer and administrator workspace. It uses the existing FastAPI API, database, authentication, and smart contract. The React employee portal remains in place because browser-wallet operations are better suited to a browser-first frontend.

## Run locally

Start FastAPI first:

```powershell
cd Backend
uvicorn main:app --reload
```

In another terminal:

```powershell
cd streamlit_app
python -m pip install -r requirements.txt
python -m streamlit run app.py
```

Open the URL printed by Streamlit, normally `http://localhost:8501`.

For a deployed backend, set `PAYSTREAM_API_URL` before starting Streamlit. The default is `http://127.0.0.1:8000`.

Sign in with an existing employer or admin account. The app calls the FastAPI `/api/login` route and keeps the returned token only in Streamlit session state.

## Included workflow

- Payroll metrics, monthly flow, top earners, and treasury health
- Employee creation, search, wallet and tax settings, salary and bonus records
- Backend stream state controls and employee deactivation
- Backend treasury deposit and withdrawal records
- Monthly payroll CSV export and tax report inspection
- Company tax rate and tax slab management

## Deliberately not migrated

- Browser wallet connection and direct contract transactions
- Employee claim and live stream controls
- On-chain treasury sync, because the FastAPI `read_onchain_balance()` integration is still a placeholder

Those workflows remain with the existing React employee portal or require a backend implementation before exposing them in Streamlit.
