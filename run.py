"""
Run backend + frontends with a single command.
Builds both frontends, then starts the FastAPI server.
"""
import subprocess
import sys
import os

ROOT = os.path.dirname(os.path.abspath(__file__))

def run(cmd, cwd=None):
    cwd = cwd or ROOT
    print(f"\n>>> {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd)
    if result.returncode != 0:
        print(f"Command failed with exit code {result.returncode}")
        sys.exit(result.returncode)

def main():
    print("=" * 50)
    print("Building frontends...")
    print("=" * 50)

    # Build frontpage
    frontpage = os.path.join(ROOT, "frontpage")
    if os.path.exists(os.path.join(frontpage, "package.json")):
        run("npm install", frontpage)
        run("npm run build", frontpage)
    else:
        print("Skipping frontpage (no package.json)")

    # Build employee dashboard
    employee = os.path.join(ROOT, "Frontendemployee")
    if os.path.exists(os.path.join(employee, "package.json")):
        run("npm install", employee)
        run("npm run build", employee)
    else:
        print("Skipping Frontendemployee (no package.json)")

    print("\n" + "=" * 50)
    print("Open in browser: http://localhost:8000")
    print("=" * 50)

    # Start backend (127.0.0.1 = localhost, works in browser)
    backend = os.path.join(ROOT, "Backend")
    subprocess.run(
        [sys.executable, "-m", "uvicorn", "main:app", "--reload", "--host", "127.0.0.1"],
        cwd=backend
    )

if __name__ == "__main__":
    main()
