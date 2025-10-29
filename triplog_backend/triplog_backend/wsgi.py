
import os
import sys
from pathlib import Path
from django.core.wsgi import get_wsgi_application


CURRENT_DIR = Path(__file__).resolve().parent


PROJECT_ROOT = CURRENT_DIR.parent

sys.path.insert(0, str(PROJECT_ROOT))


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'triplog_backend.settings')

application = get_wsgi_application()

app = application