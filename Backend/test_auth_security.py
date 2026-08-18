"""Regression checks for authentication, approval, and portal access controls."""

from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


BACKEND = Path(__file__).resolve().parent
TEMP_DIR = tempfile.TemporaryDirectory()
os.environ.update(
    {
        "APP_ENV": "development",
        "ENABLE_DEMO_SEED": "false",
        "DATABASE_URL": f"sqlite:///{Path(TEMP_DIR.name, 'auth-security.db').as_posix()}",
        "SECRET_KEY": "test-secret-key-that-is-longer-than-thirty-two-characters",
        "SMTP_SERVER": "smtp.example.test",
        "SMTP_USERNAME": "test@example.test",
        "SMTP_PASSWORD": "not-a-real-password",
    }
)
sys.path.insert(0, str(BACKEND))

import auth  # noqa: E402
from database import db  # noqa: E402
from main import app  # noqa: E402
from models import AccessRequest, Employee, PortalHandoff, User  # noqa: E402
from security import SecurityService  # noqa: E402


class AuthSecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi.testclient import TestClient

        cls.client_context = TestClient(app)
        cls.client = cls.client_context.__enter__()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.client_context.__exit__(None, None, None)
        db.engine.dispose()
        TEMP_DIR.cleanup()

    def setUp(self) -> None:
        session = db.SessionLocal()
        try:
            session.query(PortalHandoff).delete()
            session.query(AccessRequest).delete()
            session.query(Employee).delete()
            session.query(User).delete()
            session.add_all(
                [
                    User(email="admin@test.local", hashed_password=SecurityService.hash_password("admin-password"), role="admin"),
                    User(email="employer@test.local", hashed_password=SecurityService.hash_password("employer-password"), role="employer"),
                    User(email="employee@test.local", hashed_password=SecurityService.hash_password("employee-password"), role="employee"),
                    Employee(name="Employee", email="employee@test.local", role="Employee", is_active=True),
                ]
            )
            session.commit()
        finally:
            session.close()

    def token_for(self, email: str, password: str) -> str:
        role_hint = "employee" if email.startswith(("employee", "new.employee")) else "employer"
        response = self.client.post("/api/login", data={"username": email, "password": password, "role_hint": role_hint})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["access_token"]

    def headers_for(self, email: str, password: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token_for(email, password)}"}

    def test_employer_cannot_create_users_and_admin_cannot_create_admin_via_api(self) -> None:
        employer_headers = self.headers_for("employer@test.local", "employer-password")
        response = self.client.post(
            "/api/register",
            headers=employer_headers,
            json={"email": "new@test.local", "password": "new-password", "role": "employee"},
        )
        self.assertEqual(response.status_code, 403)

        admin_headers = self.headers_for("admin@test.local", "admin-password")
        response = self.client.post(
            "/api/register",
            headers=admin_headers,
            json={"email": "forbidden@test.local", "password": "new-password", "role": "admin"},
        )
        self.assertEqual(response.status_code, 422)

    def test_employee_cannot_mutate_payroll_intents(self) -> None:
        employee_headers = self.headers_for("employee@test.local", "employee-password")
        response = self.client.post(
            "/api/payroll/intents",
            headers=employee_headers,
            json={"idempotency_key": "employee-should-not-create", "intent_type": "withdraw"},
        )
        self.assertEqual(response.status_code, 403)

    def test_handoff_is_one_time_and_deactivation_revokes_access(self) -> None:
        employee_headers = self.headers_for("employee@test.local", "employee-password")
        handoff = self.client.post("/api/portal-handoff", headers=employee_headers)
        self.assertEqual(handoff.status_code, 200, handoff.text)

        exchange = self.client.post("/api/portal-handoff/exchange", json={"code": handoff.json()["code"]})
        self.assertEqual(exchange.status_code, 200, exchange.text)
        replay = self.client.post("/api/portal-handoff/exchange", json={"code": handoff.json()["code"]})
        self.assertEqual(replay.status_code, 401)

        employer_headers = self.headers_for("employer@test.local", "employer-password")
        employee_id = self._employee_id("employee@test.local")
        deactivate = self.client.patch(f"/api/employees/{employee_id}/deactivate", headers=employer_headers)
        self.assertEqual(deactivate.status_code, 200, deactivate.text)
        self.assertEqual(self.client.get("/api/me/profile", headers=employee_headers).status_code, 401)
        self.assertEqual(
            self.client.post("/api/login", data={"username": "employee@test.local", "password": "employee-password"}).status_code,
            403,
        )

    @patch.object(auth.EmailNotifier, "send", return_value=None)
    def test_approved_request_creates_a_working_employee_profile(self, _send_email) -> None:
        request_response = self.client.post(
            "/api/login",
            data={"username": "new.employee@test.local", "password": "new-employee-password", "role_hint": "employee"},
        )
        self.assertEqual(request_response.status_code, 403)

        employer_headers = self.headers_for("employer@test.local", "employer-password")
        requests = self.client.get("/api/access-requests", headers=employer_headers)
        self.assertEqual(requests.status_code, 200, requests.text)
        approve = self.client.post(f"/api/access-requests/{requests.json()[0]['id']}/approve", headers=employer_headers)
        self.assertEqual(approve.status_code, 200, approve.text)

        employee_headers = self.headers_for("new.employee@test.local", "new-employee-password")
        profile = self.client.get("/api/me/profile", headers=employee_headers)
        self.assertEqual(profile.status_code, 200, profile.text)
        self.assertIsNotNone(profile.json()["employee"])

    @staticmethod
    def _employee_id(email: str) -> int:
        session = db.SessionLocal()
        try:
            employee = session.query(Employee).filter(Employee.email == email).first()
            assert employee is not None
            return employee.id
        finally:
            session.close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
