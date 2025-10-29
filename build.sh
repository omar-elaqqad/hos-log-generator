#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Running migrations..."
(cd triplog_backend && python3 manage.py migrate)

echo "Starting Gunicorn..."

exec gunicorn triplog_backend.wsgi --chdir triplog_backend