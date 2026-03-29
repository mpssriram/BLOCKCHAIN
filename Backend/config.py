from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_ENV: str = "development"
    ENABLE_DEMO_SEED: bool = False
    DATABASE_URL: str  # e.g. mysql+pymysql://user:pass@host/dbname
    HELA_RPC_URL: Optional[str] = None
    CONTRACT_ADDRESS: Optional[str] = None
    TAX_VAULT_ADDRESS: Optional[str] = None
    TAX_RATE: int = 10
    SECRET_KEY: str = "CHANGE-ME-IN-PRODUCTION"  # Override in Vercel env vars!
    ALLOWED_ORIGINS: Optional[str] = None  # Comma-separated list, or leave blank for "*"

settings = Settings()
