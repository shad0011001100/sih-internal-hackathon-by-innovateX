// @ts-nocheck
export const MOCK_REPORTS = [
    {
        id: 101,
        category: "Sanitation & Solid Waste",
        description: "Severe garbage dumping and choked stormwater drain near Morabadi Ground gate 3.",
        challenge_summary: "Unmanaged municipal solid waste accumulation blocking critical stormwater runoff channel.",
        priority_score: 92,
        gps_lat: 23.3854,
        gps_lon: 85.3341,
        status: "reported",
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        assigned_university_id: 1,
        assigned_department: "Civil & Environmental Engineering"
    },
    {
        id: 102,
        category: "Water Supply & Quality",
        description: "Contaminated municipal tap water pipeline rupture behind Doranda Main Road Market.",
        challenge_summary: "High-turbidity water pipeline fracture threatening microbial contamination in dense urban settlement.",
        priority_score: 88,
        gps_lat: 23.3372,
        gps_lon: 85.3211,
        status: "validated",
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        assigned_university_id: 1,
        assigned_department: "Civil & Environmental Engineering"
    },
    {
        id: 103,
        category: "Roads & Traffic Hazards",
        description: "Hazardous crater-sized pothole on Ratu Road near Pandra Market Chowk.",
        challenge_summary: "Deep arterial pothole impeding heavy vehicular traffic and causing frequent collisions.",
        priority_score: 75,
        gps_lat: 23.3719,
        gps_lon: 85.2987,
        status: "assigned",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        assigned_university_id: 2,
        assigned_department: "Civil & Environmental Engineering"
    },
    {
        id: 104,
        category: "Electricity & Smart Grid",
        description: "Exposed 11kV overhead wire dangling dangerously close to pedestrian pathway in Kokar.",
        challenge_summary: "High-voltage distribution cable sagging into pedestrian zone without ground insulation.",
        priority_score: 95,
        gps_lat: 23.3688,
        gps_lon: 85.3529,
        status: "in_progress",
        created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
        assigned_university_id: 4,
        assigned_department: "Electrical & Electronics Engineering"
    },
    {
        id: 105,
        category: "Health & Vector Control",
        description: "Stagnant drainage pool leading to extreme mosquito breeding near Bariatu Medical Staff Quarters.",
        challenge_summary: "Dengue/malaria vector proliferation in stagnant urban basin adjacent to healthcare facilities.",
        priority_score: 84,
        gps_lat: 23.3912,
        gps_lon: 85.3481,
        status: "under_review",
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        assigned_university_id: 3,
        assigned_department: "Environmental Science & Public Health"
    },
    {
        id: 106,
        category: "Public Infrastructure",
        description: "Automated solar LED streetlights non-functional along Ring Road Tupudana stretch.",
        challenge_summary: "Solar-battery charge controller fault on 2km highway stretch causing night-time safety hazard.",
        priority_score: 68,
        gps_lat: 23.3102,
        gps_lon: 85.3054,
        status: "implemented",
        created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
        assigned_university_id: 1,
        assigned_department: "Electrical & Electronics Engineering"
    }
];

export const MOCK_STUDENT_DASHBOARD = {
    user: {
        name: "Aravind Kumar",
        apaar_id: "APAAR-12345",
        institution: "Birla Institute of Technology (BIT Mesra)",
        department: "Computer Science & Engineering",
        year: "3rd Year B.Tech",
        credits_earned: 14,
        rank: 1
    },
    projects: [
        {
            id: 201,
            title: "IoT Sub-Surface Water Contamination Telemetry",
            category: "Water Supply & Quality",
            status: "accepted",
            mentor_name: "Dr. B. K. Singh (BIT Mesra)",
            deadline: "25 Oct 2026",
            progress_pct: 78,
            documentation_url: "https://github.com/shad0011001100/sih-internal-hackathon-by-innovateX",
            prototype_url: "https://sociosolve-eight.vercel.app",
            impact_report: "Real-time turbidity and pH sensing deployed across 4 pilot test tube wells in Doranda."
        },
        {
            id: 202,
            title: "Computer Vision Pothole & Road Roughness Scanner",
            category: "Roads & Traffic Hazards",
            status: "submitted",
            mentor_name: "Prof. S. Soren (BIT Mesra)",
            deadline: "10 Nov 2026",
            progress_pct: 60,
            documentation_url: "https://github.com/shad0011001100/sih-internal-hackathon-by-innovateX",
            prototype_url: "https://sociosolve-eight.vercel.app",
            impact_report: "Edge-AI model running on mobile cameras to automatically detect and classify pavement distress."
        }
    ]
};

