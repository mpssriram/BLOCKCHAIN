"""Create the first PayStream administrator for a new production database."""

from __future__ import annotations

import argparse
import getpass
import sys

from database import db
from models import User
from security import SecurityService


def main() -> int:
    parser = argparse.ArgumentParser(description="Create the first PayStream administrator")
    parser.add_argument("email", help="Administrator email address")
    parser.add_argument("--password", help="Administrator password; omit to enter it securely")
    args = parser.parse_args()

    if not db.is_configured:
        parser.error("DATABASE_URL must be configured")

    password = args.password or getpass.getpass("Administrator password: ")
    if len(password) < 8:
        parser.error("Password must be at least 8 characters")

    db.create_tables()
    session = db.SessionLocal()
    try:
        if session.query(User).filter(User.role == "admin").first():
            parser.error("An administrator already exists; use the protected API to provision users")
        if session.query(User).filter(User.email == args.email).first():
            parser.error("That email address is already registered")

        session.add(
            User(
                email=args.email.strip().lower(),
                hashed_password=SecurityService.hash_password(password),
                role="admin",
            )
        )
        session.commit()
    finally:
        session.close()

    print(f"Created first administrator: {args.email}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
