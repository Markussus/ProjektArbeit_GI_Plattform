#!/usr/bin/env sh

cd "$(dirname "$0")"

echo "=========================================="
echo "  GI Training Center"
echo "=========================================="
echo
echo "Starting local web server..."
echo

if command -v python3 >/dev/null 2>&1; then
    python3 serve.py
elif command -v python >/dev/null 2>&1; then
    python serve.py
else
    echo
    echo "ERROR: Python 3 was not found."
    echo
    echo "Please install Python 3 and try again."
    exit 1
fi