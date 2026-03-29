from decimal import Decimal
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from api_routes import router as api_router
from auth import router as auth_router
from blockchain_routes import router as blockchain_router
from config import settings
from database import db
from models import CompanySettings, Employee, Treasury, User
from security import SecurityService

app = FastAPI()


def get_allowed_origins() -> list[str]:
    raw_origins = settings.ALLOWED_ORIGINS or os.environ.get("ALLOWED_ORIGINS", "*")
    return [o.strip() for o in raw_origins.split(",")] if raw_origins != "*" else ["*"]


ALLOWED_ORIGINS = get_allowed_origins()
ALLOW_CREDENTIALS = ALLOWED_ORIGINS != ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_wallet_address_column() -> None:
    try:
        from sqlalchemy import text

        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE employees ADD COLUMN wallet_address VARCHAR(42)"))
            conn.commit()
    except Exception:
        pass


def seed_demo_data(session: Session) -> None:
    if not session.query(User).filter(User.email == "employee@test.com").first():
        session.add(
            User(
                email="employee@test.com",
                hashed_password=SecurityService.hash_password("123456"),
                role="employee",
            )
        )
        session.commit()
        print("Test employee user created")

    if not session.query(User).filter(User.email == "employer@test.com").first():
        session.add(
            User(
                email="employer@test.com",
                hashed_password=SecurityService.hash_password("123456"),
                role="employer",
            )
        )
        session.commit()
        print("Test employer user created")

    if not session.query(User).filter(User.email == "employee@krackheads.com").first():
        session.add(
            User(
                email="employee@krackheads.com",
                hashed_password=SecurityService.hash_password("employee123"),
                role="employee",
            )
        )
        session.commit()
        print("Demo employee user created")

    if not session.query(User).filter(User.email == "admin@krackheads.com").first():
        session.add(
            User(
                email="admin@krackheads.com",
                hashed_password=SecurityService.hash_password("admin123"),
                role="admin",
            )
        )
        session.commit()
        print("Demo admin user created")

    if not session.query(Employee).filter(Employee.email == "employee@test.com").first():
        session.add(
            Employee(
                name="Test Employee",
                email="employee@test.com",
                role="Developer",
                is_streaming=True,
            )
        )
        session.commit()
        print("Test employee created")

    if not session.query(Employee).filter(Employee.email == "employee@krackheads.com").first():
        session.add(
            Employee(
                name="Demo Employee",
                email="employee@krackheads.com",
                role="Developer",
                is_streaming=True,
            )
        )
        session.commit()
        print("Demo employee created")


@app.on_event("startup")
def startup() -> None:
    db.create_tables()
    ensure_wallet_address_column()

    session: Session = db.SessionLocal()
    try:
        if settings.ENABLE_DEMO_SEED:
            seed_demo_data(session)

        if not session.query(Treasury).first():
            session.add(
                Treasury(
                    total_balance=Decimal("100000.00"),
                    onchain_balance=Decimal("50000.00"),
                )
            )
            session.commit()
            print("Treasury initialized")

        if not session.query(CompanySettings).first():
            session.add(CompanySettings(default_tax_rate=Decimal("10.00")))
            session.commit()
            print("Company settings initialized")
    finally:
        session.close()

    print("Startup complete")


app.include_router(auth_router, prefix="/api")
app.include_router(api_router, prefix="/api")
app.include_router(blockchain_router, prefix="/api")


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
