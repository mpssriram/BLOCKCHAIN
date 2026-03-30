"""
Start the backend and both frontend dev servers together.

Usage:
    python dev_all.py
"""
import os
import signal
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "Backend"
FRONTPAGE = ROOT / "frontpage"
EMPLOYEE = ROOT / "Frontendemployee"


def windows_cmd(command: str) -> list[str]:
    if sys.platform == "win32":
        return ["cmd", "/c", command]
    return ["bash", "-lc", command]


def npm_command(script: str) -> str:
    return f"npm.cmd run {script}" if sys.platform == "win32" else f"npm run {script}"


def pip_command() -> str:
    if sys.platform == "win32":
        return str(BACKEND / "venv" / "Scripts" / "pip.exe")
    return str(BACKEND / "venv" / "bin" / "pip")


def python_command() -> str:
    if sys.platform == "win32":
        return str(BACKEND / "venv" / "Scripts" / "python.exe")
    return str(BACKEND / "venv" / "bin" / "python")


def run_setup() -> None:
    venv_python = Path(python_command())
    if not venv_python.exists():
        print("[setup] Creating Backend virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], cwd=BACKEND, check=True)

    env_file = BACKEND / ".env"
    if not env_file.exists():
        print("[setup] Creating Backend/.env with local SQLite defaults...")
        env_file.write_text(
            "\n".join(
                [
                    "DATABASE_URL=sqlite:///./blockchain.db",
                    "SECRET_KEY=local-dev-secret",
                    "ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174",
                ]
            )
            + "\n",
            encoding="utf-8",
        )

    print("[setup] Installing backend dependencies...")
    subprocess.run([pip_command(), "install", "-r", "requirements.txt"], cwd=BACKEND, check=True)


def start_processes() -> list[subprocess.Popen]:
    processes = [
        subprocess.Popen(
            [python_command(), "-m", "uvicorn", "main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"],
            cwd=BACKEND,
        ),
        subprocess.Popen(windows_cmd(npm_command("dev")), cwd=FRONTPAGE),
        subprocess.Popen(windows_cmd(npm_command("dev")), cwd=EMPLOYEE),
    ]
    return processes


def stop_processes(processes: list[subprocess.Popen]) -> None:
    for process in processes:
        if process.poll() is None:
            process.terminate()
    for process in processes:
        if process.poll() is None:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()


def main() -> int:
    print("=" * 60)
    print("Core Payroll Dev Launcher")
    print("=" * 60)
    print("Backend:           http://127.0.0.1:8000")
    print("Employer frontend: http://localhost:5173")
    print("Employee frontend: http://localhost:5174")
    print("=" * 60)

    run_setup()
    processes = start_processes()

    def handle_exit(*_args):
        stop_processes(processes)
        raise SystemExit(0)

    signal.signal(signal.SIGINT, handle_exit)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, handle_exit)

    try:
        while True:
            for process in processes:
                if process.poll() is not None:
                    print(f"A process exited with code {process.returncode}. Stopping all services.")
                    stop_processes(processes)
                    return process.returncode or 0
            signal.pause() if hasattr(signal, "pause") else __import__("time").sleep(1)
    except KeyboardInterrupt:
        stop_processes(processes)
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
