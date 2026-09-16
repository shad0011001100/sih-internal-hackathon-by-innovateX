"""
SocioSolve Comprehensive Database Seeder
Seeds Jharkhand Universities, Faculty Mentors, Civic Reports, Projects, CSR Offers, and Feedback.
"""
import sqlite3
import json

def seed_database():
    conn = sqlite3.connect('backend/sanjha.db')
    c = conn.cursor()

    # 1. Update Universities with Faculty Expertise & Labs
    universities_data = [
        (
            1, 
            'BIT Mesra', 
            'Department of Computer Science & Rural Technology',
            json.dumps(["Water Filtration & IoT", "Rural Solar Microgrids", "Civic Data Systems"]),
            json.dumps([
                {"name": "Dr. R. K. Sen", "role": "Professor & Head", "lab": "Water Quality & Environmental IoT Lab", "specialization": "Clean Water Filtration & Telemetry"},
                {"name": "Dr. Amit Kumar", "role": "Associate Professor", "lab": "Civic AI & GIS Systems", "specialization": "Pothole Detection & Spatial Mapping"}
            ]),
            json.dumps(["Groundwater Fluoride Removal", "Decentralized Sanitation"]),
            95.5
        ),
        (
            2, 
            'NIT Jamshedpur', 
            'Department of Civil & Environmental Engineering',
            json.dumps(["Sustainable Road Pavements", "Stormwater Drainage", "Smart City Infrastructure"]),
            json.dumps([
                {"name": "Prof. S. Banerjee", "role": "Senior Professor", "lab": "Transportation & Asphalt Lab", "specialization": "Plastic Waste Modified Asphalt Roads"},
                {"name": "Dr. P. K. Singh", "role": "Assistant Professor", "lab": "Clean Energy & Grid Lab", "specialization": "Solar LED Streetlighting Microgrids"}
            ]),
            json.dumps(["Industrial Effluent Treatment", "Flood Prevention"]),
            92.0
        ),
        (
            3, 
            'IIT (ISM) Dhanbad', 
            'Department of Environmental Science & Mining Engineering',
            json.dumps(["Heavy Metal Filtration", "Mine Water Reclamation", "Air Quality Telemetry"]),
            json.dumps([
                {"name": "Dr. V. K. Saxena", "role": "Principal Investigator", "lab": "Aquifer Remediation Center", "specialization": "Arsenic & Iron Removal Systems"}
            ]),
            json.dumps(["Acid Mine Drainage Treatment", "Ambient Air Mesh"]),
            94.0
        ),
        (
            4, 
            'IIIT Ranchi', 
            'Department of Embedded Systems & Data Science',
            json.dumps(["Smart City IoT Sensors", "Computer Vision Civic Triage"]),
            json.dumps([
                {"name": "Dr. N. K. Sharma", "role": "Lead Researcher", "lab": "Smart Sensing & Automation Lab", "specialization": "Edge AI Garbage Detection & Route Optimization"}
            ]),
            json.dumps(["Automated Waste Segregation", "LoRaWAN Ward Mesh"]),
            89.5
        ),
        (
            5, 
            'Ranchi University', 
            'Department of Rural Development & Tribal Studies',
            json.dumps(["Tribal Agro-Water Systems", "Community Governance", "Public Health"]),
            json.dumps([
                {"name": "Prof. Meena Munda", "role": "Department Chair", "lab": "Indigenous Solutions Center", "specialization": "Low-cost Bamboo Charcoal Filtration"}
            ]),
            json.dumps(["Rainwater Harvesting in Chotanagpur Plateau"]),
            86.0
        )
    ]

    for uid, name, dept, specs, faculty, research, score in universities_data:
        c.execute("""
            INSERT INTO universities (id, name, department, specializations, faculty_expertise, research_areas, ranking_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                department=excluded.department,
                specializations=excluded.specializations,
                faculty_expertise=excluded.faculty_expertise,
                research_areas=excluded.research_areas,
                ranking_score=excluded.ranking_score
        """, (uid, name, dept, specs, faculty, research, score))

    # 2. Ensure Sample Reports cover the full lifecycle
    reports_sample = [
        (
            1, 8, 'Water Supply', 
            'Severe water pipeline contamination near Harmu Housing Colony. Turbid brownish water supplied for 4 days affecting 200+ households.',
            23.3512, 85.3120, 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600',
            1, 0.1, 'implemented', 0.92,
            'Harmu Colony Water Pipeline Contamination & Bacterial Hazard',
            json.dumps(["IoT Turbidity Sensors", "UV Water Purifier Unit"]),
            json.dumps(["Civil & Environmental Engineering", "Water Resources"]),
            json.dumps(["Tata Steel Foundation (Clean Water Initiative)"]),
            0, None, 1, "High capstone suitability for water engineering students",
            1, "Department of Computer Science & Rural Technology (Lead Mentor: Dr. R. K. Sen)"
        ),
        (
            2, 8, 'Street Lighting',
            'All 14 solar streetlights broken along Morabadi Oxygen Park Ring Road. Dark stretches at night pose safety hazards for female joggers and cyclists.',
            23.3850, 85.3280, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600',
            1, 0.1, 'in_progress', 0.82,
            'Morabadi Oxygen Park Solar Streetlight Circuit Failure',
            json.dumps(["Mesh Solar LED Controllers", "LiFePO4 Smart Battery Management"]),
            json.dumps(["Electrical Engineering", "Energy & Power Systems"]),
            json.dumps(["Jindal Steel & Power CSR"]),
            0, None, 1, "Ideal for student IoT and renewable energy projects",
            2, "Department of Civil & Environmental Engineering (Lead Mentor: Dr. P. K. Singh)"
        ),
        (
            3, 8, 'Roads & Sanitation',
            'Massive open drainage overflow and road subsidence at Doranda Main Road Ward 7 near High Court roundabout.',
            23.3320, 85.3210, '/assets/civic/case_road.jpg',
            1, 0.2, 'validated', 0.88,
            'Doranda Main Road Open Sewer Overflow & Road Subsidence',
            json.dumps(["Pre-cast Concrete Desiltation Channels", "Stormwater Level Monitors"]),
            json.dumps(["Civil Engineering", "Municipal Infrastructure"]),
            json.dumps(["Central Coalfields Limited (CCL CSR)"]),
            0, None, 1, "Suitable for stormwater modeling and civil analysis",
            1, "Civil Engineering"
        ),
        (
            101, 8, 'Sanitation & Solid Waste',
            'Severe garbage dumping and choked stormwater drain Ground gate 3.',
            23.3050, 85.5340, '/assets/civic/case_waste.jpg',
            1, 0.1, 'reported', 0.95,
            'Unmanaged municipal solid waste accumulation blocking water runoff channel',
            json.dumps(["Automated Trash Skimmers", "Solid Waste Segregation Sensors"]),
            json.dumps(["Environmental Engineering", "Municipal Solid Waste"]),
            json.dumps(["Tata Steel Foundation", "RMC Sanitation"]),
            0, None, 1, "Direct student capstone feasibility for waste tracking",
            1, "Department of Civil & Environmental Engineering"
        ),
        (
            102, 8, 'Water Supply & Quality',
            'Contaminated municipal tap water pipeline rupture behind Doranda Main Road Market.',
            23.3370, 85.3210, '/assets/civic/case_water.jpg',
            1, 0.1, 'validated', 0.92,
            'High-turbidity water pipeline fracture threatening contamination in dense settlement',
            json.dumps(["IoT Turbidity Sensors", "Acoustic Pipe Leak Detectors"]),
            json.dumps(["Civil & Environmental Engineering", "Water Resources"]),
            json.dumps(["Tata Steel Foundation (Clean Water Initiative)"]),
            0, None, 1, "High capstone suitability for water engineering students",
            1, "Department of Computer Science & Rural Technology (Lead Mentor: Dr. R. K. Sen)"
        ),
        (
            103, 8, 'Smart Transportation & Infrastructure',
            'Major asphalt crater and road subsidence on Harmu Bypass Road causing hazardous vehicle jams.',
            23.3510, 85.3120, '/assets/civic/case_road.jpg',
            1, 0.1, 'assigned', 0.88,
            'Recurrent subgrade subsidence requiring IoT subgrade telemetry & road resurfacing',
            json.dumps(["Ground Penetrating Radar", "Pre-cast Asphalt Geogrid"]),
            json.dumps(["Civil Engineering", "Transportation Systems"]),
            json.dumps(["Central Coalfields Limited (CCL CSR)"]),
            0, None, 1, "Suitable for stormwater modeling and civil analysis",
            2, "Department of Civil & Environmental Engineering (Lead Mentor: Dr. P. K. Singh)"
        )
    ]

    for rep in reports_sample:
        c.execute("""
            INSERT INTO reports (
                id, citizen_id, category, description, gps_lat, gps_lon, photo_url,
                is_verified, ai_spam_score, status, priority_score, challenge_summary,
                suggested_technologies, relevant_departments, potential_industry,
                is_duplicate, duplicate_reason, is_student_eligible, student_suitability_reason,
                assigned_university_id, assigned_department
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                status=excluded.status,
                priority_score=excluded.priority_score,
                challenge_summary=excluded.challenge_summary,
                assigned_university_id=excluded.assigned_university_id,
                assigned_department=excluded.assigned_department
        """, rep)

    # 3. Seed Feedback for implemented report #1
    c.execute("""
        INSERT INTO feedback (id, report_id, citizen_id, rating, comment)
        VALUES (1, 1, 8, 5, 'Outstanding work! The BIT Mesra student team and RMC water engineers installed the solar-powered multi-stage UV purifier within 10 days. Clean, odorless water is restored to all 200 families.')
        ON CONFLICT(id) DO UPDATE SET
            rating=excluded.rating,
            comment=excluded.comment
    """)

    # 4. Seed Projects with prototype and pilot URLs
    c.execute("""
        INSERT INTO projects (
            id, report_id, title, description, status, team_id, mentor_name,
            progress_pct, documentation_url, prototype_url, impact_report
        ) VALUES (
            1, 1, 'Solar Multi-Stage UV Water Purifier & IoT Telemetry',
            'BIT Mesra Capstone Project: Automated solar-powered UV filtration station with real-time TDS and turbidity monitoring transmitting over LoRaWAN to RMC municipal server.',
            'completed', 1, 'Dr. R. K. Sen (BIT Mesra)',
            100.0, 'https://github.com/sociosolve-students/solar-uv-purifier/wiki/Technical-Documentation',
            'https://github.com/sociosolve-students/solar-uv-purifier',
            'Delivering 4,500 liters of potable water daily to 220 families in Harmu Colony at zero electrical operating cost.'
        )
        ON CONFLICT(id) DO UPDATE SET
            status=excluded.status,
            mentor_name=excluded.mentor_name,
            progress_pct=excluded.progress_pct,
            documentation_url=excluded.documentation_url,
            prototype_url=excluded.prototype_url,
            impact_report=excluded.impact_report
    """)

    conn.commit()
    conn.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
