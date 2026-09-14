"""
Jharkhand Institutional and CSR Seed Script for SocioSolve
Populates:
- Top Jharkhand Universities (BIT Mesra, NIT Jamshedpur, IIT ISM Dhanbad, IIIT Ranchi, Ranchi University)
- Premier CSR Industry Partners (Tata Steel Foundation, CCL Ranchi, SAIL Bokaro, Jindal Steel & Power)
- Official, Industry, University, and Student demo accounts
- Active student capstone projects with technical solutions
"""
import sqlite3
import os
import hashlib

DB_PATH = os.path.join(os.path.dirname(__file__), "sanjha.db")

def seed():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    demo_pw_hash = hashlib.sha256("sanjha@2025".encode()).hexdigest()
    student_pw_hash = hashlib.sha256("mypassword123".encode()).hexdigest()

    # 1. Seed / Update Core Users
    users_to_seed = [
        # (employee_id, apaar_id, email, password_hash, role, name)
        ("GOV-001", None, "nodal.rmc@jharkhand.gov.in", demo_pw_hash, "official", "Shri Rajesh Verma (IAS, Municipal Commissioner)"),
        ("GOV-002", None, "zonal.engg@jharkhand.gov.in", demo_pw_hash, "official", "Er. Priya Soren (Zonal Executive Engineer)"),
        ("IND-001", None, "csr.lead@tatasteel.com", demo_pw_hash, "industry", "Tata Steel Foundation (Jamshedpur)"),
        ("IND-002", None, "csr@centralcoalfields.in", demo_pw_hash, "industry", "Central Coalfields Limited (CCL Ranchi)"),
        ("IND-003", None, "csr@sailbokaro.in", demo_pw_hash, "industry", "SAIL Bokaro Steel Plant"),
        ("IND-004", None, "csr@jspl.com", demo_pw_hash, "industry", "Jindal Steel & Power (JSPL)"),
        (None, None, "admin@bitmesra.ac.in", demo_pw_hash, "university", "BIT Mesra (Birla Institute of Technology)"),
        (None, None, "director@nitjsr.ac.in", demo_pw_hash, "university", "NIT Jamshedpur"),
        (None, None, "dean.rnd@iitism.ac.in", demo_pw_hash, "university", "IIT (ISM) Dhanbad"),
        (None, None, "incubator@iiitranchi.ac.in", demo_pw_hash, "university", "IIIT Ranchi"),
        (None, None, "vc@ranchiuniversity.ac.in", demo_pw_hash, "university", "Ranchi University"),
        (None, "APAAR-12345", "aravind.kumar@student.bitmesra.ac.in", student_pw_hash, "student", "Aravind Kumar (Lead Innovator)"),
        (None, "APAAR-67890", "sneha.topno@student.bitmesra.ac.in", student_pw_hash, "student", "Sneha Topno (IoT Developer)"),
        (None, "APAAR-11223", "rohit.singh@student.nitjsr.ac.in", student_pw_hash, "student", "Rohit Singh (GIS Specialist)"),
    ]

    for emp_id, apaar_id, email, pwh, role, name in users_to_seed:
        # Check if already exists
        if emp_id:
            cur.execute("SELECT id FROM users WHERE employee_id = ?", (emp_id,))
        elif apaar_id:
            cur.execute("SELECT id FROM users WHERE apaar_id = ?", (apaar_id,))
        elif email:
            cur.execute("SELECT id FROM users WHERE email = ?", (email,))
        else:
            continue

        existing = cur.fetchone()
        if existing:
            cur.execute("""
                UPDATE users SET password_hash = ?, role = ?, name = ?, is_active = 1
                WHERE id = ?
            """, (pwh, role, name, existing[0]))
        else:
            cur.execute("""
                INSERT INTO users (employee_id, apaar_id, email, password_hash, role, name, is_active, trust_score)
                VALUES (?, ?, ?, ?, ?, ?, 1, 1.0)
            """, (emp_id, apaar_id, email, pwh, role, name))

    conn.commit()

    # 2. Get User IDs for Profiles
    def get_uid_by_email(email):
        cur.execute("SELECT id FROM users WHERE email = ?", (email,))
        r = cur.fetchone()
        return r[0] if r else None

    def get_uid_by_empid(emp_id):
        cur.execute("SELECT id FROM users WHERE employee_id = ?", (emp_id,))
        r = cur.fetchone()
        return r[0] if r else None

    # 3. Seed Universities
    universities_data = [
        ("BIT Mesra", "Department of Computer Science & Rural Tech", "admin@bitmesra.ac.in", 95.5, '["IoT Sensors", "Rural Water Telemetry", "AI Vision", "GIS"]'),
        ("NIT Jamshedpur", "Department of Civil & Environmental Engineering", "director@nitjsr.ac.in", 92.0, '["Structural Analysis", "Smart Drainage", "Pavement Design"]'),
        ("IIT (ISM) Dhanbad", "Department of Environmental Science & Mining", "dean.rnd@iitism.ac.in", 94.0, '["Groundwater Geochemistry", "Solar Energy", "Air Quality Telemetry"]'),
        ("IIIT Ranchi", "Department of Embedded Systems & Data Science", "incubator@iiitranchi.ac.in", 89.5, '["Edge Computing", "Civic Data Dashboard", "Wireless Sensor Networks"]'),
        ("Ranchi University", "Department of Rural Development & Tribal Studies", "vc@ranchiuniversity.ac.in", 86.0, '["Community Resource Mapping", "Water Testing", "Participatory Governance"]'),
    ]

    for name, dept, email, score, specs in universities_data:
        uid = get_uid_by_email(email)
        cur.execute("SELECT id FROM universities WHERE name = ?", (name,))
        existing_uni = cur.fetchone()
        if existing_uni:
            cur.execute("""
                UPDATE universities 
                SET department = ?, user_id = ?, ranking_score = ?, specializations = ?
                WHERE id = ?
            """, (dept, uid, score, specs, existing_uni[0]))
        else:
            cur.execute("""
                INSERT INTO universities (name, department, user_id, ranking_score, specializations)
                VALUES (?, ?, ?, ?, ?)
            """, (name, dept, uid, score, specs))

    # 4. Seed Industry Profiles
    industry_data = [
        ("IND-001", "Tata Steel Foundation", "Manufacturing & Metallurgy", 2500000.0, 1450000.0, 6, 0.92),
        ("IND-002", "Central Coalfields Limited (CCL)", "Energy & Mining", 1800000.0, 850000.0, 4, 0.88),
        ("IND-003", "SAIL Bokaro Steel Plant", "Heavy Engineering", 1500000.0, 600000.0, 3, 0.85),
        ("IND-004", "Jindal Steel & Power (JSPL)", "Infrastructure & Steel", 1000000.0, 450000.0, 2, 0.82),
    ]

    for emp_id, cname, sector, budget, invested, funded_count, rate in industry_data:
        uid = get_uid_by_empid(emp_id)
        if uid:
            cur.execute("SELECT id FROM industry_profiles WHERE user_id = ?", (uid,))
            existing_ind = cur.fetchone()
            if existing_ind:
                cur.execute("""
                    UPDATE industry_profiles
                    SET company_name = ?, sector = ?, csr_budget = ?, total_invested = ?, issues_funded = ?, success_rate = ?
                    WHERE id = ?
                """, (cname, sector, budget, invested, funded_count, rate, existing_ind[0]))
            else:
                cur.execute("""
                    INSERT INTO industry_profiles (user_id, company_name, sector, csr_budget, total_invested, issues_funded, success_rate)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (uid, cname, sector, budget, invested, funded_count, rate))

    # 5. Seed Student Skills for Aravind Kumar
    aravind_uid = None
    cur.execute("SELECT id FROM users WHERE apaar_id = 'APAAR-12345'")
    row = cur.fetchone()
    if row:
        aravind_uid = row[0]
        cur.execute("DELETE FROM skill_profiles WHERE user_id = ?", (aravind_uid,))
        student_skills = [
            ("IoT Telemetry & Microcontrollers", "Advanced", 3, 4, 0),
            ("GIS & Ward Spatial Analysis", "Intermediate", 2, 2, 0),
            ("React & Vite Frontend Engineering", "Expert", 4, 5, 0),
            ("Clean Water Filtration Systems", "Intermediate", 1, 2, 0),
            ("Community Field Research", "Advanced", 3, 3, 1),
        ]
        for sname, level, demo_p, chals, soft in student_skills:
            cur.execute("""
                INSERT INTO skill_profiles (user_id, skill_name, proficiency_level, projects_demonstrated, challenges_participated, is_soft_skill)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (aravind_uid, sname, level, demo_p, chals, soft))

    # 6. Ensure Realistic Reports exist with tech suitability
    cur.execute("SELECT COUNT(*) FROM reports WHERE status IN ('reported', 'validated', 'assigned')")
    cnt = cur.fetchone()[0]
    if cnt < 5:
        sample_reports = [
            (
                "Water Supply",
                "Community drinking water borehole in Ward 4 (Doranda) experiencing periodic bacterial contamination. Needs real-time turbidity & TDS sensors with automated chlorine dosing.",
                23.3297, 85.3262, "validated", 0.1, 0.95,
                "Bacterial contamination in Doranda borehole requires automated water quality telemetry and filtration.",
                '["IoT Turbidity Sensors", "Microcontroller Dosing", "Telemetry Dashboard"]',
                '["Civil & Environmental", "Computer Science"]',
                1, "Civil & Environmental"
            ),
            (
                "Street Lighting",
                "Streetlights on 2.4 km stretch along Ring Road (Ward 7) frequently fail due to grid voltage surges. Need smart solar-hybrid LED controller with mesh status reporting.",
                23.3645, 85.3340, "validated", 0.05, 0.88,
                "Frequent dark stretches along Ring Road need IoT mesh-monitored solar-hybrid LED streetlighting controllers.",
                '["Solar Hybrid Inverter", "LoRaWAN Mesh", "Power Analytics"]',
                '["Electrical & Electronics", "Embedded Systems"]',
                2, "Electrical & Electronics"
            ),
            (
                "Infrastructure",
                "Solid waste accumulation blocking monsoon stormwater drainage channel near Namkum Industrial Area. Early flood warning gauge needed.",
                23.3411, 85.3812, "reported", 0.08, 0.90,
                "Industrial drainage channel choke causes monsoon waterlogging; ultrasonic depth sensor network required.",
                '["Ultrasonic Water Level Gauge", "SMS Early Warning", "GIS Mapping"]',
                '["Computer Science", "Civil Engineering"]',
                None, None
            )
        ]
        for cat, desc, lat, lon, stat, spam, prio, summ, tech, dept, uni_id, uni_dept in sample_reports:
            cur.execute("""
                INSERT INTO reports (category, description, gps_lat, gps_lon, status, ai_spam_score, priority_score, challenge_summary, suggested_technologies, relevant_departments, assigned_university_id, assigned_department)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (cat, desc, lat, lon, stat, spam, prio, summ, tech, dept, uni_id, uni_dept))

    conn.commit()
    conn.close()
    print("Jharkhand Institutional and CSR Seed Completed Successfully!")

if __name__ == "__main__":
    seed()
