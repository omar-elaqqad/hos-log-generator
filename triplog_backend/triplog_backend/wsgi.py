
import os
import sys
from pathlib import Path


CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'triplog_backend.settings')



from django.core.management import call_command
from django.core.wsgi import get_wsgi_application
import django

django.setup()

print(">>> Running database migrations on startup...")
call_command('migrate', interactive=False)
print(">>> Migrations complete.")



application = get_wsgi_application()


app = application