from collections import defaultdict, deque
from datetime import datetime, timedelta
from threading import Lock

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
import base64
from html import escape
import json
import logging
import os
import secrets
from functools import lru_cache

from models import AccessRequest, Employee, PasswordResetChallenge, PortalHandoff, User
from schemas import (
    FirebaseTokenExchange,
    PasswordResetConfirm,
    PasswordResetOtpVerify,
    PasswordResetRequest,
    PortalHandoffExchange,
    Token,
    UserCreate,
)
from database import db
from security import SecurityService
from config import settings
from service import EmailNotifier

try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    from firebase_admin import credentials
except Exception:  # pragma: no cover - optional dependency until installed
    firebase_admin = None
    firebase_auth = None
    credentials = None


router = APIRouter()
logger = logging.getLogger(__name__)
ACCESS_REQUEST_WINDOW = timedelta(minutes=5)
ACCESS_REQUEST_LIMIT = 5
_access_request_attempts: dict[str, deque[datetime]] = defaultdict(deque)
_access_request_lock = Lock()


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


def _get_email_notifier() -> EmailNotifier:
    if not settings.SMTP_SERVER or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Approval email is not configured")
    return EmailNotifier(settings.SMTP_SERVER, settings.SMTP_PORT, settings.SMTP_USERNAME, settings.SMTP_PASSWORD)


def _issue_access_token(user: User) -> str:
    return SecurityService.create_access_token(
        data={"sub": user.email, "role": user.role, "session_version": user.session_version}
    )


def _enforce_access_request_rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    now = datetime.utcnow()
    with _access_request_lock:
        attempts = _access_request_attempts[client_ip]
        while attempts and attempts[0] <= now - ACCESS_REQUEST_WINDOW:
            attempts.popleft()
        if len(attempts) >= ACCESS_REQUEST_LIMIT:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many access requests. Please try again later.")
        attempts.append(now)


@router.post("/firebase-login", response_model=Token)
def firebase_login(payload: FirebaseTokenExchange, session: Session = Depends(db.get_db)):
    if firebase_auth is None:
        raise HTTPException(status_code=503, detail="Firebase admin verification is unavailable")

    _get_firebase_app()

    try:
        decoded = firebase_auth.verify_id_token(payload.id_token, check_revoked=False, clock_skew_seconds=60)
    except Exception as exc:
        logger.exception("Firebase token verification failed")
        detail = "Invalid Firebase token"
        if settings.APP_ENV != "production":
            detail = f"Invalid Firebase token: {exc}"
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail) from exc

    email = decoded.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Firebase token missing email")

    role_hint = _normalize_role(payload.role_hint)
    db_user = session.query(User).filter(User.email == email).first()

    if db_user:
        allowed_for_portal = (
            db_user.role in {"employer", "admin"} if role_hint == "employer" else db_user.role == role_hint
        )
        if not allowed_for_portal:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"This email is registered as '{db_user.role}' but you opened the '{role_hint}' portal. "
                    "Use a different email for each portal, or ask an admin to update your role."
                ),
            )
        SecurityService.require_active_employee(db_user, session)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account requires employer approval before sign-in.")

    access_token = _issue_access_token(db_user)
    return {"access_token": access_token, "token_type": "bearer"}


# =========================
# REGISTER (JSON)
# =========================
@router.post("/register")
def register(
    user: UserCreate,
    session: Session = Depends(db.get_db),
    _: User = Depends(SecurityService.require_admin),
):

    existing = session.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user.email,
        hashed_password=SecurityService.hash_password(user.password),
        role=user.role,
    )

    session.add(new_user)
    if user.role == "employee" and not session.query(Employee).filter(Employee.email == user.email).first():
        session.add(
            Employee(
                name=user.email.split("@", 1)[0].replace(".", " ").title(),
                email=user.email,
                role="Employee",
                is_active=True,
            )
        )
    session.commit()
    session.refresh(new_user)

    return {"message": "User registered successfully"}


