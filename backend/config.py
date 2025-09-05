from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# ensure .env loads (project root .env by default)
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    API_PREFIX: str = "/api"
    DEBUG: bool = False

    DATABASE_URL: str
    SECRET_KEY: str  # for JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_SECONDS: int = 3600

    WHO_CLIENT_ID: str = ""
    WHO_CLIENT_SECRET: str = ""
    WHO_API_BASE: str = "https://id.who.int/icd"

    ALLOWED_ORIGINS: str = ""

    class Config:
        env_file = str(env_path)
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
