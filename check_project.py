"""
Run the repository verification checks for PayStream.

Checks:
- Backend Python compile check (excluding Backend/venv)
- Backend authentication regression checks
- Entry frontend production build
- Employee frontend production build

Usage:
    python check_project.py
"""
from __future__ import annotations

import os
import py_compile
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "Backend"
FRONTPAGE = ROOT / "frontpage"
EMPLOYEE = ROOT / "Frontendemployee"
BACKEND_VENV = BACKEND / "venv"


def _print_step(message: str) -> None:
    print(f"[check] {message}")


def run_backend_compile_check() -> None:
    _print_step("Compiling backend Python files")
    failures: list[str] = []

    for path in BACKEND.rglob("*.py"):
        if BACKEND_VENV in path.parents:
            continue
        try:
            py_compile.compile(str(path), doraise=True)
        except py_compile.PyCompileError as exc:
            failures.append(f"{path}: {exc.msg}")

    if failures:
        print("\n".join(failures))
        raise SystemExit(1)


def run_command(command: list[str], cwd: Path, label: str) -> None:
    _print_step(label)
    completed = subprocess.run(command, cwd=cwd)
    if completed.returncode != 0:
        raise SystemExit(completed.returncode)


def npm_run_build(cwd: Path) -> None:
    if sys.platform == "win32":
        command = ["cmd", "/c", "npm.cmd", "run", "build"]
    else:
        command = ["npm", "run", "build"]
    run_command(command, cwd, f"Building {cwd.name}")


def run_backend_tests() -> None:
    python = BACKEND / "venv" / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
    command = [str(python) if python.exists() else sys.executable, "test_auth_security.py"]
    run_command(command, BACKEND, "Running backend authentication regression checks")


def main() -> int:
    run_backend_compile_check()
    run_backend_tests()
    npm_run_build(FRONTPAGE)
    npm_run_build(EMPLOYEE)
    _print_step("All checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