# =========================
# LOGIN (OAuth2 Form Data)
# =========================
@router.post("/login", response_model=Token)
async def login(
    request: Request,
    background_tasks: BackgroundTasks,
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(db.get_db)
):
    submitted_form = await request.form()
    requested_role = _normalize_role(str(submitted_form.get("role_hint", "employee")))
    db_user = session.query(User).filter(User.email == form_data.username).first()

    if not db_user:
        if requested_role != "employee":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employer and admin accounts must be created by an administrator.",
            )

        existing_request = session.query(AccessRequest).filter(AccessRequest.email == form_data.username).first()
        if existing_request:
            if not SecurityService.verify_password(form_data.password, existing_request.hashed_password):
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
            if existing_request.status == "pending":
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your access request is waiting for employer approval.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your access request was not approved.")

        _enforce_access_request_rate_limit(request)
        notifier = _get_email_notifier()
        approvers = session.query(User).filter(User.role.in_(("employer", "admin"))).all()
        if not approvers:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="No employer account is available to review access requests.")

        access_request = AccessRequest(
            email=form_data.username,
            hashed_password=SecurityService.hash_password(form_data.password),
            requested_role="employee",
        )
        session.add(access_request)
        session.commit()
        safe_email = escape(form_data.username)
        for approver in approvers:
            background_tasks.add_task(
                notifier.send,
                approver.email,
                "PayStream access approval needed",
                (
                    f"<p><strong>{safe_email}</strong> requested employee access.</p>"
                    "<p>Open the Employees page in the employer dashboard to approve or reject the request.</p>"
                ),
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your access request has been sent to the employer for approval.",
        )

    if not SecurityService.verify_password(
        form_data.password,
        db_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    allowed_for_portal = (
        db_user.role in {"employer", "admin"} if requested_role == "employer" else db_user.role == requested_role
    )
    if not allowed_for_portal:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account does not have access to this portal.")

    SecurityService.require_active_employee(db_user, session)

    access_token = _issue_access_token(db_user)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/access-requests")
def list_access_requests(
    session: Session = Depends(db.get_db),
    _: User = Depends(SecurityService.require_dashboard_user),
):
    requests = (
        session.query(AccessRequest)
        .filter(AccessRequest.status == "pending")
        .order_by(AccessRequest.created_at.desc())
        .all()
    )
    return [
        {
            "id": item.id,
            "email": item.email,
            "requested_role": item.requested_role,
            "created_at": item.created_at,
        }
        for item in requests
    ]


@router.post("/access-requests/{request_id}/approve")
def approve_access_request(
    request_id: int,
    background_tasks: BackgroundTasks,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    access_request = session.query(AccessRequest).filter(
        AccessRequest.id == request_id,
        AccessRequest.status == "pending",
    ).first()
    if not access_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending access request not found")
    if session.query(User).filter(User.email == access_request.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account already exists for this email")

    notifier = _get_email_notifier()
    now = datetime.utcnow()
    session.add(User(email=access_request.email, hashed_password=access_request.hashed_password, role="employee"))
    employee = session.query(Employee).filter(Employee.email == access_request.email).first()
    if not employee:
        session.add(
            Employee(
                name=access_request.email.split("@", 1)[0].replace(".", " ").title(),
                email=access_request.email,
                role="Employee",
                is_active=True,
            )
        )
    access_request.status = "approved"
    access_request.reviewed_at = now
    access_request.reviewed_by = current_user.id
    session.commit()
    background_tasks.add_task(
        notifier.send,
        access_request.email,
        "Your PayStream access has been approved",
        "<p>Your employee access has been approved. You can now sign in to PayStream.</p>",
    )
    return {"message": "Access approved and the employee has been notified."}


@router.post("/access-requests/{request_id}/reject")
def reject_access_request(
    request_id: int,
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_dashboard_user),
):
    access_request = session.query(AccessRequest).filter(
        AccessRequest.id == request_id,
        AccessRequest.status == "pending",
    ).first()
    if not access_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending access request not found")

    access_request.status = "rejected"
    access_request.reviewed_at = datetime.utcnow()
    access_request.reviewed_by = current_user.id
    session.commit()
    return {"message": "Access request rejected."}


@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
def request_password_reset(
    payload: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(db.get_db),
):
    if not settings.SMTP_SERVER or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Password-reset email is not configured")

    user = session.query(User).filter(User.email == payload.email).first()
    if user:
        now = datetime.utcnow()
        latest = (
            session.query(PasswordResetChallenge)
            .filter(PasswordResetChallenge.email == user.email)
            .order_by(PasswordResetChallenge.created_at.desc())
            .first()
        )
        if latest and latest.created_at > now - timedelta(seconds=60):
            return {"message": "If an account uses that email address, a verification code has been sent."}

        session.query(PasswordResetChallenge).filter(
            PasswordResetChallenge.email == user.email,
            PasswordResetChallenge.used_at.is_(None),
        ).update({PasswordResetChallenge.used_at: now}, synchronize_session=False)

        otp = f"{secrets.randbelow(1_000_000):06d}"
        challenge = PasswordResetChallenge(
            email=user.email,
            otp_hash=SecurityService.hash_password_reset_otp(otp),
            expires_at=now + timedelta(minutes=10),
        )
        session.add(challenge)
        session.commit()
        body = (
            "<p>Use this verification code to reset your PayStream password:</p>"
            f"<p style=\"font-size: 28px; font-weight: 700; letter-spacing: 6px;\">{otp}</p>"
            "<p>This code expires in 10 minutes and can only be used once. If you did not request it, you can ignore this email.</p>"
        )
        background_tasks.add_task(
            EmailNotifier(settings.SMTP_SERVER, settings.SMTP_PORT, settings.SMTP_USERNAME, settings.SMTP_PASSWORD).send,
            user.email,
            "Your PayStream password-reset code",
            body,
        )

    return {"message": "If an account uses that email address, a verification code has been sent."}


@router.post("/password-reset/verify-otp")
def verify_password_reset_otp(payload: PasswordResetOtpVerify, session: Session = Depends(db.get_db)):
    now = datetime.utcnow()
    challenge = (
        session.query(PasswordResetChallenge)
        .filter(
            PasswordResetChallenge.email == payload.email,
            PasswordResetChallenge.used_at.is_(None),
            PasswordResetChallenge.verified_at.is_(None),
            PasswordResetChallenge.expires_at > now,
        )
        .order_by(PasswordResetChallenge.created_at.desc())
        .first()
    )
    if not challenge:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The code is invalid or has expired.")

    if challenge.attempts >= 5:
        challenge.used_at = now
        session.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The code is invalid or has expired.")

    expected_hash = SecurityService.hash_password_reset_otp(payload.otp)
    if not secrets.compare_digest(challenge.otp_hash, expected_hash):
        challenge.attempts += 1
        if challenge.attempts >= 5:
            challenge.used_at = now
        session.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The code is invalid or has expired.")

    challenge.verified_at = now
    session.commit()
    return {
        "reset_token": SecurityService.create_verified_password_reset_token(challenge.email, challenge.id),
        "expires_in_seconds": 600,
    }


@router.post("/password-reset/confirm")
def confirm_password_reset(payload: PasswordResetConfirm, session: Session = Depends(db.get_db)):
    email, challenge_id = SecurityService.get_verified_password_reset_claims(payload.reset_token)
    now = datetime.utcnow()
    challenge = session.query(PasswordResetChallenge).filter(
        PasswordResetChallenge.id == challenge_id,
        PasswordResetChallenge.email == email,
        PasswordResetChallenge.verified_at.is_not(None),
        PasswordResetChallenge.used_at.is_(None),
        PasswordResetChallenge.expires_at > now,
    ).first()
    user = session.query(User).filter(User.email == email).first()
    if not challenge or not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This verified reset session is invalid or has expired.")

    user.hashed_password = SecurityService.hash_password(payload.password)
    user.session_version += 1
    challenge.used_at = now
    session.commit()
    return {"message": "Password updated. You can now sign in."}


@router.post("/portal-handoff")
def create_portal_handoff(
    session: Session = Depends(db.get_db),
    current_user: User = Depends(SecurityService.require_employee),
):
    SecurityService.require_active_employee(current_user, session)
    code = secrets.token_urlsafe(32)
    session.query(PortalHandoff).filter(
        PortalHandoff.user_id == current_user.id,
        PortalHandoff.used_at.is_(None),
    ).delete(synchronize_session=False)
    session.add(
        PortalHandoff(
            code_hash=SecurityService.hash_portal_handoff_code(code),
            user_id=current_user.id,
            expires_at=datetime.utcnow() + timedelta(minutes=1),
        )
    )
    session.commit()
    return {"code": code, "expires_in_seconds": 60}


@router.post("/portal-handoff/exchange", response_model=Token)
def exchange_portal_handoff(payload: PortalHandoffExchange, session: Session = Depends(db.get_db)):
    now = datetime.utcnow()
    handoff = session.query(PortalHandoff).filter(
        PortalHandoff.code_hash == SecurityService.hash_portal_handoff_code(payload.code),
        PortalHandoff.used_at.is_(None),
        PortalHandoff.expires_at > now,
    ).first()
    if not handoff:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Portal sign-in has expired. Please sign in again.")

    user = session.query(User).filter(User.id == handoff.user_id).first()
    if not user or user.role != "employee":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Portal sign-in is invalid.")
    SecurityService.require_active_employee(user, session)

    handoff.used_at = now
    session.commit()
    return {"access_token": _issue_access_token(user), "token_type": "bearer"}

