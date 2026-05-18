from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_ENV: str = "development"
    ENABLE_DEMO_SEED: bool = False
    DATABASE_URL: Optional[str] = None  # Optional; app can boot without a database
    HELA_RPC_URL: Optional[str] = None
    CONTRACT_ADDRESS: Optional[str] = None
    TAX_VAULT_ADDRESS: Optional[str] = None
    TAX_RATE: int = 10
    SECRET_KEY: str = "CHANGE-ME-IN-PRODUCTION"  # Override in Vercel env vars!
    ALLOWED_ORIGINS: Optional[str] = None  # Comma-separated list, or leave blank for "*"
    FIREBASE_SERVICE_ACCOUNT_JSON: Optional[str] = None  # JSON string or base64 JSON service account
    FIREBASE_SERVICE_ACCOUNT_PATH: Optional[str] = None  # Path to downloaded service account .json (local dev)
    FIREBASE_PROJECT_ID: Optional[str] = None

settings = Settings()
