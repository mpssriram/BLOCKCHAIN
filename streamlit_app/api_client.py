"""Small authenticated client for the existing FastAPI payroll API."""

from __future__ import annotations

from typing import Any

import requests


class BackendApiError(RuntimeError):
    """An API response that cannot be used by the Streamlit interface."""


class PayrollApi:
    def __init__(self, base_url: str, token: str | None = None) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.session = requests.Session()

    def login(self, email: str, password: str) -> dict[str, Any]:
        return self._request("POST", "/api/login", data={"username": email, "password": password})

    def get(self, path: str, *, params: dict[str, Any] | None = None) -> Any:
        return self._request("GET", path, params=params)

    def post(self, path: str, *, payload: dict[str, Any] | None = None) -> Any:
        return self._request("POST", path, json=payload)

    def put(self, path: str, *, payload: dict[str, Any] | None = None) -> Any:
        return self._request("PUT", path, json=payload)

    def patch(self, path: str, *, payload: dict[str, Any] | None = None) -> Any:
        return self._request("PATCH", path, json=payload)

    def delete(self, path: str) -> Any:
        return self._request("DELETE", path)

    def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        headers = kwargs.pop("headers", {})
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        try:
            response = self.session.request(
                method,
                f"{self.base_url}{path}",
                headers=headers,
                timeout=15,
                **kwargs,
            )
        except requests.RequestException as exc:
            raise BackendApiError(
                f"Could not reach the backend at {self.base_url}. Start FastAPI or check the API URL."
            ) from exc

        if not response.ok:
            message = response.text
            try:
                detail = response.json().get("detail")
                if detail:
                    message = str(detail)
            except ValueError:
                pass
            raise BackendApiError(f"{response.status_code}: {message}")

        if not response.content:
            return None
        try:
            return response.json()
        except ValueError:
            return response.text
