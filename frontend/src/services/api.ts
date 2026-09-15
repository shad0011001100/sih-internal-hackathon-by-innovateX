// @ts-nocheck
export const MOCK_MY_REPORTS = [
    {
        id: 901,
        category: "Sanitation & Solid Waste",
        description: "Overflowing residential garbage bin & drain water logging near Harmu Housing Colony, Sector 2.",
        challenge_summary: "Local garbage accumulation causing street obstruction and foul odor near Harmu playground.",
        urgency: "Urgent Attention",
        priority_score: 82,
        gps_lat: 23.3541,
        gps_lon: 85.3126,
        ward_no: 26,
        status: "assigned",
        created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
        provider_name: "Citizen (You - Harmu Sector 2)",
        provider_deadline: "2026-10-18",
        target_resolution_date: "18 Oct 2026",
        assigned_university_id: 1,
        assigned_department: "Civil & Environmental Engineering"
    },
    {
        id: 902,
        category: "Smart Transportation & Infrastructure",
        description: "Deep dangerous pothole near Kishoreganj Chowk crossing following pipeline trenching.",
        challenge_summary: "Unrepaired utility trenching causing recurrent vehicular bottleneck and accident hazard.",
        urgency: "Routine",
        priority_score: 74,
        gps_lat: 23.3645,
        gps_lon: 85.3188,
        ward_no: 22,
        status: "reported",
        created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
        provider_name: "Citizen (You - Kishoreganj)",
        provider_deadline: "2026-10-28",
        target_resolution_date: "28 Oct 2026",
        assigned_university_id: null,
        assigned_department: null
    }
];

