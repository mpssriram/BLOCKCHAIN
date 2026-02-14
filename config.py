from pydantic_settings import BaseSettings
from pydantic import Field
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")

    DATABASE_URL: str
    HELA_RPC_URL: str
    CONTRACT_ADDRESS: str
    TAX_RATE: int = 10

settings = Settings()
