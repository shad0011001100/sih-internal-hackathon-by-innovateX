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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeNav, setActiveNav] = useState("Dashboard");

    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);
    const { showToast, showComingSoon } = useToast();

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const [dash, prob, rank, stud] = await Promise.all([
                safeFetch("/api/university/dashboard"),
                safeFetch("/api/university/problems"),
                safeFetch("/api/university/ranking"),
                safeFetch("/api/university/students")
            ]);

            setDashboardData(dash || {});
            setProblems(Array.isArray(prob) ? prob : []);
            setRanking(Array.isArray(rank) ? rank : []);
            setStudents(Array.isArray(stud) ? stud : []);
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-on-background">
                <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined animate-spin text-tertiary text-4xl" data-icon="refresh">refresh</span>
                    <p className="text-sm text-on-surface-variant font-medium">Loading Academic Dashboard...</p>
                </div>
            </div>
        );
    }

    const assignedProblemsCount = dashboardData?.assigned_reports_count ?? dashboardData?.assigned_problems_count ?? 0;
    const activeProjectsCount = dashboardData?.projects_in_progress?.length ?? dashboardData?.active_projects_count ?? 0;
    const studentParticipationCount = students.length || dashboardData?.departments?.reduce((acc: number, d: any) => acc + (d.student_count || 0), 0) || dashboardData?.student_participation_count || 0;
    const universityName = dashboardData?.university_info?.name || dashboardData?.university_name || "University Portal";

    return (
        <div className="min-h-screen flex flex-col bg-background text-on-background selection:bg-tertiary-fixed selection:text-on-tertiary-fixed">
            {/* Header */}
            <header className="bg-tertiary sticky top-0 z-40 shadow-md border-b border-tertiary-container/40">
                <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-lowest/20 flex items-center justify-center text-on-tertiary">
                            <span className="material-symbols-outlined text-2xl" data-icon="school">school</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl font-bold font-headline-sm text-on-tertiary tracking-tight truncate max-w-[200px] sm:max-w-xs">
                                    {universityName}
                                </span>
                            </div>
                            <p className="text-[11px] text-on-tertiary/80 font-medium">Academic Innovation Dashboard</p>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={handleLogout} 
                        className="w-9 h-9 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer active:scale-95 transition-all"
                        aria-label="Logout"
                    >
                        <span className="material-symbols-outlined text-sm" data-icon="logout">logout</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-6 pb-24 space-y-6">
                {error && (
                    <div className="p-4 rounded-2xl bg-error-container text-on-error-container flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-xl" data-icon="error">error</span>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={fetchAll} 
                            className="px-3 py-1 bg-surface-container-lowest text-on-surface rounded-lg text-xs font-bold hover:bg-surface-variant"
                        >
                            Retry
                        </button>
                    </div>
                )}
                
                {/* Stats Strip */}
                <section>
                    <div className="grid grid-cols-3 gap-3">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col">
                            <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-semibold mb-1">Assigned</span>
                            <span className="text-2xl font-bold font-mono text-tertiary">{assignedProblemsCount}</span>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col">
                            <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-semibold mb-1">Active</span>
                            <span className="text-2xl font-bold font-mono text-primary">{activeProjectsCount}</span>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex flex-col">
                            <span className="text-on-surface-variant text-[11px] uppercase tracking-wider font-semibold mb-1">Students</span>
                            <span className="text-2xl font-bold font-mono text-secondary">{studentParticipationCount}</span>
                        </motion.div>
                    </div>
                </section>

                {/* Department Activity */}
                <section id="dept-activity">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-tertiary" data-icon="domain">domain</span>
                        <h2 className="text-lg font-bold text-on-surface font-headline-sm">Department Activity</h2>
                    </div>
                    <div className="space-y-3">
                        {problems.length === 0 ? <p className="text-sm text-on-surface-variant py-2 italic">No problems assigned yet.</p> : null}
                        {problems.map((prob, i) => (
                            <motion.article key={prob.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-sm font-bold text-on-surface">{prob.title || prob.description}</h3>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed uppercase">{prob.status}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-outline-variant/20">
                                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                                        <span className="material-symbols-outlined text-[16px]" data-icon="science">science</span>
                                        <span>{prob.assigned_department || prob.department || 'General Engineering'}</span>
                                    </div>
                                    {prob.student_team && (
                                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                                            <span className="material-symbols-outlined text-[16px]" data-icon="group">group</span>
                                            <span>{prob.student_team}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </section>

                {/* Leaderboard */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-secondary" data-icon="emoji_events">emoji_events</span>
                        <h2 className="text-lg font-bold text-on-surface font-headline-sm">Leaderboard</h2>
                    </div>
                    <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20">
                        {ranking.map((uni, idx) => (
                            <div key={uni.id || idx} className={`flex items-center justify-between p-3 border-b last:border-0 border-outline-variant/20 ${uni.id === dashboardData?.university_info?.id ? 'bg-secondary-container/20' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 text-center font-mono font-bold text-sm ${idx === 0 ? 'text-secondary' : 'text-outline'}`}>#{idx + 1}</span>
                                    <span className="text-sm font-semibold text-on-surface truncate max-w-[150px] sm:max-w-xs">{uni.name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-mono">
                                    <span className="text-on-surface-variant" title="Projects">{uni.project_count || 0} prj</span>
                                    <span className="font-bold text-primary">{uni.ranking_score || uni.score || 0} pts</span>
                                </div>
                            </div>
                        ))}
                        {ranking.length === 0 && <p className="p-4 text-sm text-on-surface-variant text-center">Leaderboard data unavailable.</p>}
                    </div>
                </section>

                {/* Our Students */}
                <section id="our-students">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-primary" data-icon="people">people</span>
                        <h2 className="text-lg font-bold text-on-surface font-headline-sm">Our Students</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {students.length === 0 ? <p className="text-sm text-on-surface-variant py-2 italic">No students registered yet.</p> : null}
                        {students.map((student, i) => (
                            <div key={student.id || i} className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20">
                                <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold font-headline-sm text-sm uppercase">
                                    {student.name ? student.name.substring(0, 2) : 'ST'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-on-surface">{student.name}</p>
                                    <p className="text-[11px] text-on-surface-variant">
                                        {student.project_count || 0} Projects • {student.skills ? student.skills.length : 0} Skills
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)] border-t border-outline-variant/20">
                {[
                    { label: 'Dashboard', icon: 'dashboard', action: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); setActiveNav('Dashboard'); } },
                    { label: 'Problems', icon: 'science', action: () => { document.getElementById('dept-activity')?.scrollIntoView({ behavior: 'smooth' }); setActiveNav('Problems'); } },
                    { label: 'Students', icon: 'group', action: () => { document.getElementById('our-students')?.scrollIntoView({ behavior: 'smooth' }); setActiveNav('Students'); } },
                    { label: 'Settings', icon: 'settings', action: () => { showComingSoon("University Settings"); setActiveNav('Settings'); } }
                ].map(nav => (
                    <button 
                        key={nav.label} 
                        type="button" 
                        onClick={nav.action}
                        className={`flex flex-col items-center min-w-[44px] transition-colors ${activeNav === nav.label ? 'text-tertiary font-bold' : 'text-on-surface-variant hover:text-tertiary'}`}
                    >
                        <span className="material-symbols-outlined text-[22px]" data-icon={nav.icon}>{nav.icon}</span>
                        <span className="text-[10px] font-bold mt-0.5">{nav.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}
