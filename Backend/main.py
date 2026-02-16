from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# Database Seed
# -----------------------
@app.on_event("startup")
def startup():
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
        print("[OK] Test employee user created")
    if not session.query(User).filter(User.email == "employer@test.com").first():
        session.add(User(
            email="employer@test.com",
            hashed_password=SecurityService.hash_password("123456"),
            role="employer"
        ))
        session.commit()
        print("[OK] Test employer user created")

    # Seed test employee
    if not session.query(Employee).first():
        session.add(Employee(
            name="Test Employee",
            email="employee@test.com",
            role="Developer",
            is_streaming=True
        ))
        session.commit()
        print("[OK] Test employee created")

    # Seed treasury
    if not session.query(Treasury).first():
        session.add(Treasury(
            total_balance=100000.0,
            onchain_balance=50000.0
        ))
        session.commit()
        print("[OK] Treasury initialized")

    # Seed company settings (for tax)
    if not session.query(CompanySettings).first():
        session.add(CompanySettings(default_tax_rate=10.00))
        session.commit()
        print("[OK] Company settings initialized")

    session.close()
    print("[OK] Startup complete")

# -----------------------
# API Routes
# -----------------------
app.include_router(auth_router, prefix="/api")
app.include_router(api_router, prefix="/api")
app.include_router(blockchain_router, prefix="/api")

# -----------------------
# Frontend paths
# -----------------------
BASE_DIR = os.path.dirname(__file__)
FRONTPAGE_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "frontpage", "dist"))

# Confirmed employee dashboard path from your screenshot
EMPLOYEE_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "Frontendemployee", "dist"))

# -----------------------
# SPA routes FIRST (so they take precedence over mounts)
# -----------------------
@app.get("/")
def serve_frontpage():
    return FileResponse(os.path.join(FRONTPAGE_PATH, "index.html"))

@app.get("/employee")
def serve_employee_root():
    return FileResponse(os.path.join(EMPLOYEE_PATH, "index.html"))

@app.get("/employee/{full_path:path}")
def catch_employee(full_path: str):
    # Serve JS/CSS from dist so the employee app loads
    if full_path.startswith("assets/"):
        safe_path = os.path.normpath(full_path)
        if not safe_path.startswith(".") and ".." not in safe_path:
            asset_file = os.path.join(EMPLOYEE_PATH, safe_path)
            if os.path.isfile(asset_file):
                return FileResponse(asset_file)
    return FileResponse(os.path.join(EMPLOYEE_PATH, "index.html"))

@app.get("/{full_path:path}")
def catch_frontpage(full_path: str):
    if full_path.startswith("api"):
        return {"detail": "Not Found"}
    # Serve JS/CSS from frontpage dist so the app loads (avoid returning HTML for assets)
    if full_path.startswith("assets/"):
        safe_path = os.path.normpath(full_path)
        if not safe_path.startswith(".") and ".." not in safe_path:
            asset_file = os.path.join(FRONTPAGE_PATH, safe_path)
            if os.path.isfile(asset_file):
                return FileResponse(asset_file)
    return FileResponse(os.path.join(FRONTPAGE_PATH, "index.html"))

# -----------------------
# Static mounts (for assets not handled by path routes above)
# -----------------------
app.mount("/assets", StaticFiles(directory=os.path.join(FRONTPAGE_PATH, "assets")), name="frontpage-assets")
app.mount("/favicon.ico", StaticFiles(directory=FRONTPAGE_PATH), name="frontpage-favicon")
app.mount("/employee/assets", StaticFiles(directory=os.path.join(EMPLOYEE_PATH, "assets")), name="employee-assets")
app.mount("/employee/favicon.ico", StaticFiles(directory=EMPLOYEE_PATH), name="employee-favicon")









