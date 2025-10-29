#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo ">>> Running database migrations..."
python3 triplog_backend/manage.py migrate

echo ">>> Migrations complete."