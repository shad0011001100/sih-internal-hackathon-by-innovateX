// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../context/ToastContext";
import { safeFetch } from "../../services/api";

export default function UniversityDashboard() {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [problems, setProblems] = useState<any[]>([]);
    const [ranking, setRanking] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [facultyMentors, setFacultyMentors] = useState<any[]>([]);
    const [labs, setLabs] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>({
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
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"problems" | "capstones" | "faculty" | "leaderboard">("problems");
    const [selectedDept, setSelectedDept] = useState("All");

    // Modal states
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedProblemForAssign, setSelectedProblemForAssign] = useState<any | null>(null);
    const [selectedFaculty, setSelectedFaculty] = useState<string>("");
    const [selectedLab, setSelectedLab] = useState<string>("");
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedProblemDetail, setSelectedProblemDetail] = useState<any | null>(null);
    const [creditApprovalModalOpen, setCreditApprovalModalOpen] = useState(false);
    const [selectedProjectForCredit, setSelectedProjectForCredit] = useState<any | null>(null);
    const [savingSettings, setSavingSettings] = useState(false);

    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);
    const { showToast } = useToast();

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const [dash, prob, rank, stud, sett, fac, labList] = await Promise.all([
                safeFetch("/api/university/dashboard"),
                safeFetch("/api/university/problems"),
                safeFetch("/api/university/ranking"),
                safeFetch("/api/university/students"),
                safeFetch("/api/university/settings"),
                safeFetch("/api/university/faculty"),
                safeFetch("/api/university/labs")
            ]);

            setDashboardData(dash || {});
            setProblems(Array.isArray(prob) ? prob : []);
            setRanking(Array.isArray(rank) ? rank : []);
            setStudents(Array.isArray(stud) ? stud : []);
            if (sett && typeof sett === "object") setSettings(sett);
            if (Array.isArray(fac) && fac.length > 0) setFacultyMentors(fac);
            if (Array.isArray(labList) && labList.length > 0) setLabs(labList);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to load university records");
            showToast("Unable to load university records.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await safeFetch("/api/auth/logout", { method: "POST" });
            showToast("Logged out successfully", "info");
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Logout failed");
            showToast("Logout failed", "error");
        } finally {
            setLoading(false);
            logout();
            navigate("/");
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            const res = await safeFetch("/api/university/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });
            if (res?.settings) setSettings(res.settings);
            showToast("University innovation & academic policies saved successfully!", "success");
            setSettingsModalOpen(false);
        } catch (err: any) {
            console.error(err);
            showToast(err.message || "Failed to save settings", "error");
        } finally {
            setSavingSettings(false);
        }
    };

    const openAssignModal = (problem: any) => {
        setSelectedProblemForAssign(problem);
        setSelectedFaculty(problem.faculty_mentor || (facultyMentors[0]?.name || "Dr. B. K. Singh"));
        setSelectedLab(problem.lab_allocation || (labs[0]?.name || "Center of Excellence in Water & GIS Telemetry"));
        setAssignModalOpen(true);
    };

    const handleAssignFaculty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProblemForAssign) return;
        try {
            await safeFetch(`/api/university/problems/${selectedProblemForAssign.id}/assign-faculty`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    faculty_mentor: selectedFaculty,
                    lab_allocation: selectedLab,
                    department: selectedProblemForAssign.assigned_department || "Civil & Environmental Engineering"
                })
            });
            setProblems(prev => prev.map(p => p.id === selectedProblemForAssign.id ? {
                ...p,
                faculty_mentor: selectedFaculty,
                lab_allocation: selectedLab
            } : p));
            showToast(`Faculty mentor ${selectedFaculty} assigned to Problem #${selectedProblemForAssign.id}!`, "success");
            setAssignModalOpen(false);
        } catch (err: any) {
            console.error(err);
            showToast(err.message || "Failed to assign faculty", "error");
        }
    };

    const openCreditModal = (project: any) => {
        setSelectedProjectForCredit(project);
        setCreditApprovalModalOpen(true);
    };

    const handleApproveCredits = async () => {
        if (!selectedProjectForCredit) return;
        try {
            await safeFetch(`/api/university/projects/${selectedProjectForCredit.id}/approve-credits`, {
                method: "POST"
            });
            showToast(`4 Academic Capstone Credits awarded for "${selectedProjectForCredit.title}"!`, "success");
            setCreditApprovalModalOpen(false);
        } catch (err: any) {
            console.error(err);
            showToast(err.message || "Failed to approve credits", "error");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-on-background">
                <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined animate-spin text-tertiary text-4xl" data-icon="refresh">refresh</span>
                    <p className="text-sm text-on-surface-variant font-medium">Loading Academic Innovation Hub...</p>
                </div>
            </div>
        );
    }

    const assignedProblemsCount = dashboardData?.assigned_reports_count ?? dashboardData?.assigned_problems_count ?? problems.length;
    const activeProjectsCount = dashboardData?.projects_in_progress?.length ?? dashboardData?.active_projects_count ?? 8;
    const studentParticipationCount = students.length || dashboardData?.students_participating || 42;
    const creditsAwardedCount = dashboardData?.credits_awarded || 16;
    const csrGrantsTotal = dashboardData?.csr_grants_received || 1450000;
    const universityName = dashboardData?.university_info?.name || dashboardData?.university_name || "Birla Institute of Technology (BIT Mesra)";

    const departmentsList = [
        "All",
        "Computer Science & Engineering",
        "Civil & Environmental Engineering",
        "Electrical & Electronics Engineering",
        "Biotechnology & Environmental Science"
    ];

    const filteredProblems = problems.filter(p => {
        if (selectedDept === "All") return true;
        const dept = (p.assigned_department || p.department || "").toLowerCase();
        return dept.includes(selectedDept.toLowerCase().split(" ")[0]);
    });

    const capstoneProjects = [
        {
            id: 201,
            title: "IoT Sub-Surface Water Contamination Telemetry",
            department: "Civil & Environmental Engineering",
            team_leader: "Aravind Kumar (APAAR-12345)",
            mentor: "Dr. B. K. Singh",
            progress_pct: 100,
            status: "ready_for_credit",
            demo_url: "https://sociosolve-eight.vercel.app",
            repo_url: "https://github.com/shad0011001100/sih-internal-hackathon-by-innovateX",
            csr_grant: "₹3,50,000 (Tata Steel Foundation)"
        },
        {
            id: 202,
            title: "Computer Vision Pothole & Road Roughness Scanner",
            department: "Computer Science & Engineering",
            team_leader: "Priya Sharma (APAAR-54321)",
            mentor: "Prof. S. Soren",
            progress_pct: 75,
            status: "pilot_testing",
            demo_url: "https://sociosolve-eight.vercel.app",
            repo_url: "https://github.com/shad0011001100/sih-internal-hackathon-by-innovateX",
            csr_grant: "₹2,50,000 (CCL Ranchi)"
        },
        {
            id: 203,
            title: "Decentralized Solar Microgrid Remote Telemetry Node",
            department: "Electrical & Electronics Engineering",
            team_leader: "Rohan Mahto (APAAR-67890)",
            mentor: "Dr. R. K. Mishra",
            progress_pct: 50,
            status: "prototyping",
            demo_url: "https://sociosolve-eight.vercel.app",
            repo_url: "https://github.com/shad0011001100/sih-internal-hackathon-by-innovateX",
            csr_grant: "₹4,00,000 (JSPL CSR)"
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background text-on-background selection:bg-tertiary-fixed selection:text-on-tertiary-fixed pb-24">
            {/* Top Institutional Header */}
            <header className="bg-gradient-to-r from-tertiary via-[#4d6055] to-tertiary sticky top-0 z-40 shadow-md border-b border-tertiary-container/30">
                <div className="max-w-[1240px] mx-auto px-4 h-18 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-surface-container-lowest/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-xs">
                            <span className="material-symbols-outlined text-2xl" data-icon="school">school</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg font-bold font-headline-sm text-white tracking-tight truncate max-w-[200px] sm:max-w-md">
                                    {universityName}
                                </h1>
                                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Rank #1 State (95.5 Pts)
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-white/80">
                                <span>AISHE: {settings.aishe_code || "U-0298"}</span>
                                <span>•</span>
                                <span>{settings.accreditation || "NAAC A+"}</span>
                                <span className="hidden md:inline">• Dean R&amp;D: {settings.nodal_officer}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSettingsModalOpen(true)}
                            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                            title="University Innovation Settings &amp; Policies"
                        >
                            <span className="material-symbols-outlined text-sm">settings</span>
                            <span className="hidden sm:inline">Settings</span>
                        </button>
                        <button 
                            type="button" 
                            onClick={handleLogout} 
                            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs shadow-sm cursor-pointer active:scale-95 transition-all border border-white/10"
                            aria-label="Logout"
                            title="Logout from University Portal"
                        >
                            <span className="material-symbols-outlined text-sm" data-icon="logout">logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 py-6 space-y-6">
                {error && (
                    <div className="p-4 rounded-2xl bg-error-container text-on-error-container flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-xl" data-icon="error">error</span>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={fetchAll} 
                            className="px-3 py-1 bg-surface-container-lowest text-on-surface rounded-lg text-xs font-bold hover:bg-surface-variant cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* 5-Card Academic Innovation Telemetry Strip */}
                <section>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/25 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-semibold">Assigned Grievances</span>
                                <span className="material-symbols-outlined text-tertiary text-lg">alt_route</span>
                            </div>
                            <span className="text-2xl font-bold font-mono text-tertiary">{assignedProblemsCount}</span>
                            <span className="text-[10px] text-on-surface-variant/70 mt-1">Pending student adoption</span>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/25 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-semibold">Active Capstones</span>
                                <span className="material-symbols-outlined text-primary text-lg">code</span>
                            </div>
                            <span className="text-2xl font-bold font-mono text-primary">{activeProjectsCount}</span>
                            <span className="text-[10px] text-on-surface-variant/70 mt-1">Across 4 engineering depts</span>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/25 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-semibold">Student Innovators</span>
                                <span className="material-symbols-outlined text-secondary text-lg">school</span>
                            </div>
                            <span className="text-2xl font-bold font-mono text-secondary">{studentParticipationCount}</span>
                            <span className="text-[10px] text-on-surface-variant/70 mt-1">APAAR Digital ID Verified</span>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/25 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-semibold">Credits Certified</span>
                                <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
                            </div>
                            <span className="text-2xl font-bold font-mono text-emerald-700">{creditsAwardedCount}</span>
                            <span className="text-[10px] text-on-surface-variant/70 mt-1">4-Credit B.Tech degree courses</span>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="col-span-2 sm:col-span-1 bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/25 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-semibold">CSR Grants</span>
                                <span className="material-symbols-outlined text-amber-600 text-lg">account_balance</span>
                            </div>
                            <span className="text-xl font-bold font-mono text-amber-700">₹{(csrGrantsTotal / 100000).toFixed(1)}L</span>
                            <span className="text-[10px] text-on-surface-variant/70 mt-1">Tata Steel &amp; CCL funded</span>
                        </motion.div>
                    </div>
                </section>

                {/* Sub-Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2 overflow-x-auto no-scrollbar">
                    {[
                        { id: "problems", label: "Assigned Civic Challenges", icon: "science", count: problems.length },
                        { id: "capstones", label: "Capstone Projects & Credit Review", icon: "assignment_turned_in", count: capstoneProjects.length },
                        { id: "faculty", label: "Faculty Mentors & R&D Labs", icon: "domain", count: (facultyMentors.length || 4) + (labs.length || 3) },
                        { id: "leaderboard", label: "State Institutional Leaderboard", icon: "emoji_events", count: ranking.length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                activeTab === tab.id
                                    ? "bg-tertiary text-on-tertiary shadow-xs"
                                    : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                            <span>{tab.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                                activeTab === tab.id ? "bg-white/20 text-white" : "bg-outline-variant/30 text-on-surface-variant"
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* TAB 1: Assigned Civic Challenges */}
                {activeTab === "problems" && (
                    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-on-surface font-headline-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-tertiary">science</span>
                                    Assigned Problem Statements ({filteredProblems.length})
                                </h2>
                                <p className="text-xs text-on-surface-variant">Civic problems routed to BIT Mesra by municipal commissioners for academic engineering solutions</p>
                            </div>

                            {/* Department Filter Pills */}
                            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                                {departmentsList.map(dept => (
                                    <button
                                        key={dept}
                                        type="button"
                                        onClick={() => setSelectedDept(dept)}
                                        className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                            selectedDept === dept
                                                ? "bg-tertiary text-on-tertiary"
                                                : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                                        }`}
                                    >
                                        {dept === "All" ? "All Departments" : dept.replace("& Engineering", "").replace("& Environmental", "")}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredProblems.length === 0 && (
                                <div className="col-span-2 p-8 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/40">
                                    <p className="text-sm text-on-surface-variant">No problems assigned for {selectedDept}.</p>
                                </div>
                            )}
                            {filteredProblems.map((prob, i) => (
                                <motion.article 
                                    key={prob.id || i} 
                                    initial={{ opacity: 0, y: 10 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    transition={{ delay: 0.05 * i }} 
                                    className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 hover:border-tertiary/50 transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary bg-tertiary/10 px-2.5 py-1 rounded-md">
                                                {prob.category || "Civil & Environmental"}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-error-container text-on-error-container flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]">flag</span>
                                                    {prob.priority_score ? (prob.priority_score > 1 ? `${prob.priority_score}/100 Priority` : `${Math.round(prob.priority_score * 100)}/100 Priority`) : "88/100 Priority"}
                                                </span>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container uppercase">
                                                    {prob.status || "ASSIGNED"}
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="text-base font-bold text-on-surface mb-1">{prob.title || prob.description}</h3>
                                        <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">
                                            {prob.challenge_summary || prob.description}
                                        </p>

                                        <div className="bg-surface-container-low rounded-xl p-3 space-y-2 mb-3 text-xs border border-outline-variant/20">
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-on-surface-variant font-medium flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm text-tertiary">domain</span>
                                                    Department:
                                                </span>
                                                <span className="font-bold text-on-surface">{prob.assigned_department || "Civil & Environmental Engineering"}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-on-surface-variant font-medium flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm text-primary">person</span>
                                                    Faculty Mentor:
                                                </span>
                                                <span className="font-bold text-primary">{prob.faculty_mentor || "Dr. B. K. Singh (Assigned)"}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-on-surface-variant font-medium flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm text-secondary">biotech</span>
                                                    Lab Facility:
                                                </span>
                                                <span className="font-mono text-[10px] text-on-surface-variant">{prob.lab_allocation || "Lab 204: Water & GIS Telemetry"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedProblemDetail(prob); setDetailModalOpen(true); }}
                                            className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-sm">visibility</span>
                                            View Dossier
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => openAssignModal(prob)}
                                            className="px-3.5 py-1.5 rounded-xl bg-tertiary text-on-tertiary text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-tertiary/90 transition-all active:scale-95 shadow-xs"
                                        >
                                            <span className="material-symbols-outlined text-sm">assignment_ind</span>
                                            Assign Faculty &amp; Lab
                                        </button>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* TAB 2: Capstone Projects & Academic Credit Review */}
                {activeTab === "capstones" && (
                    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-on-surface font-headline-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">assignment_turned_in</span>
                                    Student Capstones &amp; Degree Credit Certification ({capstoneProjects.length})
                                </h2>
                                <p className="text-xs text-on-surface-variant">Review 4-phase milestone progress and formally certify 4-credit course requirements upon 100% completion</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {capstoneProjects.map(proj => (
                                <div key={proj.id} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-base font-bold text-on-surface">{proj.title}</h3>
                                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${
                                                proj.progress_pct === 100 ? "bg-emerald-100 text-emerald-800" : "bg-primary-fixed text-on-primary-fixed"
                                            }`}>
                                                {proj.progress_pct === 100 ? "✓ 100% Deployed" : `${proj.progress_pct}% In Progress`}
                                            </span>
                                        </div>
                                        <p className="text-xs text-on-surface-variant">
                                            <strong>Team Leader:</strong> {proj.team_leader} • <strong>Mentor:</strong> {proj.mentor} • <strong>Dept:</strong> {proj.department}
                                        </p>
                                        <p className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 border border-amber-200/60 font-medium">
                                            <span className="material-symbols-outlined text-sm text-amber-600">volunteer_activism</span>
                                            <span>CSR Sponsorship: {proj.csr_grant}</span>
                                        </p>

                                        {/* Milestone Tracker Bar */}
                                        <div className="pt-2">
                                            <div className="flex justify-between text-[10px] font-mono text-on-surface-variant mb-1">
                                                <span>Milestone Completion</span>
                                                <span className="font-bold text-primary">{proj.progress_pct}%</span>
                                            </div>
                                            <div className="w-full bg-surface-container-high rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all duration-500 ${proj.progress_pct === 100 ? "bg-emerald-600" : "bg-primary"}`} 
                                                    style={{ width: `${proj.progress_pct}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex md:flex-col items-end justify-between gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-outline-variant/20">
                                        <div className="flex items-center gap-2">
                                            <a 
                                                href={proj.demo_url} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-medium flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                                Live Demo
                                            </a>
                                            <a 
                                                href={proj.repo_url} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="px-2.5 py-1 rounded-lg bg-inverse-surface text-inverse-on-surface text-[11px] font-mono font-medium flex items-center gap-1"
                                            >
                                                <span>gh</span>
                                                Code
                                            </a>
                                        </div>

                                        {proj.progress_pct === 100 ? (
                                            <button
                                                type="button"
                                                onClick={() => openCreditModal(proj)}
                                                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                                            >
                                                <span className="material-symbols-outlined text-sm">verified</span>
                                                Certify 4 Credits
                                            </button>
                                        ) : (
                                            <div className="text-[11px] text-on-surface-variant/70 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">pending</span>
                                                <span>Awaiting 100% deployment</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* TAB 3: Faculty Mentors & Research Facilities */}
                {activeTab === "faculty" && (
                    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {/* Faculty Guides */}
                        <div>
                            <h2 className="text-lg font-bold text-on-surface font-headline-sm flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-tertiary">badge</span>
                                Accredited Faculty Research Mentors ({facultyMentors.length || 4})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(facultyMentors.length > 0 ? facultyMentors : [
                                    { id: 1, name: "Dr. B. K. Singh", department: "Computer Science & Engineering", specialization: "IoT Sensor Firmware & LoRa Networks", active_projects: 3 },
                                    { id: 2, name: "Prof. S. Soren", department: "Civil & Environmental Engineering", specialization: "GIS Ward Mapping & Water Treatment", active_projects: 2 },
                                    { id: 3, name: "Dr. Ananya Mukherjee", department: "Biotechnology & Environmental Science", specialization: "Microbial Testing & Waste Management", active_projects: 2 },
                                    { id: 4, name: "Dr. R. K. Mishra", department: "Electrical & Electronics Engineering", specialization: "Smart Grids & Solar Inverter Telemetry", active_projects: 1 }
                                ]).map(fac => (
                                    <div key={fac.id} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center font-bold text-sm">
                                            {fac.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-bold text-on-surface">{fac.name}</h4>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
                                                    {fac.active_projects || 2} Guided
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-medium text-tertiary truncate">{fac.department}</p>
                                            <p className="text-[10px] text-on-surface-variant mt-1 line-clamp-1">{fac.specialization}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Research Facilities */}
                        <div>
                            <h2 className="text-lg font-bold text-on-surface font-headline-sm flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-secondary">biotech</span>
                                Designated R&amp;D Prototyping Labs ({labs.length || 3})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {(labs.length > 0 ? labs : [
                                    { id: 1, name: "Center of Excellence in Water & GIS Telemetry", room: "Lab 204", head: "Prof. S. Soren", available_seats: 12 },
                                    { id: 2, name: "Edge-AI & Computer Vision Prototyping Facility", room: "Lab 108", head: "Dr. B. K. Singh", available_seats: 8 },
                                    { id: 3, name: "Clean Energy & Microgrid Simulation Cell", room: "Lab 312", head: "Dr. R. K. Mishra", available_seats: 15 }
                                ]).map(lab => (
                                    <div key={lab.id} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-mono font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-md">{lab.room}</span>
                                                <span className="text-[10px] text-emerald-700 font-semibold">{lab.available_seats} Workbenches Free</span>
                                            </div>
                                            <h4 className="text-xs font-bold text-on-surface mb-1">{lab.name}</h4>
                                            <p className="text-[10px] text-on-surface-variant">Faculty In-Charge: {lab.head}</p>
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-on-surface-variant">
                                            <span>Hardware Kits: LoRa, ESP32, Solar</span>
                                            <span className="text-tertiary font-bold">24/7 Access</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* TAB 4: Statewide Leaderboard */}
                {activeTab === "leaderboard" && (
                    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div>
                            <h2 className="text-lg font-bold text-on-surface font-headline-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary" data-icon="emoji_events">emoji_events</span>
                                Jharkhand State University Innovation Index
                            </h2>
                            <p className="text-xs text-on-surface-variant">Rankings evaluated by Department of Higher Education &amp; SIH based on resolved civic problems and CSR capital</p>
                        </div>

                        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30">
                            <div className="grid grid-cols-12 bg-surface-container-high/60 px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                                <span className="col-span-1">Rank</span>
                                <span className="col-span-5">Institution Name</span>
                                <span className="col-span-2 text-center">Projects</span>
                                <span className="col-span-2 text-center">Grievances Solved</span>
                                <span className="col-span-2 text-right">Score</span>
                            </div>
                            <div className="divide-y divide-outline-variant/20">
                                {ranking.map((uni, idx) => (
                                    <div 
                                        key={uni.id || idx} 
                                        className={`grid grid-cols-12 px-4 py-3.5 items-center text-xs transition-colors ${
                                            idx === 0 ? "bg-tertiary/5 font-semibold" : "hover:bg-surface-container-low"
                                        }`}
                                    >
                                        <span className="col-span-1 font-mono font-bold flex items-center gap-1">
                                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                                        </span>
                                        <div className="col-span-5">
                                            <p className="font-bold text-on-surface truncate">{uni.name}</p>
                                            <p className="text-[10px] text-on-surface-variant truncate">{uni.department}</p>
                                        </div>
                                        <span className="col-span-2 text-center font-mono">{uni.project_count || 8}</span>
                                        <span className="col-span-2 text-center font-mono">{uni.report_count || 12}</span>
                                        <span className="col-span-2 text-right font-mono font-bold text-tertiary text-sm">
                                            {uni.ranking_score || uni.score || 95.5} pts
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.section>
                )}
            </main>

            {/* FULLY FUNCTIONAL UNIVERSITY SETTINGS MODAL */}
            {settingsModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-outline-variant/30 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/25">
                            <div>
                                <h3 className="text-lg font-bold text-on-surface font-headline-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-tertiary">settings</span>
                                    University Innovation &amp; Policy Settings
                                </h3>
                                <p className="text-xs text-on-surface-variant mt-0.5">Configure institutional capstone rules, accreditation telemetry, and faculty guidelines</p>
                            </div>
                            <button type="button" onClick={() => setSettingsModalOpen(false)} className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container cursor-pointer">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSaveSettings} className="space-y-4 pt-4">
                            {/* Institution Identification */}
                            <div className="space-y-3 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-tertiary flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm">domain</span>
                                    1. Accreditation &amp; Nodal Authority
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-on-surface mb-1">AISHE Institutional Code</label>
                                        <input 
                                            type="text" 
                                            value={settings.aishe_code || ""} 
                                            onChange={e => setSettings({ ...settings, aishe_code: e.target.value })} 
                                            className="w-full px-3 py-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-xs font-mono font-bold focus:ring-2 focus:ring-tertiary" 
                                            placeholder="e.g. U-0298"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-on-surface mb-1">NAAC Accreditation Tier</label>
                                        <input 
                                            type="text" 
                                            value={settings.accreditation || ""} 
                                            onChange={e => setSettings({ ...settings, accreditation: e.target.value })} 
                                            className="w-full px-3 py-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-xs font-semibold focus:ring-2 focus:ring-tertiary" 
                                            placeholder="e.g. NAAC A+ (CGPA 3.48)"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-on-surface mb-1">Dean / Nodal R&amp;D Officer</label>
                                        <input 
                                            type="text" 
                                            value={settings.nodal_officer || ""} 
                                            onChange={e => setSettings({ ...settings, nodal_officer: e.target.value })} 
                                            className="w-full px-3 py-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-xs focus:ring-2 focus:ring-tertiary" 
                                            placeholder="Dr. Ramesh Chandra"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-on-surface mb-1">Official Nodal Email</label>
                                        <input 
                                            type="email" 
                                            value={settings.nodal_email || ""} 
                                            onChange={e => setSettings({ ...settings, nodal_email: e.target.value })} 
                                            className="w-full px-3 py-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-xs focus:ring-2 focus:ring-tertiary" 
                                            placeholder="dean.rd@bitmesra.ac.in"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Academic Capstone Rules */}
                            <div className="space-y-3 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm">school</span>
                                    2. Capstone Degree Credit Regulations
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-on-surface mb-1">Course Credits Awarded</label>
                                        <select 
                                            value={settings.capstone_credits || 4} 
                                            onChange={e => setSettings({ ...settings, capstone_credits: Number(e.target.value) })}
                                            className="w-full px-3 py-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-xs font-bold focus:ring-2 focus:ring-tertiary"
                                        >
                                            <option value={2}>2 Credits (Minor Project)</option>
                                            <option value={4}>4 Credits (Major Capstone)</option>
                                            <option value={6}>6 Credits (B.Tech Thesis)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-on-surface mb-1">Min Team Size</label>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="5"
                                            value={settings.min_team_size || 2} 
                                            onChange={e => setSettings({ ...settings, min_team_size: Number(e.target.value) })} 
                                            className="w-full px-3 py-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-xs focus:ring-2 focus:ring-tertiary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-on-surface mb-1">Max Team Size</label>
                                        <input 
                                            type="number" 
                                            min="2" 
                                            max="8"
                                            value={settings.max_team_size || 4} 
                                            onChange={e => setSettings({ ...settings, max_team_size: Number(e.target.value) })} 
                                            className="w-full px-3 py-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-xs focus:ring-2 focus:ring-tertiary"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-medium text-on-surface cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={!!settings.require_field_pilot} 
                                            onChange={e => setSettings({ ...settings, require_field_pilot: e.target.checked })} 
                                            className="rounded text-tertiary focus:ring-tertiary w-4 h-4"
                                        />
                                        <span>Require 75% on-ground field pilot verification prior to degree credit sign-off</span>
                                    </label>
                                </div>
                            </div>

                            {/* Automation & CSR Matching */}
                            <div className="space-y-3 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm">sync_saved_locally</span>
                                    3. CSR Matching &amp; Alert Dispatch
                                </h4>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-medium text-on-surface cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={!!settings.auto_csr_matching} 
                                            onChange={e => setSettings({ ...settings, auto_csr_matching: e.target.checked })} 
                                            className="rounded text-tertiary focus:ring-tertiary w-4 h-4"
                                        />
                                        <span>Automatically submit eligible student capstones to Tata Steel &amp; CCL CSR marketplace</span>
                                    </label>

                                    <label className="flex items-center gap-2 text-xs font-medium text-on-surface cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={!!settings.notify_new_civic_issues} 
                                            onChange={e => setSettings({ ...settings, notify_new_civic_issues: e.target.checked })} 
                                            className="rounded text-tertiary focus:ring-tertiary w-4 h-4"
                                        />
                                        <span>Send instant portal alerts when Municipal Corporation routes critical Ward problems</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
                                <button 
                                    type="button" 
                                    onClick={() => setSettingsModalOpen(false)} 
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={savingSettings} 
                                    className="px-5 py-2 rounded-xl bg-tertiary text-on-tertiary text-xs font-bold hover:bg-tertiary/90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                                >
                                    {savingSettings ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : <span className="material-symbols-outlined text-sm">save</span>}
                                    Save University Configuration
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* FACULTY & LAB ASSIGNMENT MODAL */}
            {assignModalOpen && selectedProblemForAssign && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/30">
                        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-on-surface font-headline-sm">Assign Faculty Guide &amp; Lab</h3>
                                <p className="text-xs text-on-surface-variant truncate max-w-xs">{selectedProblemForAssign.title || selectedProblemForAssign.description}</p>
                            </div>
                            <button type="button" onClick={() => setAssignModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleAssignFaculty} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-on-surface mb-1">Select Faculty Research Guide</label>
                                <select 
                                    value={selectedFaculty} 
                                    onChange={e => setSelectedFaculty(e.target.value)}
                                    className="w-full px-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs font-semibold focus:ring-2 focus:ring-tertiary"
                                >
                                    {(facultyMentors.length > 0 ? facultyMentors : [
                                        { name: "Dr. B. K. Singh (IoT & Sensor Firmware)" },
                                        { name: "Prof. S. Soren (GIS & Water Treatment)" },
                                        { name: "Dr. Ananya Mukherjee (Biotech & Waste)" },
                                        { name: "Dr. R. K. Mishra (Smart Grids)" }
                                    ]).map((f: any, idx: number) => (
                                        <option key={idx} value={f.name}>{f.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-on-surface mb-1">Designate R&amp;D Prototyping Facility</label>
                                <select 
                                    value={selectedLab} 
                                    onChange={e => setSelectedLab(e.target.value)}
                                    className="w-full px-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs font-semibold focus:ring-2 focus:ring-tertiary"
                                >
                                    {(labs.length > 0 ? labs : [
                                        { name: "Center of Excellence in Water & GIS Telemetry (Lab 204)" },
                                        { name: "Edge-AI & Computer Vision Prototyping Facility (Lab 108)" },
                                        { name: "Clean Energy & Microgrid Simulation Cell (Lab 312)" }
                                    ]).map((l: any, idx: number) => (
                                        <option key={idx} value={l.name}>{l.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
                                <button type="button" onClick={() => setAssignModalOpen(false)} className="px-3 py-1.5 text-xs text-on-surface-variant font-semibold">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-tertiary text-on-tertiary rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all">
                                    Confirm Assignment
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* PROBLEM DOSSIER DETAIL MODAL */}
            {detailModalOpen && selectedProblemDetail && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-outline-variant/30 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-3">
                            <div>
                                <span className="text-[10px] font-mono font-bold uppercase text-tertiary">Civic Problem Dossier #{selectedProblemDetail.id}</span>
                                <h3 className="text-base font-bold text-on-surface">{selectedProblemDetail.title || selectedProblemDetail.description?.slice(0, 45)}</h3>
                            </div>
                            <button type="button" onClick={() => setDetailModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <h4 className="font-semibold text-on-surface-variant mb-1">Problem Description</h4>
                                <p className="text-on-surface bg-surface-container-low p-3 rounded-xl">{selectedProblemDetail.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 bg-surface-container-low p-3 rounded-xl">
                                <div>
                                    <span className="text-[10px] text-on-surface-variant block">Category</span>
                                    <span className="font-bold text-on-surface">{selectedProblemDetail.category}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-on-surface-variant block">Assigned Dept</span>
                                    <span className="font-bold text-on-surface">{selectedProblemDetail.assigned_department || "Civil & Environmental"}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-on-surface-variant block">Ward GPS Location</span>
                                    <span className="font-mono text-on-surface">{selectedProblemDetail.gps_lat || 23.337}°, {selectedProblemDetail.gps_lon || 85.321}°</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-on-surface-variant block">AI Innovation Filter</span>
                                    <span className="font-bold text-emerald-700">Verified Capstone</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-4 border-t border-outline-variant/20 mt-4">
                            <button type="button" onClick={() => setDetailModalOpen(false)} className="px-4 py-2 bg-surface-container text-on-surface rounded-xl text-xs font-semibold">
                                Close Dossier
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ACADEMIC CREDIT APPROVAL MODAL */}
            {creditApprovalModalOpen && selectedProjectForCredit && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/30 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                            <span className="material-symbols-outlined text-2xl">verified</span>
                        </div>
                        <h3 className="text-base font-bold text-on-surface">Certify 4 Academic Credits</h3>
                        <p className="text-xs text-on-surface-variant mt-1 mb-4">
                            You are about to approve <strong>4 Academic Capstone Credits</strong> for:
                            <br />
                            <span className="font-bold text-on-surface">"{selectedProjectForCredit.title}"</span>
                            <br />
                            Led by <strong>{selectedProjectForCredit.team_leader}</strong>
                        </p>

                        <div className="bg-surface-container-low p-3 rounded-xl text-left text-xs mb-4 space-y-1">
                            <p className="flex items-center gap-1 text-emerald-800 font-medium">
                                <span className="material-symbols-outlined text-sm">check</span>
                                100% Milestone &amp; Ground Pilot Completed
                            </p>
                            <p className="flex items-center gap-1 text-emerald-800 font-medium">
                                <span className="material-symbols-outlined text-sm">check</span>
                                APAAR Digital Student Credentials Authenticated
                            </p>
                            <p className="flex items-center gap-1 text-emerald-800 font-medium">
                                <span className="material-symbols-outlined text-sm">check</span>
                                Transcripts synced with DigiLocker Academic Bank
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                            <button type="button" onClick={() => setCreditApprovalModalOpen(false)} className="px-4 py-2 bg-surface-container text-on-surface rounded-xl text-xs font-semibold">
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                onClick={handleApproveCredits} 
                                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
                            >
                                Confirm &amp; Award Credits
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Bottom Nav Bar */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] border-t border-outline-variant/20">
                {[
                    { label: 'Overview', icon: 'dashboard', action: () => { setActiveTab("problems"); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
                    { label: 'Capstones', icon: 'assignment_turned_in', action: () => { setActiveTab("capstones"); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
                    { label: 'Faculty', icon: 'domain', action: () => { setActiveTab("faculty"); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
                    { label: 'Leaderboard', icon: 'emoji_events', action: () => { setActiveTab("leaderboard"); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
                    { label: 'Settings', icon: 'settings', action: () => setSettingsModalOpen(true) }
                ].map(nav => (
                    <button 
                        key={nav.label} 
                        type="button" 
                        onClick={nav.action}
                        className={`flex flex-col items-center min-w-[48px] py-1 transition-all cursor-pointer ${
                            (nav.label === 'Overview' && activeTab === 'problems') ||
                            (nav.label === 'Capstones' && activeTab === 'capstones') ||
                            (nav.label === 'Faculty' && activeTab === 'faculty') ||
                            (nav.label === 'Leaderboard' && activeTab === 'leaderboard')
                                ? 'text-tertiary font-bold' 
                                : 'text-on-surface-variant hover:text-tertiary'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]" data-icon={nav.icon}>{nav.icon}</span>
                        <span className="text-[10px] font-bold mt-0.5">{nav.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}
