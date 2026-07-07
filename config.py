import os
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))  

DATA_DIR = os.path.join(BASE_DIR, "data")
LOG_DIR = os.path.join(BASE_DIR, "logs")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)


class Config:
    SECRET_KEY = os.environ.get("POC_SECRET_KEY", "change-this-secret-in-production")
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(DATA_DIR, 'poc.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    CONTROL_PIN = os.environ.get("POC_CONTROL_PIN", "1234")

    HOST = "0.0.0.0"
    PORT = 5000

    PROJECTS_ROOT = os.environ.get("POC_PROJECTS_ROOT", os.path.join(BASE_DIR, "projects"))

    FILE_MANAGER_ROOT = os.environ.get("POC_FM_ROOT", os.path.expanduser("~"))

    DEFAULT_REFRESH_RATE_MS = 2000
