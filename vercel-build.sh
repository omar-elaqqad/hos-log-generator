
set -e

echo ">>> Running database migrations..."
python triplog_backend/manage.py migrate

echo ">>> Migrations complete."