from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
import base64
import json
import os
from functools import lru_cache

from models import User
from schemas import FirebaseTokenExchange, UserCreate, Token
from database import db
from security import SecurityService
from config import settings

try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    from firebase_admin import credentials
except Exception:  # pragma: no cover - optional dependency until installed
    firebase_admin = None
    firebase_auth = None
    credentials = None


router = APIRouter()


def _decode_service_account(raw_value: str) -> dict:
    try:
        if raw_value.strip().startswith("{"):
            return json.loads(raw_value)
        decoded = base64.b64decode(raw_value).decode("utf-8")
        return json.loads(decoded)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Invalid Firebase service account configuration") from exc


def _load_service_account_raw() -> str:
    path = settings.FIREBASE_SERVICE_ACCOUNT_PATH or os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")
    if path:
        resolved = os.path.abspath(os.path.expanduser(path))
        if os.path.isfile(resolved):
            with open(resolved, encoding="utf-8") as handle:
                return handle.read()

    return settings.FIREBASE_SERVICE_ACCOUNT_JSON or os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON") or ""


@lru_cache(maxsize=1)
def _get_firebase_app():
    if firebase_admin is None or credentials is None:
        raise HTTPException(status_code=503, detail="Firebase admin dependency is not installed")

    if firebase_admin._apps:
        return firebase_admin.get_app()

    raw_credentials = _load_service_account_raw()
    if not raw_credentials:
        raise HTTPException(status_code=503, detail="Firebase service account is not configured")

    service_account = _decode_service_account(raw_credentials)
    return firebase_admin.initialize_app(credentials.Certificate(service_account))


def _normalize_role(role: str | None) -> str:
    value = (role or "employee").strip().lower()
    return value if value in {"admin", "employer", "employee"} else "employee"


@router.post("/firebase-login", response_model=Token)
def firebase_login(payload: FirebaseTokenExchange, session: Session = Depends(db.get_db)):
    if firebase_auth is None:
        raise HTTPException(status_code=503, detail="Firebase admin verification is unavailable")

    _get_firebase_app()

    try:
        decoded = firebase_auth.verify_id_token(payload.id_token)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Firebase token") from exc

    email = decoded.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Firebase token missing email")

    role_hint = _normalize_role(payload.role_hint)
    db_user = session.query(User).filter(User.email == email).first()

    if db_user:
        if db_user.role != role_hint:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"This email is registered as '{db_user.role}' but you opened the '{role_hint}' portal. "
                    "Use a different email for each portal, or ask an admin to update your role."
                ),
            )
        role = db_user.role
    else:
        role = role_hint
        db_user = User(
            email=email,
            hashed_password=SecurityService.hash_password(decoded.get("uid", email)),
            role=role,
        )
        session.add(db_user)
        session.commit()
        session.refresh(db_user)

    access_token = SecurityService.create_access_token(data={"sub": db_user.email, "role": role})
    return {"access_token": access_token, "token_type": "bearer"}


# =========================
# REGISTER (JSON)
# =========================
@router.post("/register")
def register(user: UserCreate, session: Session = Depends(db.get_db)):

    existing = session.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user.email,
        hashed_password=SecurityService.hash_password(user.password),
        role=user.role
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return {"message": "User registered successfully"}


# =========================
# LOGIN (OAuth2 Form Data)
# =========================
@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(db.get_db)
):

    db_user = session.query(User).filter(User.email == form_data.username).first()

    if not db_user or not SecurityService.verify_password(
        form_data.password,
        db_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    access_token = SecurityService.create_access_token(
        data={"sub": db_user.email, "role": db_user.role}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

