// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../context/ToastContext";

export default function OfficialDashboard() {
    const [activeTab, setActiveTab] = useState("Reports");
    const [reports, setReports] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [filter, setFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [mutatingId, setMutatingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Assign Modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showGisMap, setShowGisMap] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
    const [universityId, setUniversityId] = useState("1");
    const [department, setDepartment] = useState("Computer Science & Engineering (AI/Software)");

    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);
    const { showToast, showComingSoon } = useToast();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === "Reports") {
                const res = await fetch("/api/admin/reports");
                if (!res.ok) throw new Error("Failed to fetch reports");
                const data = await res.json();
                setReports(data || []);
            } else {
                const res = await fetch("/api/admin/submissions");
                if (!res.ok) throw new Error("Failed to fetch student submissions");
                const data = await res.json();
                setSubmissions(data || []);
            }
        } catch (e: any) {
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
            await fetch("/api/auth/logout", { method: "POST" });
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

    const updateReportStatus = async (id: number, status: string) => {
        setMutatingId(id);
        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/reports/${id}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to update report status");
            }
            showToast(`Report #${id} status updated to ${status.replace("_", " ")}`, "success");
            await fetchData();
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Status update failed");
            showToast(e.message || "Failed to update status", "error");
        } finally {
            setMutatingId(null);
            setSubmitting(false);
        }
    };

    const assignReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReportId) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/reports/${selectedReportId}/assign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ university_id: parseInt(universityId), department })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to assign university");
            }
            showToast(`Report #${selectedReportId} assigned to University #${universityId} (${department})`, "success");
            setShowAssignModal(false);
            setUniversityId("");
            setDepartment("");
            await fetchData();
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Assignment failed");
            showToast(e.message || "Failed to assign report", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const reviewSubmission = async (id: number, action: string) => {
        setMutatingId(id);
        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/submissions/${id}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, comments: "Reviewed via official portal" })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || `Failed to ${action} submission`);
            }
            showToast(`Submission #${id} ${action === 'approve' ? 'approved' : 'rejected'} successfully`, "success");
            await fetchData();
        } catch (e: any) {
            console.error(e);
            setError(e.message || `Failed to ${action} submission`);
            showToast(e.message || `Failed to ${action} submission`, "error");
        } finally {
            setMutatingId(null);
            setSubmitting(false);
        }
    };

    const implementProject = async (id: number) => {
        setMutatingId(id);
        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/submissions/${id}/implement`, {
                method: "POST"
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to mark as implemented");
            }
            showToast(`Project #${id} successfully marked as implemented!`, "success");
            await fetchData();
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Implementation update failed");
            showToast(e.message || "Failed to implement project", "error");
        } finally {
            setMutatingId(null);
            setSubmitting(false);
        }
    };

    const filteredReports = filter === "All" 
        ? reports 
        : reports.filter(r => r.status.toLowerCase().replace("_", " ") === filter.toLowerCase());

    const stats = {
        pendingReview: reports.filter(r => r.status === 'under_review').length,
        validatedToday: reports.filter(r => r.status === 'validated').length,
        implemented: reports.filter(r => r.status === 'implemented').length,
    };

    const filterTabs = ["All", "Reported", "Validated", "Assigned", "In Progress", "Under Review", "Implemented"];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'reported': return 'bg-error';
            case 'validated': return 'bg-primary';
            case 'assigned': return 'bg-secondary';
            case 'in_progress': return 'bg-secondary-container';
            case 'under_review': return 'bg-tertiary';
            case 'implemented': return 'bg-primary-container';
            default: return 'bg-outline';
        }
    };

    const renderActionBtn = (report: any) => {
        const isMutatingThis = mutatingId === report.id;
        switch(report.status) {
            case 'reported':
                return (
                    <button 
                        type="button" 
                        disabled={isMutatingThis} 
                        onClick={() => updateReportStatus(report.id, 'validated')} 
                        className="px-4 py-1.5 bg-primary text-on-primary rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                        {isMutatingThis && <span className="material-symbols-outlined animate-spin text-[14px]">refresh</span>}
                        Validate
                    </button>
                );
            case 'validated':
                return (
                    <button 
                        type="button" 
                        disabled={isMutatingThis} 
                        onClick={() => { setSelectedReportId(report.id); setShowAssignModal(true); }} 
                        className="px-4 py-1.5 bg-secondary text-on-secondary rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                        Assign
                    </button>
                );
            case 'assigned':
                return (
                    <button 
                        type="button" 
                        disabled={isMutatingThis} 
                        onClick={() => updateReportStatus(report.id, 'in_progress')} 
                        className="px-4 py-1.5 bg-tertiary text-on-tertiary rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                        {isMutatingThis && <span className="material-symbols-outlined animate-spin text-[14px]">refresh</span>}
                        Start Work
                    </button>
                );
            case 'in_progress':
                return (
                    <button 
                        type="button" 
                        disabled={isMutatingThis} 
                        onClick={() => updateReportStatus(report.id, 'under_review')} 
                        className="px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                        {isMutatingThis && <span className="material-symbols-outlined animate-spin text-[14px]">refresh</span>}
                        Send to Review
                    </button>
                );
            case 'under_review':
                return (
                    <button 
                        type="button" 
                        disabled={isMutatingThis} 
                        onClick={() => updateReportStatus(report.id, 'implemented')} 
                        className="px-4 py-1.5 bg-primary-container text-on-primary-container rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                        {isMutatingThis && <span className="material-symbols-outlined animate-spin text-[14px]">refresh</span>}
                        Implement
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-on-background selection:bg-primary-fixed selection:text-on-primary-fixed">
            {/* Header */}
            <header className="bg-secondary sticky top-0 z-40 shadow-md border-b border-secondary-container/40">
                <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-lowest/20 flex items-center justify-center text-on-secondary">
                            <span className="material-symbols-outlined text-2xl" data-icon="shield">shield</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold font-headline-sm text-on-secondary tracking-tight">Official Portal</span>
                            </div>
                            <p className="text-[11px] text-on-secondary/80 font-medium">Jharkhand Government — Verified Access</p>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={handleLogout} 
                        className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer active:scale-95 transition-all"
                        aria-label="Logout"
                    >
                        <span className="material-symbols-outlined text-sm" data-icon="logout">logout</span>
                    </button>
                </div>
            </header>

            {/* Main Tabs */}
            <div className="bg-surface-container-low px-4 pt-4">
                <div className="flex gap-4 border-b border-outline-variant/30">
                    {["Reports", "Submissions"].map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`pb-2 px-2 text-sm font-bold transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-4 pb-24">
                {error && (
                    <div className="mb-4 p-4 rounded-2xl bg-error-container text-on-error-container flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-xl" data-icon="error">error</span>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={fetchData} 
                            className="px-3 py-1 bg-surface-container-lowest text-on-surface rounded-lg text-xs font-bold hover:bg-surface-variant"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {activeTab === "Reports" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col">
                                <span className="text-on-surface-variant text-xs font-semibold">Pending Review</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-tertiary" />
                                    <span className="text-2xl font-bold font-mono">{stats.pendingReview}</span>
                                </div>
                            </div>
                            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col">
                                <span className="text-on-surface-variant text-xs font-semibold">Validated Today</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                    <span className="text-2xl font-bold font-mono">{stats.validatedToday}</span>
                                </div>
                            </div>
                            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col">
                                <span className="text-on-surface-variant text-xs font-semibold">Implemented</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                                    <span className="text-2xl font-bold font-mono">{stats.implemented}</span>
                                </div>
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                            {filterTabs.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setFilter(t)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all ${filter === t ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* Reports List */}
                        <div className="space-y-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                                </div>
                            ) : null}
                            {!loading && filteredReports.length === 0 ? <p className="text-center py-4 text-on-surface-variant text-sm">No reports found.</p> : null}
                            
                            <AnimatePresence>
                                {!loading && filteredReports.map(report => (
                                    <motion.article 
                                        key={report.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex gap-3 overflow-hidden relative"
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getStatusColor(report.status)}`} />
                                        <div className="flex-1 min-w-0 pl-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-semibold text-primary bg-primary-fixed/30 px-2 py-0.5 rounded-md">{report.category}</span>
                                                <span className="text-[10px] font-mono text-outline">{new Date(report.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm font-bold text-on-surface truncate mb-1">{report.description}</p>
                                            
                                            {report.challenge_summary && (
                                                <p className="text-xs text-on-surface-variant line-clamp-2 mb-2 leading-tight bg-surface-container-low p-2 rounded-lg">
                                                    {report.challenge_summary}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                {report.priority_score && (
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                        report.priority_score > 80 ? 'bg-error-container text-on-error-container' : 
                                                        report.priority_score > 50 ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-fixed text-on-primary-fixed'
                                                    }`}>
                                                        AI Score: {report.priority_score}%
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-mono bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">
                                                    {report.gps_lat?.toFixed(4)}, {report.gps_lon?.toFixed(4)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-mono font-semibold text-outline uppercase">{report.status.replace("_", " ")}</span>
                                                {renderActionBtn(report)}
                                            </div>
                                        </div>
                                    </motion.article>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {activeTab === "Submissions" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                            </div>
                        ) : null}
                        {!loading && submissions.length === 0 ? <p className="text-center py-4 text-on-surface-variant text-sm">No submissions pending.</p> : null}
                        
                        {!loading && submissions.map(sub => (
                            <article key={sub.id} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-bold text-on-surface">{sub.title}</h4>
                                    <span className="text-[10px] font-mono text-outline uppercase">{sub.status}</span>
                                </div>
                                <p className="text-xs text-on-surface-variant mb-3">{sub.description}</p>
                                
                                <div className="flex items-center gap-3 text-xs mb-4">
                                    {sub.documentation_url && (
                                        <a href={sub.documentation_url} target="_blank" rel="noreferrer" className="text-primary font-semibold flex items-center gap-1 hover:underline">
                                            <span className="material-symbols-outlined text-sm" data-icon="description">description</span> Docs
                                        </a>
                                    )}
                                    {sub.prototype_url && (
                                        <a href={sub.prototype_url} target="_blank" rel="noreferrer" className="text-secondary font-semibold flex items-center gap-1 hover:underline">
                                            <span className="material-symbols-outlined text-sm" data-icon="open_in_new">open_in_new</span> Prototype
                                        </a>
                                    )}
                                </div>

                                <div className="flex gap-2 justify-end border-t border-outline-variant/20 pt-3">
                                    {sub.status === 'submitted' && (
                                        <>
                                            <button 
                                                type="button"
                                                disabled={mutatingId === sub.id} 
                                                onClick={() => reviewSubmission(sub.id, 'reject')} 
                                                className="px-4 py-1.5 bg-error-container text-on-error-container rounded-full text-xs font-bold active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {mutatingId === sub.id && <span className="material-symbols-outlined animate-spin text-[14px]">refresh</span>}
                                                Reject
                                            </button>
                                            <button 
                                                type="button"
                                                disabled={mutatingId === sub.id} 
                                                onClick={() => reviewSubmission(sub.id, 'approve')} 
                                                className="px-4 py-1.5 bg-primary text-on-primary rounded-full text-xs font-bold active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {mutatingId === sub.id && <span className="material-symbols-outlined animate-spin text-[14px]">refresh</span>}
                                                Approve
                                            </button>
                                        </>
                                    )}
                                    {sub.status === 'accepted' && (
                                        <button 
                                            type="button"
                                            disabled={mutatingId === sub.id} 
                                            onClick={() => implementProject(sub.id)} 
                                            className="px-4 py-1.5 bg-primary-container text-on-primary-container rounded-full text-xs font-bold active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {mutatingId === sub.id && <span className="material-symbols-outlined animate-spin text-[14px]">refresh</span>}
                                            Mark Implemented
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </motion.div>
                )}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] border-t border-outline-variant/20">
                <button 
                    type="button"
                    onClick={() => { setActiveTab("Reports"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={`flex flex-col items-center min-w-[44px] transition-colors ${activeTab === "Reports" ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
                >
                    <span className="material-symbols-outlined text-[22px]" data-icon="dashboard">dashboard</span>
                    <span className="text-[10px] font-bold mt-0.5">Dashboard</span>
                </button>
                <button 
                    type="button"
                    onClick={() => { setActiveTab("Reports"); }}
                    className={`flex flex-col items-center min-w-[44px] transition-colors ${activeTab === "Reports" ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
                >
                    <span className="material-symbols-outlined text-[22px]" data-icon="assignment">assignment</span>
                    <span className="text-[10px] font-bold mt-0.5">Reports</span>
                </button>
                <button 
                    type="button" 
                    onClick={() => setShowGisMap(true)} 
                    className="flex flex-col items-center min-w-[44px] text-on-surface-variant hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined text-[22px]" data-icon="map">map</span>
                    <span className="text-[10px] font-bold mt-0.5">GIS Map</span>
                </button>
                <button 
                    type="button" 
                    onClick={() => showComingSoon("Official Portal Settings")} 
                    className="flex flex-col items-center min-w-[44px] text-on-surface-variant hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined text-[22px]" data-icon="settings">settings</span>
                    <span className="text-[10px] font-bold mt-0.5">Settings</span>
                </button>
            </nav>

            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-md shadow-xl border border-outline-variant/30">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">school</span>
                                <h3 className="text-lg font-bold text-on-surface">Assign to Academic Institution</h3>
                            </div>
                            <button type="button" onClick={() => setShowAssignModal(false)} className="text-on-surface-variant hover:text-on-surface">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>
                        
                        <p className="text-xs text-on-surface-variant mb-4">
                            Route this grievance to a verified university department for student capstone solving or engineering field analysis.
                        </p>

                        <form onSubmit={assignReport} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Select Partner University</label>
                                <select 
                                    required 
                                    value={universityId} 
                                    onChange={e => setUniversityId(e.target.value)} 
                                    className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:ring-2 focus:ring-primary text-sm font-medium text-on-surface"
                                >
                                    <option value="1">BIT Mesra (Birla Institute of Technology) · Score 95.5</option>
                                    <option value="2">NIT Jamshedpur (National Institute of Technology) · Score 92.0</option>
                                    <option value="3">IIT (ISM) Dhanbad · Score 94.0</option>
                                    <option value="4">IIIT Ranchi · Score 89.5</option>
                                    <option value="5">Ranchi University · Score 86.0</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Designated Academic Department</label>
                                <select 
                                    required 
                                    value={department} 
                                    onChange={e => setDepartment(e.target.value)} 
                                    className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:ring-2 focus:ring-primary text-sm font-medium text-on-surface"
                                >
                                    <option value="Computer Science & Engineering (AI/Software)">Computer Science & Engineering (AI/Software/IoT)</option>
                                    <option value="Civil & Environmental Engineering">Civil & Environmental Engineering (Water/Roads)</option>
                                    <option value="Electrical & Electronics Engineering">Electrical & Electronics (Smart Grid/Sensors)</option>
                                    <option value="Water Resource Management & Public Health">Water Resource Management & Public Health</option>
                                    <option value="Rural Technology & Governance">Rural Technology & Governance</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
                                <button type="button" disabled={submitting} onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-sm font-semibold text-on-surface-variant">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50">
                                    {submitting && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                                    {submitting ? "Dispatching..." : "Confirm & Assign"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Interactive GIS Ward Heatmap Modal */}
            {showGisMap && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-scrim/50 backdrop-blur-md">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-outline-variant/30">
                        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                            <div>
                                <span className="text-[10px] font-mono uppercase font-bold text-primary tracking-widest">RMC GIS Telemetry Engine</span>
                                <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">map</span>
                                    Ranchi Municipal Corporation (RMC) Ward Heatmap
                                </h3>
                            </div>
                            <button type="button" onClick={() => setShowGisMap(false)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <div className="my-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                            <div className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                                <span className="text-[10px] text-on-surface-variant uppercase font-bold">Total Wards</span>
                                <p className="text-xl font-bold font-mono text-on-surface">12</p>
                            </div>
                            <div className="p-3 bg-error-container/40 rounded-2xl border border-error/20">
                                <span className="text-[10px] text-error uppercase font-bold">Critical Hotspots</span>
                                <p className="text-xl font-bold font-mono text-error">Ward 4, 7</p>
                            </div>
                            <div className="p-3 bg-primary-container/30 rounded-2xl border border-primary/20">
                                <span className="text-[10px] text-primary uppercase font-bold">Field Crews</span>
                                <p className="text-xl font-bold font-mono text-primary">18 Teams</p>
                            </div>
                            <div className="p-3 bg-secondary-container/40 rounded-2xl border border-secondary/20">
                                <span className="text-[10px] text-secondary uppercase font-bold">Zonal Status</span>
                                <p className="text-xl font-bold font-mono text-secondary">Active GPS</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">12 Municipal Wards Grid</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                {[
                                    { ward: "Ward 1", locality: "Kanke & CMPDI", reports: 2, severity: "Low", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                                    { ward: "Ward 2", locality: "Morabadi & Tagore Hill", reports: 3, severity: "Low", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                                    { ward: "Ward 3", locality: "Bariatu & RIMS Medical", reports: 5, severity: "Moderate", color: "bg-amber-50 text-amber-800 border-amber-200" },
                                    { ward: "Ward 4", locality: "Doranda & Tribal Hostel", reports: 8, severity: "Critical", color: "bg-rose-50 text-rose-800 border-rose-300" },
                                    { ward: "Ward 5", locality: "Hinoo & Birsa Airport", reports: 3, severity: "Low", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                                    { ward: "Ward 6", locality: "Lalpur & Circular Road", reports: 4, severity: "Moderate", color: "bg-amber-50 text-amber-800 border-amber-200" },
                                    { ward: "Ward 7", locality: "Ring Road & Tupudana", reports: 7, severity: "Critical", color: "bg-rose-50 text-rose-800 border-rose-300" },
                                    { ward: "Ward 8", locality: "Kokar & Industrial Area", reports: 4, severity: "Moderate", color: "bg-amber-50 text-amber-800 border-amber-200" },
                                    { ward: "Ward 9", locality: "Harmu Housing Colony", reports: 2, severity: "Low", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                                    { ward: "Ward 10", locality: "Dhurwa & Smart City Core", reports: 3, severity: "Low", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
                                    { ward: "Ward 11", locality: "Ratu Road & Pandra", reports: 6, severity: "Moderate", color: "bg-amber-50 text-amber-800 border-amber-200" },
                                    { ward: "Ward 12", locality: "Jagannathpur & Hatia", reports: 4, severity: "Moderate", color: "bg-amber-50 text-amber-800 border-amber-200" },
                                ].map((w) => (
                                    <div 
                                        key={w.ward} 
                                        onClick={() => {
                                            setFilter("All");
                                            setShowGisMap(false);
                                            showToast(`Filtered for ${w.ward}: ${w.locality}`, "info");
                                        }}
                                        className={`p-3 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer text-left shadow-xs ${w.color}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-xs">{w.ward}</span>
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/80 font-bold uppercase">{w.severity}</span>
                                        </div>
                                        <p className="text-xs font-semibold truncate">{w.locality}</p>
                                        <p className="text-[11px] opacity-80 mt-1">{w.reports} Active Grievances</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-outline-variant/20 flex justify-end">
                            <button 
                                type="button" 
                                onClick={() => setShowGisMap(false)} 
                                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm cursor-pointer"
                            >
                                Back to Grievance Records
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
