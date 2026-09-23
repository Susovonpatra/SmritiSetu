import os
from dotenv import load_dotenv
from pydantic import BaseModel

# Load variables from .env file if present
load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "SmritiSetu"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database URL:
    # If DATABASE_URL is set in .env (e.g. postgresql://user:password@localhost:5432/smritisetu),
    # it uses PostgreSQL. Otherwise, falls back to SQLite.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smritisetu.db")
    
    # CORS Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    
    # Bhashini / IndicTTS config
    BHASHINI_API_KEY: str = os.getenv("BHASHINI_API_KEY", "")
    BHASHINI_USER_ID: str = os.getenv("BHASHINI_USER_ID", "")
    BHASHINI_INFERENCE_URL: str = os.getenv("BHASHINI_INFERENCE_URL", "https://dhruva-api.bhashini.gov.in/services/inference/pipeline")

settings = Settings()