export const MOCK_REPORTS = [
    {
        id: 101,
        category: "Sanitation & Solid Waste",
        description: "Severe garbage dumping and choked stormwater drain near Morabadi Ground gate 3.",
        challenge_summary: "Unmanaged municipal solid waste accumulation blocking critical stormwater runoff channel.",
        urgency: "Urgent Attention",
        priority_score: 92,
        gps_lat: 23.3854,
        gps_lon: 85.3341,
        ward_no: 4,
        status: "reported",
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        provider_name: "Morabadi Morning Walkers Association",
        provider_deadline: "2026-10-20",
        target_resolution_date: "20 Oct 2026",
        assigned_university_id: 1,
        assigned_department: "Civil & Environmental Engineering"
    },
    {
        id: 102,
        category: "Water Supply & Quality",
        description: "Contaminated municipal tap water pipeline rupture behind Doranda Main Road Market.",
        challenge_summary: "High-turbidity water pipeline fracture threatening microbial contamination in dense urban settlement.",
        urgency: "Urgent Attention",
        priority_score: 88,
        gps_lat: 23.3372,
        gps_lon: 85.3211,
        ward_no: 14,
        status: "validated",
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        provider_name: "Doranda Residents Welfare Society",
        provider_deadline: "2026-10-22",
        target_resolution_date: "22 Oct 2026",
        assigned_university_id: 1,
        assigned_department: "Civil & Environmental Engineering"
    },
    {
        id: 103,
        category: "Smart Transportation & Infrastructure",
        description: "Critical arterial pavement structural subsidence and recurrent subgrade shear failure on Ratu Road corridor.",
        challenge_summary: "Recurrent subgrade subsidence requiring automated IoT vibration sensor telemetry and durable geo-polymer asphalt composite engineering.",
        urgency: "Standard Priority",
        priority_score: 75,
        gps_lat: 23.3719,
        gps_lon: 85.2987,
        ward_no: 7,
        status: "assigned",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        provider_name: "Ratu Road Traders & Transport Union",
        provider_deadline: "2026-10-25",
        target_resolution_date: "25 Oct 2026",
        assigned_university_id: 2,
        assigned_department: "Civil & Environmental Engineering"
    },
    {
        id: 104,
        category: "Electricity & Smart Grid",
        description: "Exposed 11kV overhead wire dangling dangerously close to pedestrian pathway in Kokar.",
        challenge_summary: "High-voltage distribution cable sagging into pedestrian zone without ground insulation.",
        urgency: "Urgent Attention",
        priority_score: 95,
        gps_lat: 23.3688,
        gps_lon: 85.3529,
        ward_no: 11,
        status: "in_progress",
        created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
        provider_name: "Kokar Industrial Area Panchayat",
        provider_deadline: "2026-10-19",
        target_resolution_date: "19 Oct 2026",
        assigned_university_id: 4,
        assigned_department: "Electrical & Electronics Engineering"
    },
    {
        id: 105,
        category: "Health & Vector Control",
        description: "Stagnant drainage pool leading to extreme mosquito breeding near Bariatu Medical Staff Quarters.",
        challenge_summary: "Dengue/malaria vector proliferation in stagnant urban basin adjacent to healthcare facilities.",
        urgency: "Standard Priority",
        priority_score: 84,
        gps_lat: 23.3912,
        gps_lon: 85.3481,
        ward_no: 3,
        status: "under_review",
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        provider_name: "Bariatu Healthcare Community Board",
        provider_deadline: "2026-10-27",
        target_resolution_date: "27 Oct 2026",
        assigned_university_id: 3,
        assigned_department: "Environmental Science & Public Health"
    },
    {
        id: 106,
        category: "Public Infrastructure",
        description: "Automated solar LED streetlights non-functional along Ring Road Tupudana stretch.",
        challenge_summary: "Solar-battery charge controller fault on 2km highway stretch causing night-time safety hazard.",
        urgency: "Routine",
        priority_score: 68,
        gps_lat: 23.3102,
        gps_lon: 85.3054,
        ward_no: 32,
        status: "implemented",
        created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
        provider_name: "Tupudana Gram Panchayat",
        provider_deadline: "2026-11-05",
        target_resolution_date: "05 Nov 2026",
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
        rank: 1,
        linkedin_url: "https://linkedin.com/in/aravind-kumar-bit",
        github_url: "https://github.com/aravind-kumar-tech"
    },
    projects: [
        {
            id: 201,
            title: "IoT Sub-Surface Water Contamination Telemetry",
            category: "Water Supply & Quality",
            status: "accepted",
            mentor_name: "Dr. B. K. Singh (BIT Mesra)",
            provider_name: "Doranda Residents Welfare Society",
            deadline: "25 Oct 2026",
            progress_pct: 78,
            documentation_url: "https://github.com/shad0011001100/sih-internal-hackathon-by-innovateX",
            prototype_url: "https://sociosolve-eight.vercel.app",
            impact_report: "Real-time turbidity and pH sensing deployed across 4 pilot test tube wells in Doranda."
        },
        {
            id: 202,
            title: "Computer Vision Pothole & Road Roughness Scanner",
            category: "Smart Transportation & Infrastructure",
            status: "submitted",
            mentor_name: "Prof. S. Soren (BIT Mesra)",
            provider_name: "Ratu Road Traders & Transport Union",
            deadline: "10 Nov 2026",
            progress_pct: 100,
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
        student_name: "Aravind Kumar",
        student_institution: "BIT Mesra",
        linkedin_url: "https://linkedin.com/in/aravind-kumar-bit",
        github_url: "https://github.com/aravind-kumar-tech",
        provider_name: "Doranda Residents Welfare Society",
        provider_deadline: "25 Oct 2026",
        documentation_url: "https://github.com/shad0011001100/sih-internal-hackathon-by-innovateX",
        prototype_url: "https://sociosolve-eight.vercel.app"
    },
    {
        id: 302,
        title: "Smart Municipal Waste Compaction & Fill-Level Radar",
        description: "Ultrasonic fill-level radar with cloud dispatch routing for municipal waste pickup trucks in Morabadi.",
        status: "accepted",
        team_id: 2,
        student_name: "Priya Sharma",
        student_institution: "BIT Mesra",
        linkedin_url: "https://linkedin.com/in/priya-sharma-bit",
        github_url: "https://github.com/priya-sharma-iot",
        provider_name: "Morabadi Morning Walkers Association",
        provider_deadline: "30 Oct 2026",
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
        credits_awarded: 16,
        csr_grants_received: 1450000,
        departments: [
            { name: "Computer Science & Engineering", student_count: 18, project_count: 4, faculty_head: "Dr. B. K. Singh" },
            { name: "Civil & Environmental Engineering", student_count: 14, project_count: 3, faculty_head: "Prof. S. Soren" },
            { name: "Electrical & Electronics Engineering", student_count: 10, project_count: 1, faculty_head: "Dr. R. K. Mishra" }
        ]
    },
    settings: {
        aishe_code: "U-0298",
        accreditation: "NAAC A+ (CGPA 3.48)",
        nodal_officer: "Dr. Ramesh Chandra (Dean R&D)",
        nodal_email: "dean.rd@bitmesra.ac.in",
        capstone_credits: 4,
        min_team_size: 2,
        max_team_size: 4,
        require_field_pilot: true,
        auto_csr_matching: true,
        notify_new_civic_issues: true
    },
    faculty_mentors: [
        { id: 1, name: "Dr. B. K. Singh", department: "Computer Science & Engineering", specialization: "IoT Sensor Firmware & LoRa Networks", active_projects: 3 },
        { id: 2, name: "Prof. S. Soren", department: "Civil & Environmental Engineering", specialization: "GIS Ward Mapping & Water Treatment", active_projects: 2 },
        { id: 3, name: "Dr. Ananya Mukherjee", department: "Biotechnology & Environmental Science", specialization: "Microbial Testing & Waste Management", active_projects: 2 },
        { id: 4, name: "Dr. R. K. Mishra", department: "Electrical & Electronics Engineering", specialization: "Smart Grids & Solar Inverter Telemetry", active_projects: 1 }
    ],
    labs: [
        { id: 1, name: "Center of Excellence in Water & GIS Telemetry", room: "Lab 204", head: "Prof. S. Soren", available_seats: 12 },
        { id: 2, name: "Edge-AI & Computer Vision Prototyping Facility", room: "Lab 108", head: "Dr. B. K. Singh", available_seats: 8 },
        { id: 3, name: "Clean Energy & Microgrid Simulation Cell", room: "Lab 312", head: "Dr. R. K. Mishra", available_seats: 15 }
    ],
    ranking: [
        { rank: 1, name: "BIT Mesra", department: "Computer Science & Rural Tech", ranking_score: 95.5, project_count: 8, report_count: 12 },
        { rank: 2, name: "IIT (ISM) Dhanbad", department: "Mining & Environmental Science", ranking_score: 94.0, project_count: 7, report_count: 10 },
        { rank: 3, name: "NIT Jamshedpur", department: "Civil & Structural Engineering", ranking_score: 92.0, project_count: 6, report_count: 9 },
        { rank: 4, name: "IIIT Ranchi", department: "Data Science & Embedded IoT", ranking_score: 89.5, project_count: 5, report_count: 7 },
        { rank: 5, name: "Ranchi University", department: "Tribal Studies & Rural Dev", ranking_score: 86.0, project_count: 4, report_count: 6 }
    ],
    students: [
        { id: 1, name: "Aravind Kumar", apaar_id: "APAAR-12345", project_count: 2, skill_count: 5, department: "Computer Science & Engineering", verified_credits: 4 },
        { id: 2, name: "Priya Sharma", apaar_id: "APAAR-54321", project_count: 1, skill_count: 4, department: "Civil & Environmental Engineering", verified_credits: 4 },
        { id: 3, name: "Rohan Mahto", apaar_id: "APAAR-67890", project_count: 1, skill_count: 3, department: "Electrical & Electronics Engineering", verified_credits: 0 }
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
                student_lead: "Aravind Kumar",
                linkedin_url: "https://linkedin.com/in/aravind-kumar-bit",
                github_url: "https://github.com/aravind-kumar-tech",
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
                student_lead: "Rahul Sen",
                linkedin_url: "https://linkedin.com/in/rahul-sen-nit",
                github_url: "https://github.com/rahul-sen-env",
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
                student_lead: "Anita Toppo",
                linkedin_url: "https://linkedin.com/in/anita-toppo-ru",
                github_url: "https://github.com/anita-toppo-tribal",
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
        return MOCK_MY_REPORTS;
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
            urgency: "Urgent Attention",
            priority_score: 85,
            gps_lat: body.gps_lat || 23.3441,
            gps_lon: body.gps_lon || 85.3096,
            ward_no: body.ward_no || 14,
            status: "reported",
            created_at: new Date().toISOString(),
            provider_name: "Citizen (You)",
            provider_deadline: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
            target_resolution_date: "In 7 Days"
        };
        MOCK_MY_REPORTS.unshift(newReport);
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
    if (path.includes("/api/university/settings") && method === "GET") {
        return MOCK_UNIVERSITY_DATA.settings;
    }
    if (path.includes("/api/university/settings") && (method === "PUT" || method === "POST")) {
        let body = {};
        try { body = JSON.parse(options.body || "{}"); } catch (e) {}
        MOCK_UNIVERSITY_DATA.settings = { ...MOCK_UNIVERSITY_DATA.settings, ...body };
        return { status: "ok", settings: MOCK_UNIVERSITY_DATA.settings };
    }
    if (path.includes("/api/university/faculty")) {
        return MOCK_UNIVERSITY_DATA.faculty_mentors;
    }
    if (path.includes("/api/university/labs")) {
        return MOCK_UNIVERSITY_DATA.labs;
    }
    if (path.includes("/api/university/problems") && path.includes("/assign-faculty")) {
        return { status: "ok", message: "Faculty mentor assigned successfully" };
    }
    if (path.includes("/api/university/problems")) {
        return MOCK_REPORTS.slice(0, 4);
    }
    if (path.includes("/api/university/projects") && path.includes("/approve-credits")) {
        return { status: "ok", message: "Academic capstone credits approved successfully" };
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