export const MOCK_STUDENT_SKILLS = [
    { skill_name: "IoT Sensor Firmware (ESP32/LoRa)", proficiency_level: "Advanced", projects_demonstrated: 2, is_soft_skill: false },
    { skill_name: "Computer Vision & YOLOv8", proficiency_level: "Advanced", projects_demonstrated: 1, is_soft_skill: false },
    { skill_name: "FastAPI & Python Async Architecture", proficiency_level: "Expert", projects_demonstrated: 3, is_soft_skill: false },
    { skill_name: "GIS & QGIS Spatial Mapping", proficiency_level: "Intermediate", projects_demonstrated: 1, is_soft_skill: false },
    { skill_name: "Grassroots Community Stakeholder Engagement", proficiency_level: "Advanced", projects_demonstrated: 2, is_soft_skill: true }
];

export const MOCK_SUBMISSIONS = [
    {
        id: 301,
        title: "Autonomous Low-Cost Water Quality Telemetry Node",
        description: "Solar-powered IoT sensor network monitoring pH, TDS, and turbidity in Ranchi Municipal tap lines with instant alert telemetry.",
        status: "submitted",
        team_id: 1,
        documentation_url: "https://github.com/shad0011001100/sih-internal-hackathon-by-innovateX",
        prototype_url: "https://sociosolve-eight.vercel.app"
    },
    {
        id: 302,
        title: "Smart Municipal Waste Compaction & Fill-Level Radar",
        description: "Ultrasonic fill-level radar with cloud dispatch routing for municipal waste pickup trucks in Morabadi.",
        status: "accepted",
        team_id: 2,
        documentation_url: "https://github.com/shad0011001100/sih-internal-hackathon-by-innovateX",
        prototype_url: "https://sociosolve-eight.vercel.app"
    }
];

export const MOCK_UNIVERSITY_DATA = {
    dashboard: {
        university_name: "Birla Institute of Technology (BIT Mesra)",
        assigned_problems_count: 5,
        active_projects_count: 8,
        students_participating: 42,
        departments: [
            { name: "Computer Science & Engineering", student_count: 18, project_count: 4 },
            { name: "Civil & Environmental Engineering", student_count: 14, project_count: 3 },
            { name: "Electrical & Electronics Engineering", student_count: 10, project_count: 1 }
        ]
    },
    ranking: [
        { rank: 1, name: "BIT Mesra", department: "Computer Science & Rural Tech", ranking_score: 95.5, project_count: 8, report_count: 12 },
        { rank: 2, name: "IIT (ISM) Dhanbad", department: "Mining & Environmental Science", ranking_score: 94.0, project_count: 7, report_count: 10 },
        { rank: 3, name: "NIT Jamshedpur", department: "Civil & Structural Engineering", ranking_score: 92.0, project_count: 6, report_count: 9 },
        { rank: 4, name: "IIIT Ranchi", department: "Data Science & Embedded IoT", ranking_score: 89.5, project_count: 5, report_count: 7 },
        { rank: 5, name: "Ranchi University", department: "Tribal Studies & Rural Dev", ranking_score: 86.0, project_count: 4, report_count: 6 }
    ],
    students: [
        { id: 1, name: "Aravind Kumar", apaar_id: "APAAR-12345", project_count: 2, skill_count: 5, department: "Computer Science" },
        { id: 2, name: "Priya Sharma", apaar_id: "APAAR-54321", project_count: 1, skill_count: 4, department: "Civil Engineering" },
        { id: 3, name: "Rohan Mahto", apaar_id: "APAAR-67890", project_count: 1, skill_count: 3, department: "Electrical Engineering" }
    ]
};

export const MOCK_INDUSTRY_DATA = {
    dashboard: {
        company_name: "Tata Steel Foundation (Jamshedpur)",
        total_invested: 1450000,
        issues_funded: 6,
        success_rate: 92,
        funded_projects: [
            {
                id: 401,
                title: "IoT Sub-Surface Water Contamination Telemetry",
                category: "Water Supply & Quality",
                amount: 350000,
                status: "in_progress",
                location: "Doranda, Ranchi",
                university: "BIT Mesra",
                progress: 75
            },
            {
                id: 402,
                title: "Decentralized Plastic Pyrolysis Micro-Unit",
                category: "Sanitation & Solid Waste",
                amount: 500000,
                status: "completed",
                location: "Jamshedpur Ward 3",
                university: "NIT Jamshedpur",
                progress: 100
            },
            {
                id: 403,
                title: "Solar Water Filtration for Tribal Anganwadi Centers",
                category: "Public Health",
                amount: 600000,
                status: "in_progress",
                location: "Khunti District",
                university: "Ranchi University",
                progress: 80
            }
        ]
    },
    marketplace: [
        {
            id: 501,
            title: "Automated Water Purity IoT Telemetry System",
            description: "Install solar-powered sub-surface water monitors for arsenic/iron detection in rural Ranchi.",
            category: "Water Quality",
            estimated_cost: 350000,
            impact: "Critical",
            university: "BIT Mesra"
        },
        {
            id: 502,
            title: "AI Pothole Classifier with Road Maintenance Routing",
            description: "Deploy vehicle-mounted edge AI cameras to auto-map and prioritize municipal road craters.",
            category: "Smart Mobility",
            estimated_cost: 250000,
            impact: "High Impact",
            university: "IIIT Ranchi"
        },
        {
            id: 503,
            title: "Bio-Enzymatic Wastewater Odor & Microbe Suppressor",
            description: "Field deployment of organic enzymes in choked open drains near hospital zones.",
            category: "Public Sanitation",
            estimated_cost: 180000,
            impact: "High Impact",
            university: "NIT Jamshedpur"
        }
    ]
};

