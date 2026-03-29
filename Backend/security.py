from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import db
from models import User
from config import settings
import os
import secrets


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

        return user


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
