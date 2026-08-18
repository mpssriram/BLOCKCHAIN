"""Interactive local configuration for the PayStream backend and React frontends."""

from __future__ import annotations

import argparse
import secrets
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND_ENV = ROOT / "Backend" / ".env"
FRONTEND_ENV = ROOT / ".env"


def ask(label: str, default: str = "", *, secret_value: bool = False) -> str:
    hint = " [press Enter to generate]" if secret_value and not default else f" [{default}]" if default else ""
    value = input(f"{label}{hint}: ").strip()
    if value:
        return value
    if secret_value:
        return secrets.token_urlsafe(48)
    return default


def as_bool(value: str) -> str:
    return "true" if value.strip().lower() in {"1", "true", "yes", "y"} else "false"


def write_env(path: Path, values: list[tuple[str, str]], overwrite: bool) -> None:
    if path.exists() and not overwrite:
        raise FileExistsError(f"{path} already exists. Re-run with --overwrite to replace it.")
    path.write_text("\n".join(f"{key}={value}" for key, value in values) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Create PayStream local configuration files")
    parser.add_argument("--overwrite", action="store_true", help="replace existing .env files")
    args = parser.parse_args()

    existing_files = [path for path in (BACKEND_ENV, FRONTEND_ENV) if path.exists()]
    if existing_files and not args.overwrite:
        parser.error(
            "Configuration already exists: "
            + ", ".join(str(path.relative_to(ROOT)) for path in existing_files)
            + ". Re-run with --overwrite to replace it."
        )

    print("PayStream local configuration")
    print("This creates Backend/.env and the shared root .env used by both React frontends.\n")

    database_url = ask("Database URL", "sqlite:///./blockchain.db")
    secret_key = ask("Backend secret key", secret_value=True)
    demo_seed = as_bool(ask("Seed local demo accounts? (yes/no)", "yes"))
    frontend_url = ask("Employer frontend URL", "http://127.0.0.1:5173")
    employee_portal_url = ask("Employee portal URL", "http://127.0.0.1:5174/employee/")
    allowed_origins = ask("Allowed origins", f"{frontend_url},http://127.0.0.1:5174")
    api_base = ask("Frontend API base (blank uses local Vite proxy)", "")

    print("\nFirebase Google sign-in is optional. Leave each value blank to keep it hidden.")
    firebase_api_key = ask("Firebase API key")
    firebase_auth_domain = ask("Firebase auth domain")
    firebase_project_id = ask("Firebase project ID")
    firebase_storage_bucket = ask("Firebase storage bucket")
    firebase_sender_id = ask("Firebase messaging sender ID")
    firebase_app_id = ask("Firebase app ID")

    backend_values = [
        ("APP_ENV", "development"),
        ("DATABASE_URL", database_url),
        ("SECRET_KEY", secret_key),
        ("ALLOWED_ORIGINS", allowed_origins),
        ("FRONTEND_URL", frontend_url),
        ("ENABLE_DEMO_SEED", demo_seed),
        ("SMTP_SERVER", ""),
        ("SMTP_PORT", "587"),
        ("SMTP_USERNAME", ""),
        ("SMTP_PASSWORD", ""),
    ]
    frontend_values = [
        ("VITE_API_BASE", api_base),
        ("VITE_EMPLOYEE_PORTAL_URL", employee_portal_url),
        ("VITE_EMPLOYEE_LOGIN_URL", f"{frontend_url}/employee-login"),
        ("VITE_ENABLE_DEMO_LOGIN", "false"),
        ("VITE_FIREBASE_API_KEY", firebase_api_key),
        ("VITE_FIREBASE_AUTH_DOMAIN", firebase_auth_domain),
        ("VITE_FIREBASE_PROJECT_ID", firebase_project_id),
        ("VITE_FIREBASE_STORAGE_BUCKET", firebase_storage_bucket),
        ("VITE_FIREBASE_MESSAGING_SENDER_ID", firebase_sender_id),
        ("VITE_FIREBASE_APP_ID", firebase_app_id),
    ]

    write_env(BACKEND_ENV, backend_values, args.overwrite)
    write_env(FRONTEND_ENV, frontend_values, args.overwrite)
    print(f"\nCreated {BACKEND_ENV.relative_to(ROOT)} and {FRONTEND_ENV.relative_to(ROOT)}.")
    print("Restart the backend and both Vite apps after changing configuration.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
