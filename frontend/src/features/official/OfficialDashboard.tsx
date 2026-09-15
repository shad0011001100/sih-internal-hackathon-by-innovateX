// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../context/ToastContext";
import { safeFetch } from "../../services/api";

export default function OfficialDashboard() {
    const [activeTab, setActiveTab] = useState("Overview"); // Overview | Reports | Submissions | GIS Map
    const [reports, setReports] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [filter, setFilter] = useState("All");
    const [deadlineFilter, setDeadlineFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [mutatingId, setMutatingId] = useState(null);
    const [error, setError] = useState(null);

    // Selected Ward for GIS Map
    const [selectedWardData, setSelectedWardData] = useState({
        ward: "Ward 4",
        num: "4",
        locality: "Doranda & Tribal Hostel",
        reportsCount: 8,
        status: "Active Field Work",
        coordinates: "23.3372° N, 85.3211° E",
        landmarks: "Doranda Main Market, AG Office, Nepal House",
        activeIssues: [
            "Contaminated municipal tap water pipeline rupture behind Main Road Market",
            "Stormwater drainage siltation near High Court colony",
            "Pedestrian footpath pavement cracks"
        ],
        assignedAgency: "Civil & Environmental Engineering (BIT Mesra) + RMC Div 2"
    });

    // Assign Modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const [universityId, setUniversityId] = useState("1");
    const [department, setDepartment] = useState("Civil & Environmental Engineering");
    const [facultyMentor, setFacultyMentor] = useState("Prof. S. Soren (GIS Ward Mapping & Water Treatment)");
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [officialSettings, setOfficialSettings] = useState({
        officerName: "Er. Rameshwar Mahto (IAS)",
        department: "Ranchi Municipal Corporation (Urban Development & Grievance Cell)",
        wardZone: "All 12 RMC Wards",
        slaThresholdHours: 48,
        autoEscalation: true,
        smsAlertsCritical: true,
        aiTriageConfidence: 80,
        emergencyHotline: "+91 651 220 8555",
        nodalEmail: "commissioner.rmc@jharkhand.gov.in"
    });

    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);
    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [reportsData, subsData] = await Promise.all([
                safeFetch("/api/admin/reports"),
                safeFetch("/api/admin/submissions")
            ]);
            setReports(Array.isArray(reportsData) ? reportsData : []);
            setSubmissions(Array.isArray(subsData) ? subsData : []);
        } catch (e) {
            console.error(e);
            setError(e.message || "Failed to load official records");
            showToast("Failed to fetch reports/submissions", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await safeFetch("/api/auth/logout", { method: "POST" });
            showToast("Logged out successfully", "info");
        } catch (e) {
            console.error(e);
            showToast("Logout failed", "error");
        } finally {
            setLoading(false);
            logout();
            navigate("/");
        }
    };

    const updateReportStatus = async (id, status) => {
        setMutatingId(id);
        setSubmitting(true);
        try {
            await safeFetch(`/api/admin/reports/${id}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            showToast(`Report #${id} status updated to ${status.replace("_", " ")}`, "success");
            setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        } catch (e) {
            console.error(e);
            showToast(e.message || "Failed to update status", "error");
        } finally {
            setMutatingId(null);
            setSubmitting(false);
        }
    };

    const assignReport = async (e) => {
        e.preventDefault();
        if (!selectedReportId) return;
        setSubmitting(true);
        try {
            await safeFetch(`/api/admin/reports/${selectedReportId}/assign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    university_id: parseInt(universityId), 
                    department,
                    faculty_mentor: facultyMentor 
                })
            });
            showToast(`Grievance #${selectedReportId} assigned to University #${universityId} (${department})`, "success");
            setReports(prev => prev.map(r => r.id === selectedReportId ? { 
                ...r, 
                status: "assigned", 
                assigned_university_id: parseInt(universityId), 
                assigned_department: department,
                faculty_mentor: facultyMentor 
            } : r));
            setShowAssignModal(false);
        } catch (e) {
            console.error(e);
            showToast(e.message || "Failed to assign report", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const reviewSubmission = async (id, action) => {
        setMutatingId(id);
        setSubmitting(true);
        try {
            await safeFetch(`/api/admin/submissions/${id}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, comments: "Reviewed via official portal" })
            });
            showToast(`Capstone submission #${id} ${action === "approve" ? "approved for deployment" : "revision requested"}`, "success");
            setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: action === "approve" ? "accepted" : "draft" } : s));
        } catch (e) {
            console.error(e);
            showToast(e.message || `Failed to ${action} submission`, "error");
        } finally {
            setMutatingId(null);
            setSubmitting(false);
        }
    };

    const implementProject = async (id) => {
        setMutatingId(id);
        setSubmitting(true);
        try {
            await safeFetch(`/api/admin/submissions/${id}/implement`, { method: "POST" });
            showToast(`Project #${id} verified on ground! Handover complete.`, "success");
            setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: "completed" } : s));
        } catch (e) {
            console.error(e);
            showToast(e.message || "Implementation update failed", "error");
        } finally {
            setMutatingId(null);
            setSubmitting(false);
        }
    };

    const handleSaveOfficialSettings = (e) => {
        e.preventDefault();
        showToast("Municipal settings & SLA thresholds updated successfully!", "success");
        setSettingsModalOpen(false);
    };

    const stats = {
        total: reports.length,
        pendingReview: reports.filter(r => r.status === "under_review").length,
        validatedToday: reports.filter(r => r.status === "validated").length,
        implemented: reports.filter(r => r.status === "implemented").length,
        inProgress: reports.filter(r => r.status === "in_progress" || r.status === "assigned").length
    };

    const filterTabs = ["All", "Reported", "Validated", "Assigned", "In Progress", "Under Review", "Implemented"];

    const filteredReports = filter === "All" 
        ? reports 
        : reports.filter(r => r.status.toLowerCase().replace("_", " ") === filter.toLowerCase());

    const getStatusColor = (status) => {
        switch (status) {
            case "reported": return "bg-error";
            case "validated": return "bg-primary";
            case "assigned": return "bg-secondary";
            case "in_progress": return "bg-amber-500";
            case "under_review": return "bg-tertiary";
            case "implemented": return "bg-emerald-600";
            default: return "bg-outline";
        }
    };

    const renderActionBtn = (report) => {
        const isMutatingThis = mutatingId === report.id;
        switch(report.status) {
            case "reported":
                return (
                    <button 
                        type="button" 
                        disabled={isMutatingThis} 
                        onClick={() => updateReportStatus(report.id, "validated")} 
                        className="px-4 py-1.5 bg-primary text-on-primary rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                        {isMutatingThis && <span className="material-symbols-outlined animate-spin text-[14px]">refresh</span>}
                        Validate
                    </button>
                );
            case "validated":
                return (
                    <button 
                        type="button" 
                        disabled={isMutatingThis} 
                        onClick={() => { setSelectedReportId(report.id); setShowAssignModal(true); }} 
                        className="px-4 py-1.5 bg-secondary text-on-secondary rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                        Assign
                    </button>
                );
            case "assigned":
                return (
                    <button 
                        type="button" 
                        disabled={isMutatingThis} 
                        onClick={() => updateReportStatus(report.id, "in_progress")} 
                        className="px-4 py-1.5 bg-tertiary text-on-tertiary rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                        {isMutatingThis && <span className="material-symbols-outlined animate-spin text-[14px]">refresh</span>}
                        Start Work
                    </button>
                );
            case "in_progress":
                return (
                    <button 
                        type="button" 
                        disabled={isMutatingThis} 
                        onClick={() => updateReportStatus(report.id, "under_review")} 
                        className="px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                        {isMutatingThis && <span className="material-symbols-outlined animate-spin text-[14px]">refresh</span>}
                        Send to Review
                    </button>
                );
            case "under_review":
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-tertiary/15 text-tertiary text-xs font-bold">
                        <span className="material-symbols-outlined text-[15px]">hourglass_top</span>
                        Under Review (Evaluating Delivery)
                    </span>
                );
            case "implemented":
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
                        Handover Complete
                    </span>
                );
            default:
                return null;
        }
    };

    // Graphical Ward Zones Data for Ranchi SVG Map
    const wardZones = [
        { id: "w1", num: "1", name: "Ward 1", locality: "Kanke & CMPDI", x: 230, y: 70, cx: 230, cy: 90, r: 8, reports: 2, status: "Routine", color: "#10b981", d: "M 150 40 L 310 40 L 330 110 L 170 120 Z" },
        { id: "w2", num: "2", name: "Ward 2", locality: "Morabadi & Ground", x: 420, y: 75, cx: 420, cy: 95, r: 10, reports: 3, status: "Active Triage", color: "#0ea5e9", d: "M 330 40 L 510 40 L 500 120 L 340 120 Z" },
        { id: "w3", num: "3", name: "Ward 3", locality: "Bariatu & RIMS Hospital", x: 610, y: 80, cx: 610, cy: 100, r: 12, reports: 5, status: "Approaching", color: "#f59e0b", d: "M 520 40 L 700 50 L 680 130 L 510 120 Z" },
        { id: "w6", num: "6", name: "Ward 6", locality: "Lalpur & Circular Road", x: 380, y: 170, cx: 380, cy: 180, r: 10, reports: 4, status: "Routine", color: "#0ea5e9", d: "M 320 130 L 480 130 L 460 210 L 300 210 Z" },
        { id: "w8", num: "8", name: "Ward 8", locality: "Kokar Industrial Area", x: 580, y: 170, cx: 580, cy: 180, r: 12, reports: 4, status: "Approaching", color: "#f59e0b", d: "M 490 130 L 680 140 L 650 220 L 480 210 Z" },
        { id: "w11", num: "11", name: "Ward 11", locality: "Ratu Road & Pandra", x: 180, y: 180, cx: 180, cy: 190, r: 12, reports: 6, status: "Approaching", color: "#f59e0b", d: "M 100 130 L 290 130 L 280 230 L 90 220 Z" },
        { id: "w9", num: "9", name: "Ward 9", locality: "Harmu Housing Colony", x: 200, y: 280, cx: 200, cy: 290, r: 9, reports: 2, status: "Routine", color: "#10b981", d: "M 100 240 L 280 240 L 260 330 L 80 320 Z" },
        { id: "w4", num: "4", name: "Ward 4", locality: "Doranda & Main Road", x: 380, y: 270, cx: 380, cy: 280, r: 14, reports: 8, status: "Urgent Attention", color: "#ef4444", d: "M 290 220 L 480 220 L 460 320 L 280 320 Z" },
        { id: "w5", num: "5", name: "Ward 5", locality: "Hinoo & Birsa Airport", x: 380, y: 370, cx: 380, cy: 380, r: 10, reports: 3, status: "Routine", color: "#0ea5e9", d: "M 270 330 L 460 330 L 440 430 L 250 420 Z" },
        { id: "w10", num: "10", name: "Ward 10", locality: "Dhurwa & Smart City", x: 190, y: 380, cx: 190, cy: 390, r: 9, reports: 3, status: "Routine", color: "#10b981", d: "M 80 330 L 260 340 L 240 440 L 60 430 Z" },
        { id: "w12", num: "12", name: "Ward 12", locality: "Hatia & Jagannathpur", x: 570, y: 280, cx: 570, cy: 290, r: 11, reports: 4, status: "Active Field Work", color: "#0ea5e9", d: "M 480 220 L 660 230 L 640 330 L 470 320 Z" },
        { id: "w7", num: "7", name: "Ward 7", locality: "Ring Road & Tupudana", x: 560, y: 380, cx: 560, cy: 390, r: 13, reports: 7, status: "Urgent Attention", color: "#ef4444", d: "M 460 330 L 650 340 L 630 450 L 440 440 Z" }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background text-on-background selection:bg-secondary selection:text-white">
            {/* Header */}
            <header className="bg-secondary sticky top-0 z-40 shadow-md border-b border-secondary-container/40">
                <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-2xl" data-icon="shield">shield</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                Official Portal
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-mono font-bold">
                                    Jharkhand Gov
                                </span>
                            </h1>
                            <p className="text-[11px] text-white/80 font-medium">Urban Development &amp; Grievance Redressal Command</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSettingsModalOpen(true)}
                            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-white/10"
                            title="Municipal Official Settings"
                        >
                            <span className="material-symbols-outlined text-sm">settings</span>
                            <span className="hidden sm:inline">Settings</span>
                        </button>
                        <button 
                            type="button" 
                            onClick={handleLogout} 
                            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer active:scale-95 transition-all"
                            aria-label="Logout"
                        >
                            <span className="material-symbols-outlined text-sm" data-icon="logout">logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Page Navigation Tabs */}
            <div className="bg-surface-container-low px-4 pt-3 border-b border-outline-variant/30 sticky top-16 z-30 shadow-xs">
                <div className="max-w-[1200px] mx-auto flex gap-4 md:gap-8 overflow-x-auto no-scrollbar">
                    {[
                        { id: "Overview", label: "Executive Overview & Deadlines", icon: "dashboard" },
                        { id: "Reports", label: "Grievances Queue", icon: "assignment", count: reports.length },
                        { id: "Submissions", label: "Student Capstones", icon: "school", count: submissions.length },
                        { id: "GIS Map", label: "Graphical GIS Map", icon: "map" },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 px-1 text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
                                activeTab === tab.id 
                                    ? "border-secondary text-secondary" 
                                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                                    activeTab === tab.id ? "bg-secondary text-white" : "bg-surface-container-high text-on-surface-variant"
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-6 pb-24">
                {error && (
                    <div className="mb-4 p-4 rounded-2xl bg-error-container text-on-error-container flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-xl" data-icon="error">error</span>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={fetchData} 
                            className="px-3 py-1 bg-surface-container-lowest text-on-surface rounded-lg text-xs font-bold hover:bg-surface-variant cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* TAB 1: EXECUTIVE OVERVIEW & PROVIDER DEADLINES */}
                {activeTab === "Overview" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* AI Executive Briefing Banner */}
                        <div className="p-5 rounded-3xl bg-gradient-to-r from-secondary/10 via-primary/5 to-surface-container-low border border-secondary/25 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-secondary text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <span className="material-symbols-outlined text-2xl">neurology</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-secondary">AI Morning Triage Summary</span>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">Live Synced</span>
                                    </div>
                                    <h2 className="text-base font-bold text-on-surface mt-0.5">Municipal Commissioner Daily Operational Brief</h2>
                                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-2xl">
                                        3 high-urgency bottlenecks detected in Morabadi and Doranda. 2 student engineering prototypes ready for municipal field deployment. 0 provider SLAs currently overdue.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveTab("Reports")}
                                className="px-4 py-2 rounded-xl bg-secondary text-white text-xs font-bold hover:opacity-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                                <span>Inspect Grievances Queue</span>
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>

                        {/* Top Telemetry KPIs */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col">
                                <span className="text-on-surface-variant text-xs font-semibold">Validated Today</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                    <span className="text-2xl font-bold font-mono">{stats.validatedToday}</span>
                                </div>
                                <span className="text-[10px] text-primary mt-1 font-medium">Ready for University Assign</span>
                            </div>
                            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col">
                                <span className="text-on-surface-variant text-xs font-semibold">Active In-Progress</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    <span className="text-2xl font-bold font-mono">{stats.inProgress}</span>
                                </div>
                                <span className="text-[10px] text-on-surface-variant mt-1 font-medium">Student pilots &amp; crews</span>
                            </div>
                            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col">
                                <span className="text-on-surface-variant text-xs font-semibold">Under Evaluation</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-tertiary" />
                                    <span className="text-2xl font-bold font-mono">{stats.pendingReview}</span>
                                </div>
                                <span className="text-[10px] text-tertiary mt-1 font-medium">Awaiting ground verification</span>
                            </div>
                            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col">
                                <span className="text-on-surface-variant text-xs font-semibold">Handover Completed</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                                    <span className="text-2xl font-bold font-mono">{stats.implemented}</span>
                                </div>
                                <span className="text-[10px] text-emerald-700 mt-1 font-medium">Real-world impact verified</span>
                            </div>
                        </div>

                        {/* PROVIDER DEADLINES TRACKER SECTION */}
                        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/30 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-outline-variant/20">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-secondary text-xl">event_upcoming</span>
                                        <h3 className="text-base font-bold text-on-surface">Target Resolution Deadlines</h3>
                                        <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-bold uppercase">
                                            Provider Set
                                        </span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant mt-0.5">
                                        Deadlines defined directly by problem statement providers (Resident Welfare, Ward Committees, Local Panchayats)
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                                    {["All", "Urgent", "Approaching", "On Track"].map(df => (
                                        <button
                                            key={df}
                                            type="button"
                                            onClick={() => setDeadlineFilter(df)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                                deadlineFilter === df 
                                                    ? "bg-secondary text-white" 
                                                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                            }`}
                                        >
                                            {df}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {reports.filter(r => {
                                    if (deadlineFilter === "All") return true;
                                    if (deadlineFilter === "Urgent") return r.urgency === "Urgent Attention";
                                    if (deadlineFilter === "Approaching") return r.urgency === "Standard Priority";
                                    return r.urgency === "Routine" || r.status === "implemented";
                                }).map(r => (
                                    <div key={r.id} className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3 hover:border-secondary/40 transition-all">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{r.category}</span>
                                                <h4 className="text-sm font-bold text-on-surface line-clamp-1 mt-0.5">{r.challenge_summary || r.description}</h4>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                                r.urgency === "Urgent Attention" ? "bg-error/15 text-error" :
                                                r.urgency === "Standard Priority" ? "bg-amber-500/15 text-amber-700" :
                                                "bg-emerald-500/15 text-emerald-700"
                                            }`}>
                                                {r.urgency || "Standard"}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20">
                                            <div>
                                                <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Set by Provider:</span>
                                                <span className="font-semibold text-on-surface line-clamp-1">{r.provider_name || "Ranchi Residents Forum"}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Target Date:</span>
                                                <span className="font-mono font-bold text-secondary flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">schedule</span>
                                                    {r.target_resolution_date || r.provider_deadline || "In 7 Days"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 text-xs">
                                            <span className="text-[11px] text-on-surface-variant">
                                                Assigned: <strong>{r.assigned_department ? "BIT Mesra (Civil)" : "RMC Quick Response"}</strong>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveTab("Reports");
                                                    setFilter("All");
                                                    showToast(`Viewing grievance #${r.id} in Reports queue`, "info");
                                                }}
                                                className="text-secondary hover:underline font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                                            >
                                                <span>Manage</span>
                                                <span className="material-symbols-outlined text-xs">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* TAB 2: GRIEVANCES QUEUE */}
                {activeTab === "Reports" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                            {filterTabs.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFilter(t)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
                                        filter === t 
                                            ? "bg-secondary text-white shadow-xs" 
                                            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* Reports List */}
                        <div className="space-y-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <span className="material-symbols-outlined animate-spin text-secondary text-3xl">refresh</span>
                                </div>
                            ) : null}
                            {!loading && filteredReports.length === 0 ? (
                                <p className="text-center py-8 text-on-surface-variant text-sm bg-surface-container-low rounded-3xl">No grievances found under this filter.</p>
                            ) : null}
                            
                            <AnimatePresence>
                                {!loading && filteredReports.map(report => (
                                    <motion.article 
                                        key={report.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/20 flex gap-4 overflow-hidden relative hover:border-secondary/30 transition-all"
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getStatusColor(report.status)}`} />
                                        <div className="flex-1 min-w-0 pl-1 space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-secondary bg-secondary/10 px-2.5 py-0.5 rounded-md">
                                                        {report.category}
                                                    </span>
                                                    <span className="text-[11px] font-mono text-on-surface-variant">
                                                        Ward {report.ward_no || 14} · Ranchi
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-mono text-outline">
                                                    {new Date(report.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div>
                                                <p className="text-sm font-bold text-on-surface">{report.description}</p>
                                                {report.challenge_summary && (
                                                    <p className="text-xs text-on-surface-variant mt-1 bg-surface-container-low p-2.5 rounded-xl">
                                                        {report.challenge_summary}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Provider Deadline & Urgency */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-outline-variant/20">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                                                        (report.urgency === "Urgent Attention" || report.priority_score > 85)
                                                            ? "bg-error/15 text-error"
                                                            : "bg-secondary/15 text-secondary"
                                                    }`}>
                                                        <span className="material-symbols-outlined text-[13px]">
                                                            {(report.urgency === "Urgent Attention" || report.priority_score > 85) ? "warning" : "info"}
                                                        </span>
                                                        {report.urgency || "Standard Priority"}
                                                    </span>

                                                    {report.provider_name && (
                                                        <span className="text-[11px] text-on-surface-variant">
                                                            Provider: <strong>{report.provider_name}</strong>
                                                        </span>
                                                    )}

                                                    {report.target_resolution_date && (
                                                        <span className="text-[11px] font-mono text-secondary font-bold">
                                                            Target: {report.target_resolution_date}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-semibold text-outline uppercase">
                                                        {report.status.replace("_", " ")}
                                                    </span>
                                                    {renderActionBtn(report)}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.article>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {/* TAB 3: STUDENT CAPSTONES & SUBMISSIONS */}
                {activeTab === "Submissions" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-on-surface">Student Engineering Solutions</h3>
                                <p className="text-xs text-on-surface-variant">Review prototypes submitted by Jharkhand collegiate innovators. Students earn academic credits upon municipal rollout.</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-secondary text-white font-mono text-xs font-bold">
                                {submissions.length} Total
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <span className="material-symbols-outlined animate-spin text-secondary text-3xl">refresh</span>
                            </div>
                        ) : null}
                        {!loading && submissions.length === 0 ? (
                            <p className="text-center py-8 text-on-surface-variant text-sm bg-surface-container-low rounded-3xl">No submissions pending.</p>
                        ) : null}
                        
                        {!loading && submissions.map(sub => (
                            <article key={sub.id} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-base font-bold text-on-surface">{sub.title}</h4>
                                        <span className="text-xs text-on-surface-variant">Team #{sub.team_id}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-outline uppercase font-bold px-2 py-0.5 rounded-full bg-surface-container">
                                        {sub.status}
                                    </span>
                                </div>
                                <p className="text-xs text-on-surface-variant leading-relaxed">{sub.description}</p>
                                
                                {/* Student Profile & Social Links */}
                                <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/25 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-xs">
                                            <span className="material-symbols-outlined text-base">school</span>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-on-surface block">
                                                {sub.student_name || "Aravind Kumar"} ({sub.student_institution || "BIT Mesra"})
                                            </span>
                                            <span className="text-[10px] text-on-surface-variant">Student Capstone Lead</span>
                                        </div>
                                    </div>

                                    {/* Direct LinkedIn & GitHub Badges for Official Review */}
                                    <div className="flex items-center gap-2">
                                        {sub.linkedin_url && (
                                            <a 
                                                href={sub.linkedin_url} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0077b5]/10 text-[#0077b5] text-xs font-bold hover:bg-[#0077b5]/20 transition-all"
                                                title="View Student LinkedIn Profile"
                                            >
                                                <span className="text-[10px] font-mono">in</span>
                                                <span>LinkedIn</span>
                                                <span className="material-symbols-outlined text-xs">open_in_new</span>
                                            </a>
                                        )}
                                        {sub.github_url && (
                                            <a 
                                                href={sub.github_url} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container-highest text-on-surface text-xs font-bold hover:bg-surface-container transition-all border border-outline-variant/30"
                                                title="View Student GitHub Repository"
                                            >
                                                <span className="material-symbols-outlined text-xs">code</span>
                                                <span>GitHub</span>
                                                <span className="material-symbols-outlined text-xs">open_in_new</span>
                                            </a>
                                        )}
                                        {sub.documentation_url && (
                                            <a href={sub.documentation_url} target="_blank" rel="noreferrer" className="text-secondary font-semibold text-xs flex items-center gap-1 hover:underline">
                                                <span className="material-symbols-outlined text-sm">description</span> Docs
                                            </a>
                                        )}
                                        {sub.prototype_url && (
                                            <a href={sub.prototype_url} target="_blank" rel="noreferrer" className="text-primary font-semibold text-xs flex items-center gap-1 hover:underline">
                                                <span className="material-symbols-outlined text-sm">open_in_new</span> Prototype
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end border-t border-outline-variant/20 pt-3">
                                    {sub.status === "submitted" && (
                                        <>
                                            <button 
                                                type="button"
                                                disabled={mutatingId === sub.id} 
                                                onClick={() => reviewSubmission(sub.id, "reject")} 
                                                className="px-4 py-1.5 bg-error-container text-on-error-container rounded-full text-xs font-bold active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                            >
                                                {mutatingId === sub.id && <span className="material-symbols-outlined animate-spin text-[14px]">refresh</span>}
                                                Request Revision
                                            </button>
                                            <button 
                                                type="button"
                                                disabled={mutatingId === sub.id} 
                                                onClick={() => reviewSubmission(sub.id, "approve")} 
                                                className="px-4 py-1.5 bg-secondary text-on-secondary rounded-full text-xs font-bold active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                                            >
                                                {mutatingId === sub.id && <span className="material-symbols-outlined animate-spin text-[14px]">refresh</span>}
                                                Approve Capstone
                                            </button>
                                        </>
                                    )}
                                    {sub.status === "accepted" && (
                                        <div className="w-full flex items-center justify-between pt-1">
                                            <div className="flex items-center gap-1 text-xs text-secondary font-semibold">
                                                <span className="material-symbols-outlined text-sm">engineering</span>
                                                <span>Field Pilot Approved · Ready for Municipal Handover</span>
                                            </div>
                                            <button 
                                                type="button"
                                                disabled={mutatingId === sub.id} 
                                                onClick={() => implementProject(sub.id)} 
                                                className="px-4 py-1.5 bg-secondary text-white rounded-full text-xs font-bold active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer shadow-xs"
                                            >
                                                {mutatingId === sub.id && <span className="material-symbols-outlined animate-spin text-[14px]">refresh</span>}
                                                <span className="material-symbols-outlined text-sm">verified</span>
                                                Verify Ground Handover
                                            </button>
                                        </div>
                                    )}
                                    {sub.status === "completed" && (
                                        <div className="w-full flex items-center justify-between pt-1">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                                Ground Implementation Verified &amp; Handover Complete
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </motion.div>
                )}

                {/* TAB 4: GRAPHICAL INTERACTIVE GIS MAP */}
                {activeTab === "GIS Map" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Graphical Vector Map Container */}
                            <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-outline-variant/30 space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-secondary">explore</span>
                                            <h3 className="text-base font-bold text-on-surface">Ranchi Municipal Corporation GIS Spatial Map</h3>
                                        </div>
                                        <p className="text-xs text-on-surface-variant">Click any ward zone or telemetry node to inspect ground activity</p>
                                    </div>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-bold">
                                        12 Active Wards
                                    </span>
                                </div>

                                {/* Graphical SVG Map */}
                                <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50 p-2">
                                    <svg viewBox="0 0 760 480" className="w-full h-auto drop-shadow-md select-none">
                                        {/* Background Grid Lines */}
                                        <defs>
                                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                            </pattern>
                                            <linearGradient id="riverGrad" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                                                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
                                            </linearGradient>
                                        </defs>
                                        <rect width="760" height="480" fill="url(#grid)" />

                                        {/* Subarnarekha River Vector Curve */}
                                        <path 
                                            d="M 20 180 Q 220 160 380 230 T 740 240" 
                                            fill="none" 
                                            stroke="url(#riverGrad)" 
                                            strokeWidth="14" 
                                            strokeLinecap="round" 
                                            opacity="0.8" 
                                        />
                                        <text x="560" y="235" fill="#7dd3fc" fontSize="11" fontWeight="bold" fontFamily="monospace">
                                            ~ Subarnarekha River ~
                                        </text>

                                        {/* Ring Road Arterial Highway */}
                                        <ellipse 
                                            cx="380" 
                                            cy="240" 
                                            rx="340" 
                                            ry="200" 
                                            fill="none" 
                                            stroke="rgba(148, 163, 184, 0.3)" 
                                            strokeWidth="3" 
                                            strokeDasharray="6,6" 
                                        />
                                        <text x="320" y="32" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
                                            Ranchi Ring Road Corridor (NH-33 Outer Ring)
                                        </text>

                                        {/* 12 Ward Polygons & Markers */}
                                        {wardZones.map(zone => {
                                            const isSelected = selectedWardData?.num === zone.num;
                                            return (
                                                <g 
                                                    key={zone.id} 
                                                    onClick={() => setSelectedWardData({
                                                        ward: zone.name,
                                                        num: zone.num,
                                                        locality: zone.locality,
                                                        reportsCount: zone.reports,
                                                        status: zone.status,
                                                        coordinates: `23.${3000 + parseInt(zone.num) * 80}° N, 85.${3100 + parseInt(zone.num) * 40}° E`,
                                                        landmarks: zone.locality,
                                                        activeIssues: [
                                                            `${zone.locality} municipal drainage inspection`,
                                                            `Ward ${zone.num} local water pressure monitoring`
                                                        ],
                                                        assignedAgency: "RMC Ward Division + University Partner"
                                                    })}
                                                    className="cursor-pointer transition-all"
                                                >
                                                    {/* Polygon Boundary */}
                                                    <path 
                                                        d={zone.d} 
                                                        fill={isSelected ? "rgba(99, 102, 241, 0.4)" : "rgba(30, 41, 59, 0.7)"} 
                                                        stroke={isSelected ? "#818cf8" : "rgba(100, 116, 139, 0.6)"} 
                                                        strokeWidth={isSelected ? "2.5" : "1.5"} 
                                                        className="hover:fill-indigo-900/50 transition-colors"
                                                    />

                                                    {/* Center Pin Glow */}
                                                    <circle 
                                                        cx={zone.cx} 
                                                        cy={zone.cy} 
                                                        r={isSelected ? "14" : "10"} 
                                                        fill={zone.color} 
                                                        opacity={isSelected ? "0.9" : "0.75"} 
                                                    />
                                                    <circle 
                                                        cx={zone.cx} 
                                                        cy={zone.cy} 
                                                        r={isSelected ? "18" : "14"} 
                                                        fill="none" 
                                                        stroke={zone.color} 
                                                        strokeWidth="1.5" 
                                                        opacity="0.5" 
                                                    />

                                                    {/* Text Label */}
                                                    <text 
                                                        x={zone.cx} 
                                                        y={zone.cy + 3.5} 
                                                        fill="#ffffff" 
                                                        fontSize="9" 
                                                        fontWeight="bold" 
                                                        textAnchor="middle" 
                                                        fontFamily="monospace"
                                                    >
                                                        W{zone.num}
                                                    </text>

                                                    <text 
                                                        x={zone.cx} 
                                                        y={zone.cy + 24} 
                                                        fill="#e2e8f0" 
                                                        fontSize="9" 
                                                        fontWeight="600" 
                                                        textAnchor="middle"
                                                    >
                                                        {zone.locality.split(" &")[0]}
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2">
                                    <div className="flex items-center gap-4 text-on-surface-variant text-[11px]">
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#10b981]"></span> Routine / Stable</span>
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#0ea5e9]"></span> Active Field Work</span>
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span> Approaching Deadline</span>
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#ef4444]"></span> Urgent Attention</span>
                                    </div>
                                    <span className="text-on-surface-variant font-mono text-[11px]">Vector Projection · WGS84</span>
                                </div>
                            </div>

                            {/* Ward Detail Inspection Panel */}
                            <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-outline-variant/30 space-y-4">
                                <div className="pb-3 border-b border-outline-variant/20">
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-secondary">Zonal Ward Telemetry</span>
                                    <h3 className="text-lg font-bold text-on-surface mt-0.5">{selectedWardData.ward}: {selectedWardData.locality}</h3>
                                    <p className="text-xs font-mono text-on-surface-variant mt-0.5">{selectedWardData.coordinates}</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                                        <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Active Grievances</span>
                                        <span className="text-xl font-bold font-mono text-on-surface">{selectedWardData.reportsCount} Cases</span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                                        <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Operational Status</span>
                                        <span className="text-xs font-bold text-secondary">{selectedWardData.status}</span>
                                    </div>

                                    <div>
                                        <span className="text-[11px] font-bold text-on-surface block mb-1">Key Landmarks:</span>
                                        <p className="text-xs text-on-surface-variant bg-surface-container-low p-2 rounded-xl">
                                            {selectedWardData.landmarks}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-[11px] font-bold text-on-surface block mb-1">Active Problem Statements:</span>
                                        <ul className="space-y-1 text-xs text-on-surface-variant">
                                            {selectedWardData.activeIssues.map((issue, idx) => (
                                                <li key={idx} className="flex items-start gap-1.5 p-2 rounded-lg bg-surface-container-low">
                                                    <span className="material-symbols-outlined text-sm text-secondary shrink-0 mt-0.5">adjust</span>
                                                    <span>{issue}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab("Reports");
                                        setFilter("All");
                                        showToast(`Filtering grievances for ${selectedWardData.ward}`, "info");
                                    }}
                                    className="w-full py-2.5 rounded-xl bg-secondary text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 transition-all shadow-xs cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-sm">filter_list</span>
                                    <span>Filter Grievances for {selectedWardData.ward}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Bottom Nav for Mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container-lowest/95 backdrop-blur-md shadow-lg border-t border-outline-variant/20">
                <button 
                    type="button"
                    onClick={() => setActiveTab("Overview")}
                    className={`flex flex-col items-center min-w-[44px] transition-colors cursor-pointer ${activeTab === "Overview" ? "text-secondary font-bold" : "text-on-surface-variant"}`}
                >
                    <span className="material-symbols-outlined text-[20px]">dashboard</span>
                    <span className="text-[9px] mt-0.5">Overview</span>
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab("Reports")}
                    className={`flex flex-col items-center min-w-[44px] transition-colors cursor-pointer ${activeTab === "Reports" ? "text-secondary font-bold" : "text-on-surface-variant"}`}
                >
                    <span className="material-symbols-outlined text-[20px]">assignment</span>
                    <span className="text-[9px] mt-0.5">Reports</span>
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab("Submissions")}
                    className={`flex flex-col items-center min-w-[44px] transition-colors cursor-pointer ${activeTab === "Submissions" ? "text-secondary font-bold" : "text-on-surface-variant"}`}
                >
                    <span className="material-symbols-outlined text-[20px]">school</span>
                    <span className="text-[9px] mt-0.5">Capstones</span>
                </button>
                <button 
                    type="button" 
                    onClick={() => setActiveTab("GIS Map")} 
                    className={`flex flex-col items-center min-w-[44px] transition-colors cursor-pointer ${activeTab === "GIS Map" ? "text-secondary font-bold" : "text-on-surface-variant"}`}
                >
                    <span className="material-symbols-outlined text-[20px]">map</span>
                    <span className="text-[9px] mt-0.5">GIS Map</span>
                </button>
            </nav>

            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/30">
                        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary text-xl">school</span>
                                <h3 className="text-base font-bold text-on-surface">Assign to Academic Institution</h3>
                            </div>
                            <button type="button" onClick={() => setShowAssignModal(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>
                        
                        <p className="text-xs text-on-surface-variant mb-4">
                            Route this grievance to a verified university department and designated faculty mentor for student capstone prototyping.
                        </p>

                        <form onSubmit={assignReport} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Partner University</label>
                                <select 
                                    required 
                                    value={universityId} 
                                    onChange={e => setUniversityId(e.target.value)} 
                                    className="w-full px-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:ring-2 focus:ring-secondary text-xs font-medium text-on-surface"
                                >
                                    <option value="1">BIT Mesra (Birla Institute of Technology) · Score 95.5</option>
                                    <option value="2">NIT Jamshedpur (National Institute of Technology) · Score 92.0</option>
                                    <option value="3">IIT (ISM) Dhanbad · Score 94.0</option>
                                    <option value="4">IIIT Ranchi · Score 89.5</option>
                                    <option value="5">Ranchi University · Score 86.0</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Academic Department</label>
                                <select 
                                    required 
                                    value={department} 
                                    onChange={e => setDepartment(e.target.value)} 
                                    className="w-full px-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:ring-2 focus:ring-secondary text-xs font-medium text-on-surface"
                                >
                                    <option value="Civil & Environmental Engineering">Civil &amp; Environmental Engineering (Water/Roads)</option>
                                    <option value="Computer Science & Engineering (AI/Software)">Computer Science &amp; Engineering (AI/IoT)</option>
                                    <option value="Electrical & Electronics Engineering">Electrical &amp; Electronics (Smart Grid/Sensors)</option>
                                    <option value="Water Resource Management & Public Health">Water Resource Management &amp; Public Health</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Faculty Mentor</label>
                                <input
                                    type="text"
                                    required
                                    value={facultyMentor}
                                    onChange={e => setFacultyMentor(e.target.value)}
                                    className="w-full px-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:ring-2 focus:ring-secondary text-xs font-medium text-on-surface"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                                <button type="button" disabled={submitting} onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-xs font-semibold text-on-surface-variant cursor-pointer">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl bg-secondary text-white text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                                    {submitting && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                                    {submitting ? "Assigning..." : "Confirm & Assign"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Official Settings & Policy Modal */}
            {settingsModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-outline-variant/30 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-secondary text-white flex items-center justify-center">
                                    <span className="material-symbols-outlined text-lg">settings</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-on-surface">Municipal Official Settings</h3>
                                    <p className="text-[11px] text-on-surface-variant">Configure ward jurisdictional routing &amp; escalation SLAs</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setSettingsModalOpen(false)} className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container cursor-pointer">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSaveOfficialSettings} className="space-y-4 pt-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Nodal Officer Name</label>
                                    <input 
                                        type="text"
                                        value={officialSettings.officerName}
                                        onChange={e => setOfficialSettings({ ...officialSettings, officerName: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:ring-2 focus:ring-secondary text-on-surface outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Department</label>
                                    <input 
                                        type="text"
                                        value={officialSettings.department}
                                        onChange={e => setOfficialSettings({ ...officialSettings, department: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:ring-2 focus:ring-secondary text-on-surface outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Resolution SLA Threshold Window</label>
                                    <select 
                                        value={officialSettings.slaThresholdHours}
                                        onChange={e => setOfficialSettings({ ...officialSettings, slaThresholdHours: Number(e.target.value) })}
                                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:ring-2 focus:ring-secondary text-on-surface outline-none cursor-pointer"
                                    >
                                        <option value={24}>24 Hours (Urgent)</option>
                                        <option value={48}>48 Hours (Standard)</option>
                                        <option value={72}>72 Hours (Extended)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-outline-variant/20">
                                <button 
                                    type="button" 
                                    onClick={() => setSettingsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 text-xs font-bold bg-secondary text-white rounded-xl shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-sm">save</span>
                                    Save Settings
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
