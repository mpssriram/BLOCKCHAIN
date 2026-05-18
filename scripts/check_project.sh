#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(pwd)"
if [ ! -f "$ROOT_DIR/check_project.py" ]; then
  echo "Run this script from the repository root." >&2
  exit 1
fi

echo "[check] Compiling backend Python files"
if [ -x "/c/Users/msrir/AppData/Local/Programs/Python/Python313/python.exe" ]; then
  PYTHON_BIN='"/c/Users/msrir/AppData/Local/Programs/Python/Python313/python.exe"'
elif [ -x "/c/Users/msrir/AppData/Local/Programs/Python/Launcher/py.exe" ]; then
  PYTHON_BIN='"/c/Users/msrir/AppData/Local/Programs/Python/Launcher/py.exe" -3'
elif command -v py >/dev/null 2>&1; then
  PYTHON_BIN="py -3"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "Python was not found in PATH." >&2
  exit 1
fi

eval "$PYTHON_BIN check_project.py"
