from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from decimal import Decimal

from database import db
from models import User, Employee, Treasury, CompanySettings
from security import SecurityService
from auth import router as auth_router
from api_routes import router as api_router
from blockchain_routes import router as blockchain_router

app = FastAPI()

# -----------------------
# CORS
# -----------------------
# Set ALLOWED_ORIGINS in your environment (comma-separated) to restrict access.
# Example: ALLOWED_ORIGINS=https://myfrontend.vercel.app,https://myemployee.vercel.app
# Leave unset (or "*") to allow all origins (fine for development).
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else ["*"]
ALLOW_CREDENTIALS = ALLOWED_ORIGINS != ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# Database Seed
# -----------------------
@app.on_event("startup")
def startup():
    # NOTE: On Vercel serverless this runs on every cold start.
    # All DB operations below are idempotent (check-before-insert), so this is safe.
    db.create_tables()
    # Add wallet_address to employees if missing (migration)
    try:
        from sqlalchemy import text
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE employees ADD COLUMN wallet_address VARCHAR(42)"))
            conn.commit()
    except Exception:
        pass  # Column may already exist or unsupported DB
    session: Session = db.SessionLocal()

    # Seed test users (employee + employer)
    if not session.query(User).filter(User.email == "employee@test.com").first():
        session.add(User(
            email="employee@test.com",
            hashed_password=SecurityService.hash_password("123456"),
            role="employee"
        ))
        session.commit()
        print("✅ Test employee user created")
    if not session.query(User).filter(User.email == "employer@test.com").first():
        session.add(User(
            email="employer@test.com",
            hashed_password=SecurityService.hash_password("123456"),
            role="employer"
        ))
        session.commit()
        print("✅ Test employer user created")
    # Demo users (for screenshots and public testing)
    if not session.query(User).filter(User.email == "employee@krackheads.com").first():
        session.add(User(
            email="employee@krackheads.com",
            hashed_password=SecurityService.hash_password("employee123"),
            role="employee"
        ))
        session.commit()
        print("✅ Demo employee user created (employee@krackheads.com / employee123)")
    if not session.query(User).filter(User.email == "admin@krackheads.com").first():
        session.add(User(
            email="admin@krackheads.com",
            hashed_password=SecurityService.hash_password("admin123"),
            role="employer"
        ))
        session.commit()
        print("✅ Demo employer user created (admin@krackheads.com / admin123)")

    # Seed test employee
    if not session.query(Employee).first():
        session.add(Employee(
            name="Test Employee",
            email="employee@test.com",
            role="Developer",
            is_streaming=True
        ))
        session.commit()
        print("✅ Test employee created")
    # Ensure demo employee record exists
    if not session.query(Employee).filter(Employee.email == "employee@krackheads.com").first():
        session.add(Employee(
            name="Demo Employee",
            email="employee@krackheads.com",
            role="Developer",
            is_streaming=True
        ))
        session.commit()
        print("✅ Demo employee created")

    # Seed treasury
    if not session.query(Treasury).first():
        session.add(Treasury(
            total_balance=Decimal("100000.00"),
            onchain_balance=Decimal("50000.00")
        ))
        session.commit()
        print("✅ Treasury initialized")

    # Seed company settings (for tax)
    if not session.query(CompanySettings).first():
        session.add(CompanySettings(default_tax_rate=Decimal("10.00")))
        session.commit()
        print("✅ Company settings initialized")

    session.close()
    print("✅ Startup complete")

# -----------------------
# API Routes
# -----------------------
app.include_router(auth_router, prefix="/api")
app.include_router(api_router, prefix="/api")
app.include_router(blockchain_router, prefix="/api")

# -----------------------
# Frontend static file serving (local/self-hosted mode only)
# -----------------------
# On Vercel, the two frontends are deployed as separate projects.
# Static serving is skipped automatically when the dist/ folders don't exist.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTPAGE_PATH = os.path.join(BASE_DIR, "frontpage", "dist")
EMPLOYEE_PATH = os.path.join(BASE_DIR, "Frontendemployee", "dist")

if os.path.isdir(os.path.join(FRONTPAGE_PATH, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTPAGE_PATH, "assets")), name="frontpage-assets")

if os.path.isdir(FRONTPAGE_PATH):
    app.mount("/favicon.ico", StaticFiles(directory=FRONTPAGE_PATH), name="frontpage-favicon")

if os.path.isdir(os.path.join(EMPLOYEE_PATH, "assets")):
    app.mount("/employee/assets", StaticFiles(directory=os.path.join(EMPLOYEE_PATH, "assets")), name="employee-assets")

if os.path.isdir(EMPLOYEE_PATH):
    app.mount("/employee/favicon.ico", StaticFiles(directory=EMPLOYEE_PATH), name="employee-favicon")


@app.get("/")
def serve_frontpage():
    index = os.path.join(FRONTPAGE_PATH, "index.html")
    if os.path.exists(index):
        return FileResponse(index)
    return {"message": "CorePayroll API is running. Deploy frontends separately on Vercel."}


@app.get("/employee")
def serve_employee_root():
    index = os.path.join(EMPLOYEE_PATH, "index.html")
    if os.path.exists(index):
        return FileResponse(index)
    return {"message": "Employee portal is deployed as a separate Vercel project."}


@app.get("/employee/{full_path:path}")
def catch_employee(full_path: str):
    index = os.path.join(EMPLOYEE_PATH, "index.html")
    if os.path.exists(index):
        return FileResponse(index)
    return {"message": "Employee portal is deployed as a separate Vercel project."}


@app.get("/{full_path:path}")
def catch_frontpage(full_path: str):
    if full_path.startswith("api"):
        return {"detail": "Not Found"}
    index = os.path.join(FRONTPAGE_PATH, "index.html")
    if os.path.exists(index):
        return FileResponse(index)
    return {"detail": "Not Found"}









