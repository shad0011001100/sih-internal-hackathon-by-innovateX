"""
SQLite Migration Script — Phase 6 Full Workflow
Drops and recreates all tables with the new schema.
Preserves existing user data where possible.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "sanjha.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # ── 1. Back up existing user data ──
    existing_users = []
    try:
        cur.execute("SELECT id, phone_number, institution_id, employee_id, password_hash, role, is_active, trust_score FROM users")
        existing_users = cur.fetchall()
        print(f"  Backed up {len(existing_users)} users")
    except Exception as e:
        print(f"  No existing users table or error: {e}")

    # ── 2. Back up existing reports ──
    existing_reports = []
    try:
        cur.execute("SELECT id, citizen_id, category, description, gps_lat, gps_lon, photo_url, is_verified, ai_spam_score, status, created_at FROM reports")
        existing_reports = cur.fetchall()
        print(f"  Backed up {len(existing_reports)} reports")
    except Exception as e:
        print(f"  No existing reports table or error: {e}")

    # ── 3. Drop all tables ──
    tables_to_drop = [
        "funding_offers", "industry_profiles", "skill_profiles",
        "team_members", "teams", "projects", "feedback",
        "reports", "universities", "users",
        "alembic_version"
    ]
    for t in tables_to_drop:
        try:
            cur.execute(f"DROP TABLE IF EXISTS {t}")
            print(f"  Dropped {t}")
        except Exception as e:
            print(f"  Error dropping {t}: {e}")

    conn.commit()

    # ── 4. Create new tables ──
    cur.executescript("""
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT UNIQUE,
        apaar_id TEXT UNIQUE,
        email TEXT UNIQUE,
        institution_id TEXT UNIQUE,
        employee_id TEXT UNIQUE,
        password_hash TEXT,
        role TEXT DEFAULT 'citizen',
        is_active BOOLEAN DEFAULT 1,
        trust_score REAL DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        name TEXT,
        linkedin_url TEXT,
        github_url TEXT
    );

    CREATE TABLE universities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        department TEXT,
        user_id INTEGER REFERENCES users(id),
        specializations TEXT,
        faculty_expertise TEXT,
        research_areas TEXT,
        facilities TEXT,
        ranking_score REAL DEFAULT 0.0
    );

    CREATE TABLE reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        citizen_id INTEGER REFERENCES users(id),
        category TEXT,
        description TEXT,
        gps_lat REAL,
        gps_lon REAL,
        photo_url TEXT,
        is_verified BOOLEAN DEFAULT 0,
        ai_spam_score REAL DEFAULT 0.0,
        status TEXT DEFAULT 'reported',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        priority_score REAL DEFAULT 0.0,
        challenge_summary TEXT,
        suggested_technologies TEXT,
        relevant_departments TEXT,
        potential_industry TEXT,
        is_duplicate BOOLEAN DEFAULT 0,
        duplicate_reason TEXT,
        assigned_university_id INTEGER REFERENCES universities(id),
        assigned_department TEXT
    );

    CREATE TABLE feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER UNIQUE REFERENCES reports(id),
        citizen_id INTEGER REFERENCES users(id),
        rating INTEGER,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        report_id INTEGER REFERENCES reports(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER REFERENCES reports(id),
        title TEXT,
        description TEXT,
        status TEXT DEFAULT 'draft',
        team_id INTEGER REFERENCES teams(id),
        mentor_name TEXT,
        deadline DATETIME,
        progress_pct REAL DEFAULT 0.0,
        documentation_url TEXT,
        prototype_url TEXT,
        impact_report TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER REFERENCES teams(id),
        user_id INTEGER REFERENCES users(id),
        role TEXT DEFAULT 'member',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE skill_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        skill_name TEXT,
        proficiency_level TEXT DEFAULT 'beginner',
        projects_demonstrated INTEGER DEFAULT 0,
        challenges_participated INTEGER DEFAULT 0,
        is_soft_skill BOOLEAN DEFAULT 0
    );

    CREATE TABLE funding_offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        industry_user_id INTEGER REFERENCES users(id),
        project_id INTEGER REFERENCES projects(id),
        report_id INTEGER REFERENCES reports(id),
        offer_type TEXT DEFAULT 'funding',
        amount REAL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE industry_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE REFERENCES users(id),
        company_name TEXT,
        sector TEXT,
        csr_budget REAL DEFAULT 0.0,
        total_invested REAL DEFAULT 0.0,
        issues_funded INTEGER DEFAULT 0,
        success_rate REAL DEFAULT 0.0
    );

    CREATE INDEX idx_users_phone ON users(phone_number);
    CREATE INDEX idx_users_apaar ON users(apaar_id);
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_employee ON users(employee_id);
    CREATE INDEX idx_reports_category ON reports(category);
    CREATE INDEX idx_reports_status ON reports(status);
    """)

    print("  All tables created successfully!")

    # ── 5. Restore users ──
    status_map = {
        "pending": "reported",
        "verified": "validated",
        "wip": "in_progress",
        "resolved": "implemented",
    }

    for u in existing_users:
        uid, phone, inst_id, emp_id, pw_hash, role, is_active, trust = u
        try:
            cur.execute("""
                INSERT INTO users (id, phone_number, institution_id, employee_id, password_hash, role, is_active, trust_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (uid, phone, inst_id, emp_id, pw_hash, role, is_active, trust))
        except Exception as e:
            print(f"  Warning restoring user {uid}: {e}")

    # ── 6. Restore reports with status mapping ──
    for r in existing_reports:
        rid, cid, cat, desc, lat, lon, photo, verified, spam, status, created = r
        new_status = status_map.get(status, status)
        try:
            cur.execute("""
                INSERT INTO reports (id, citizen_id, category, description, gps_lat, gps_lon, photo_url, is_verified, ai_spam_score, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (rid, cid, cat, desc, lat, lon, photo, verified, spam, new_status, created))
        except Exception as e:
            print(f"  Warning restoring report {rid}: {e}")

    conn.commit()
    print(f"  Restored {len(existing_users)} users and {len(existing_reports)} reports")

    # ── 7. Seed test accounts ──
    import hashlib
    pw_hash = hashlib.sha256("sanjha@2025".encode()).hexdigest()

    seeds = [
        ("GOV-001", pw_hash, "official", "Govt Officer Demo"),
        ("IND-001", pw_hash, "industry", "Industry Partner Demo"),
    ]
    for emp_id, ph, role, name in seeds:
        try:
            cur.execute("""
                INSERT OR IGNORE INTO users (employee_id, password_hash, role, name)
                VALUES (?, ?, ?, ?)
            """, (emp_id, ph, role, name))
        except:
            pass

    # Seed industry profile for IND-001
    try:
        cur.execute("SELECT id FROM users WHERE employee_id='IND-001'")
        ind_user = cur.fetchone()
        if ind_user:
            cur.execute("""
                INSERT OR IGNORE INTO industry_profiles (user_id, company_name, sector, csr_budget, total_invested, issues_funded, success_rate)
                VALUES (?, 'Tata Steel', 'Manufacturing & Steel', 500000.0, 240000.0, 3, 0.78)
            """, (ind_user[0],))
    except:
        pass

    # Seed a university profile
    try:
        cur.execute("""
            INSERT OR IGNORE INTO universities (name, department, specializations, ranking_score)
            VALUES ('BIT Mesra', 'Computer Science & Engineering', '["Computer Science", "Civil Engineering", "Environmental Science", "IoT"]', 94.0)
        """)
    except:
        pass

    conn.commit()
    conn.close()
    print("\n[OK] Migration complete!")


if __name__ == "__main__":
    print(f"Migrating database: {DB_PATH}")
    migrate()
