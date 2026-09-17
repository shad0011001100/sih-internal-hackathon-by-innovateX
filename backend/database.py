import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Absolute path to backend/sanjha.db
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SQLITE_PATH = os.path.join(BACKEND_DIR, "sanjha.db")
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH.replace(os.sep, '/')}")

from sqlalchemy import event

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {
        "check_same_thread": False,
        "timeout": 30.0  # Allow 30s for lock clearance
    }
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.execute("PRAGMA cache_size=-64000")
        # Ensure high-frequency query indexes exist for sub-millisecond lookups
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_citizen_id ON reports(citizen_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_assigned_uni ON reports(assigned_university_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_eligible ON reports(is_student_eligible)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_projects_report_id ON projects(report_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_funding_offers_user ON funding_offers(industry_user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_funding_offers_project ON funding_offers(project_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_funding_offers_report ON funding_offers(report_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id)")
        cursor.close()
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
