# Vercel serverless entry point for FastAPI
# Vercel looks for an ASGI app in api/index.py
from main import app  # noqa: F401 - re-exported as ASGI app