export async function safeFetch(url, options = {}) {
    try {
        const res = await fetch(url, options);
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
            return await res.json();
        }
        return resolveMockResponse(url, options);
    } catch (err) {
        return resolveMockResponse(url, options);
    }
}

function resolveMockResponse(url, options = {}) {
    const path = url.split("?")[0];
    const method = (options.method || "GET").toUpperCase();

    if (path.includes("/api/auth/send-otp")) {
        return { message: "OTP sent successfully" };
    }
    if (path.includes("/api/auth/verify-otp")) {
        return { role: "citizen", user_id: 1, access_token: "mock-jwt-citizen" };
    }
    if (path.includes("/api/auth/student/login")) {
        return { role: "student", user_id: 2, access_token: "mock-jwt-student" };
    }
    if (path.includes("/api/auth/university/login")) {
        return { role: "university", user_id: 3, access_token: "mock-jwt-university" };
    }
    if (path.includes("/api/auth/official/login")) {
        return { role: "official", user_id: 4, access_token: "mock-jwt-official" };
    }
    if (path.includes("/api/auth/industry/login")) {
        return { role: "industry", user_id: 5, access_token: "mock-jwt-industry" };
    }
    if (path.includes("/api/auth/logout")) {
        return { message: "Logged out successfully" };
    }

    if (path.includes("/api/reports/my")) {
        return MOCK_REPORTS.slice(0, 3);
    }
    if (path.includes("/api/reports") && method === "GET") {
        return MOCK_REPORTS;
    }
    if (path.includes("/api/reports") && method === "POST") {
        let body = {};
        try { body = JSON.parse(options.body || "{}"); } catch (e) {}
        const newReport = {
            id: Date.now(),
            category: body.category || "Sanitation & Solid Waste",
            description: body.description || "Reported grievance",
            challenge_summary: "Civic grievance registered under local ward authority.",
            priority_score: 85,
            gps_lat: body.gps_lat || 23.3441,
            gps_lon: body.gps_lon || 85.3096,
            status: "reported",
            created_at: new Date().toISOString()
        };
        MOCK_REPORTS.unshift(newReport);
        return newReport;
    }

    if (path.includes("/api/admin/reports") && method === "GET") {
        return MOCK_REPORTS;
    }
    if (path.includes("/api/admin/reports") && path.includes("/status")) {
        return { message: "Status updated successfully" };
    }
    if (path.includes("/api/admin/reports") && path.includes("/assign")) {
        return { message: "University assigned successfully" };
    }
    if (path.includes("/api/admin/submissions") && method === "GET") {
        return MOCK_SUBMISSIONS;
    }
    if (path.includes("/api/admin/submissions") && (path.includes("/review") || path.includes("/implement"))) {
        return { message: "Submission action recorded successfully" };
    }

    if (path.includes("/api/student/dashboard")) {
        return MOCK_STUDENT_DASHBOARD;
    }
    if (path.includes("/api/student/skill-profile")) {
        return MOCK_STUDENT_SKILLS;
    }
    if (path.includes("/api/student/problems")) {
        return MOCK_REPORTS;
    }
    if (path.includes("/api/student/projects")) {
        return { message: "Project created/updated successfully" };
    }

    if (path.includes("/api/university/dashboard")) {
        return MOCK_UNIVERSITY_DATA.dashboard;
    }
    if (path.includes("/api/university/problems")) {
        return MOCK_REPORTS.slice(0, 4);
    }
    if (path.includes("/api/university/ranking")) {
        return MOCK_UNIVERSITY_DATA.ranking;
    }
    if (path.includes("/api/university/students")) {
        return MOCK_UNIVERSITY_DATA.students;
    }

    if (path.includes("/api/industry/dashboard")) {
        return MOCK_INDUSTRY_DATA.dashboard;
    }
    if (path.includes("/api/industry/marketplace")) {
        return MOCK_INDUSTRY_DATA.marketplace;
    }
    if (path.includes("/api/industry/fund")) {
        return { message: "CSR funding grant initiated successfully" };
    }

    return { status: "ok" };
}
