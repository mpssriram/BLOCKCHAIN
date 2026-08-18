from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import db
from models import Employee, User
from config import settings


class SecurityService:
    # ---------------------------
    # JWT settings
    # ---------------------------
    # BUG FIX: Never use secrets.token_urlsafe() as a fallback here.
    # A new random key on every cold start (Vercel serverless) invalidates ALL user JWTs.
    # SECRET_KEY must always come from config. The config default is "CHANGE-ME-IN-PRODUCTION".
    SECRET_KEY = settings.SECRET_KEY
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60

    # ---------------------------
    # Password hashing
    # ---------------------------
    pwd_context = CryptContext(
        schemes=["pbkdf2_sha256"],
        deprecated="auto"
    )

    # OAuth2 dependency
    oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

    # ---------------------------
    # Hash / verify password
    # ---------------------------
    @classmethod
    def hash_password(cls, password: str) -> str:
        return cls.pwd_context.hash(password)

    @classmethod
    def verify_password(cls, plain_password: str, hashed_password: str) -> bool:
        return cls.pwd_context.verify(plain_password, hashed_password)

    # ---------------------------
    # JWT token creation
    # ---------------------------
    @classmethod
    def create_access_token(cls, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=cls.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, cls.SECRET_KEY, algorithm=cls.ALGORITHM)

    @classmethod
    def hash_portal_handoff_code(cls, code: str) -> str:
        return hmac.new(cls.SECRET_KEY.encode("utf-8"), code.encode("utf-8"), hashlib.sha256).hexdigest()

    @classmethod
    def hash_password_reset_otp(cls, otp: str) -> str:
        return hmac.new(cls.SECRET_KEY.encode("utf-8"), otp.encode("utf-8"), hashlib.sha256).hexdigest()

    @classmethod
    def create_verified_password_reset_token(cls, email: str, challenge_id: int) -> str:
        payload = {
            "sub": email,
            "purpose": "verified_password_reset",
            "challenge_id": challenge_id,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
        }
        return jwt.encode(payload, cls.SECRET_KEY, algorithm=cls.ALGORITHM)

    @classmethod
    def get_verified_password_reset_claims(cls, token: str) -> tuple[str, int]:
        try:
            payload = jwt.decode(token, cls.SECRET_KEY, algorithms=[cls.ALGORITHM])
            email = payload.get("sub")
            challenge_id = payload.get("challenge_id")
            if (
                payload.get("purpose") != "verified_password_reset"
                or not isinstance(email, str)
                or not isinstance(challenge_id, int)
            ):
                raise JWTError("Invalid reset token")
            return email, challenge_id
        except JWTError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This verified reset session is invalid or has expired.",
            ) from exc

    # ---------------------------
    # Get current user from token
    # ---------------------------
    @staticmethod
    def get_current_user(
        token: str = Depends(oauth2_scheme),
        session: Session = Depends(db.get_db)
    ) -> User:

        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = jwt.decode(
                token,
                SecurityService.SECRET_KEY,
                algorithms=[SecurityService.ALGORITHM],
            )
            email: str = payload.get("sub")
            if email is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception

        user = session.query(User).filter(User.email == email).first()
        if user is None:
            raise credentials_exception

        token_version = payload.get("session_version")
        if token_version != user.session_version:
            raise credentials_exception

        if user.role == "employee":
            employee = session.query(Employee).filter(Employee.email == user.email).first()
            if employee is None or not employee.is_active:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employee access is inactive")

        return user

    @staticmethod
    def require_active_employee(user: User, session: Session) -> None:
        if user.role != "employee":
            return
        employee = session.query(Employee).filter(Employee.email == user.email).first()
        if employee is None or not employee.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employee access is inactive")


    @staticmethod
    def require_employer(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role != "employer":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employer access required")
        return current_user


    @staticmethod
    def require_dashboard_user(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in {"admin", "employer"}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Dashboard access required")
        return current_user


    @staticmethod
    def require_admin(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
        return current_user


    @staticmethod
    def require_employee(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role != "employee":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employee access required")
        return current_user
