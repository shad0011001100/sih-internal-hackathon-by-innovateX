// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../context/ToastContext";
import { safeFetch } from "../../services/api";

export default function StudentDashboard() {
    const [userData, setUserData] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);
    const [openIssues, setOpenIssues] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [activeNav, setActiveNav] = useState("Dashboard");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Adopt Problem Modal state
    const [adoptModalOpen, setAdoptModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
    const [projectTitle, setProjectTitle] = useState("");
    const [projectDesc, setProjectDesc] = useState("");
    const [mentorName, setMentorName] = useState("");

    // Project Details / Edit / Submit Modal state
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [editProgress, setEditProgress] = useState(0);
    const [editDocsUrl, setEditDocsUrl] = useState("");
    const [editProtoUrl, setEditProtoUrl] = useState("");

    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);
    const { showToast, showComingSoon } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [dashData, skillsData, probData] = await Promise.all([
                safeFetch("/api/student/dashboard"),
                safeFetch("/api/student/skill-profile"),
                safeFetch("/api/student/problems")
            ]);

            setUserData(dashData?.user || { name: 'Aravind Kumar', institution: 'BIT Mesra' });
            setProjects(Array.isArray(dashData?.projects) ? dashData.projects : []);
            setSkills(Array.isArray(skillsData) ? skillsData : []);
            setOpenIssues(Array.isArray(probData) ? probData : []);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to load student dashboard");
            showToast("Failed to load student data.", "error");
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

    const openAdoptModal = (issue: any) => {
        setSelectedIssue(issue);
        const autoTitle = issue.title || (issue.description ? `Solution: ${issue.description.slice(0, 32)}...` : 'Civic Problem Solution');
        setProjectTitle(autoTitle);
        setProjectDesc(issue.challenge_summary || issue.description || "");
        setMentorName("");
        setAdoptModalOpen(true);
    };

    const handleAdoptProblem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIssue) return;
        setSubmitting(true);
        try {
            await safeFetch("/api/student/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    report_id: selectedIssue.id,
                    title: projectTitle,
                    description: projectDesc,
                    mentor_name: mentorName || undefined
                })
            });
            const newProj = {
                id: Date.now(),
                title: projectTitle,
                category: selectedIssue.category || "General",
                status: "submitted",
                mentor_name: mentorName || "Dr. B. K. Singh (BIT Mesra)",
                deadline: "25 Oct 2026",
                progress_pct: 10,
                documentation_url: "https://github.com/shad0011001100/sih-internal-hackathon-by-innovateX"
            };
            setProjects(prev => [newProj, ...prev]);
            showToast("Problem adopted! Your capstone project has been created.", "success");
            setAdoptModalOpen(false);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to adopt problem");
            showToast(e.message || "Failed to adopt problem", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const openProjectModal = (proj: any) => {
        setSelectedProject(proj);
        setEditProgress(proj.progress_pct || 0);
        setEditDocsUrl(proj.documentation_url || "");
        setEditProtoUrl(proj.prototype_url || "");
        setProjectModalOpen(true);
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) return;
        setSubmitting(true);
        try {
            await safeFetch(`/api/student/projects/${selectedProject.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    progress_pct: Number(editProgress),
                    documentation_url: editDocsUrl || undefined,
                    prototype_url: editProtoUrl || undefined
                })
            });
            setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, progress_pct: Number(editProgress), documentation_url: editDocsUrl, prototype_url: editProtoUrl } : p));
            showToast("Project details updated successfully!", "success");
            setProjectModalOpen(false);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to update project");
            showToast(e.message || "Failed to update project", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitProject = async (projectId: number) => {
        setSubmitting(true);
        try {
            await safeFetch(`/api/student/projects/${projectId}/submit`, {
                method: "POST"
            });
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: 'submitted' } : p));
            showToast("Project solution submitted for mentor & academic review!", "success");
            setProjectModalOpen(false);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to submit project");
            showToast(e.message || "Failed to submit project", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200 } }
    };

    const filteredIssues = openIssues.filter(issue => {
        if (selectedCategory === "All") return true;
        return issue.category?.toLowerCase() === selectedCategory.toLowerCase();
    });

    const calculateOverallProgress = () => {
        if (projects.length === 0) return 0;
        const total = projects.reduce((acc, p) => acc + (p.progress_pct || 0), 0);
        return Math.round(total / projects.length);
    };

    const userInitials = userData?.name
        ? userData.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
        : (userData?.initials || "ST");

    return (
        <div className="min-h-screen flex flex-col bg-background pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-gradient-to-r from-primary to-primary-container shadow-sm border-b border-primary/20">
                <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-on-primary">
                        <span className="material-symbols-outlined text-2xl" data-icon="school">school</span>
                        <span className="font-bold font-heading text-lg tracking-tight">SocioSolve <span className="opacity-80 text-sm font-normal">Innovation Hub</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            type="button"
                            onClick={() => setProfileModalOpen(true)}
                            className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs ring-2 ring-primary-fixed/30 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                            title="View Student Profile & APAAR Credentials"
                        >
                            {userInitials}
                        </button>
                        <button 
                            type="button" 
                            onClick={handleLogout} 
                            className="p-2 text-on-primary hover:bg-primary-fixed/20 rounded-full transition-colors" 
                            aria-label="Logout"
                        >
                            <span className="material-symbols-outlined text-xl" data-icon="logout">logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <motion.main 
                variants={containerVariants} 
                initial="hidden" 
                animate="show" 
                className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-6 space-y-6"
            >
                {error && (
                    <div className="p-4 rounded-2xl bg-error-container text-on-error-container flex items-center justify-between">
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

                {/* Welcome Card */}
                <motion.section variants={itemVariants} className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-outline-variant/30 flex items-center justify-between">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/20 text-primary font-semibold text-xs mb-2">
                            <span className="material-symbols-outlined text-sm" data-icon="verified">verified</span>
                            {userData?.institution || 'SocioSolve Student'}
                        </span>
                        <h1 className="text-2xl font-bold font-heading text-on-surface">Your ideas solve real problems</h1>
                        <p className="text-on-surface-variant text-sm mt-1">Keep pushing boundaries, {userData?.name || 'Student Solver'}!</p>
                    </div>
                    <div className="relative w-16 h-16">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            <path className="text-primary" strokeDasharray={`${calculateOverallProgress()}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono text-primary">{calculateOverallProgress()}%</div>
                    </div>
                </motion.section>

                {/* My Projects */}
                <motion.section id="my-projects" variants={itemVariants} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold font-heading text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary" data-icon="handyman">handyman</span>
                            My Projects ({projects.length})
                        </h2>
                    </div>
                    {projects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {projects.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => openProjectModal(p)}
                                    className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col h-full hover:border-primary/50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-on-surface text-base">{p.title}</h3>
                                        <span className={`text-[10px] px-2 py-1 rounded-md font-semibold ${p.status === 'draft' ? 'bg-surface-variant text-on-surface-variant' : p.status === 'submitted' ? 'bg-secondary-container text-on-secondary-container' : p.status === 'accepted' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-primary-container text-on-primary-container'}`}>
                                            {p.status ? p.status.toUpperCase() : 'IN PROGRESS'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">{p.description || "No description provided."}</p>
                                    
                                    <div className="mt-auto space-y-3">
                                        <div className="flex items-center justify-between text-xs text-on-surface-variant">
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]" data-icon="person">person</span>{p.mentor_name || 'Independent'}</span>
                                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]" data-icon="edit">edit</span>Click to Manage</span>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] font-mono mb-1 text-primary"><span>Progress</span><span>{p.progress_pct || 0}%</span></div>
                                            <div className="w-full bg-surface-container-highest rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${p.progress_pct || 0}%` }}></div></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-surface-container-low rounded-2xl p-6 text-center border border-dashed border-outline-variant/50">
                            <p className="text-on-surface-variant text-sm mb-3">No active projects yet.</p>
                            <button 
                                type="button" 
                                onClick={() => { document.getElementById('open-issues')?.scrollIntoView({ behavior: 'smooth' }); setActiveNav('Issues'); }}
                                className="px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-semibold active:scale-95 transition-transform"
                            >
                                Browse Problems
                            </button>
                        </div>
                    )}
                </motion.section>

                {/* My Skills */}
                <motion.section variants={itemVariants} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold font-heading text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary" data-icon="military_tech">military_tech</span>
                            My Skills ({skills.length})
                        </h2>
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={() => { if (userData?.linkedin_url) window.open(userData.linkedin_url, '_blank'); else showComingSoon("LinkedIn Profile Integration"); }}
                                className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-variant flex items-center justify-center transition-colors" 
                                title="LinkedIn"
                            >
                                <span className="font-bold text-xs">in</span>
                            </button>
                            <button 
                                type="button" 
                                onClick={() => { if (userData?.github_url) window.open(userData.github_url, '_blank'); else showComingSoon("GitHub Profile Integration"); }}
                                className="w-8 h-8 rounded-full bg-inverse-surface text-inverse-on-surface flex items-center justify-center transition-colors" 
                                title="GitHub"
                            >
                                <span className="font-bold text-xs font-mono">gh</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {skills.map(s => (
                            <div key={s.id || s.skill_name} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3 py-2 flex flex-col shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm text-on-surface">{s.skill_name}</span>
                                    <span className="text-[9px] uppercase tracking-wider bg-tertiary-fixed text-on-tertiary-fixed px-1.5 py-0.5 rounded">{s.proficiency_level || s.proficiency || 'Intermediate'}</span>
                                </div>
                                <span className="text-[11px] text-on-surface-variant">Demonstrated in {s.projects_demonstrated || s.projects_count || 0} projects</span>
                            </div>
                        ))}
                        {skills.length === 0 && (
                            <p className="text-xs text-on-surface-variant italic">No verified skills added yet.</p>
                        )}
                    </div>
                </motion.section>

                {/* Browse Open Issues */}
                <motion.section id="open-issues" variants={itemVariants} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-lg font-bold font-heading text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary" data-icon="psychology">psychology</span>
                                Open Civic Challenges
                            </h2>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                                AI-curated engineering &amp; software problem statements (routine physical labor &amp; potholes automatically filtered).
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c2edcb]/60 border border-[#3e644a]/20 text-[#294e36] text-xs font-semibold">
                            <span className="material-symbols-outlined text-[14px] text-[#3e644a]">auto_awesome</span>
                            AI Innovation Filter Active
                        </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {['All', 'Roads', 'Water', 'Sanitation', 'Health', 'Education'].map(cat => (
                            <button 
                                key={cat} 
                                type="button" 
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${selectedCategory.toLowerCase() === cat.toLowerCase() ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {loading && (
                            <div className="flex items-center justify-center py-8">
                                <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                            </div>
                        )}
                        {!loading && filteredIssues.length === 0 && (
                            <p className="text-sm text-on-surface-variant py-4 text-center">No open problems matching '{selectedCategory}'.</p>
                        )}
                        {!loading && filteredIssues.map(issue => (
                            <div key={issue.id} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 hover:border-primary/50 transition-colors">
                                <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{issue.category}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-fixed/40 text-on-primary-fixed-variant font-mono font-medium flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px]">code</span>
                                            Tech Capstone
                                        </span>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${issue.priority_score > 70 || issue.priority === 'High' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                                        <span className="material-symbols-outlined text-[12px]" data-icon="flag">flag</span>
                                        {issue.priority_score ? `${issue.priority_score}% Priority` : (issue.priority || 'Normal')}
                                    </span>
                                </div>
                                <h3 className="font-bold text-on-surface text-base mb-1">{issue.title || issue.description?.slice(0, 50)}</h3>
                                <p className="text-xs text-on-surface-variant mb-2 line-clamp-2">{issue.challenge_summary || issue.description}</p>
                                
                                {issue.student_suitability_reason && (
                                    <p className="text-[11px] text-[#3e644a] font-medium mb-3 flex items-center gap-1 bg-[#c2edcb]/30 px-2.5 py-1 rounded-lg">
                                        <span className="material-symbols-outlined text-[13px]">lightbulb</span>
                                        <span><strong>AI Triage:</strong> {issue.student_suitability_reason}</span>
                                    </p>
                                )}
                                
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant/20">
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.isArray(issue.suggested_technologies) && issue.suggested_technologies.map((t: string) => (
                                            <span key={t} className="px-2 py-1 bg-surface-container-high text-on-surface text-[10px] rounded-md font-mono">{t}</span>
                                        ))}
                                        {Array.isArray(issue.tech) && issue.tech.map((t: string) => (
                                            <span key={t} className="px-2 py-1 bg-surface-container-high text-on-surface text-[10px] rounded-md font-mono">{t}</span>
                                        ))}
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => openAdoptModal(issue)}
                                        className="px-4 py-1.5 bg-primary text-on-primary rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-[14px]" data-icon="add_task">add_task</span>
                                        Adopt Problem
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.section>
            </motion.main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-outline-variant/30">
                {[
                    { label: 'Dashboard', icon: 'dashboard', action: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); setActiveNav('Dashboard'); } },
                    { label: 'Projects', icon: 'handyman', action: () => { document.getElementById('my-projects')?.scrollIntoView({ behavior: 'smooth' }); setActiveNav('Projects'); } },
                    { label: 'Issues', icon: 'explore', action: () => { document.getElementById('open-issues')?.scrollIntoView({ behavior: 'smooth' }); setActiveNav('Issues'); } },
                    { label: 'Profile', icon: 'person', action: () => { setProfileModalOpen(true); setActiveNav('Profile'); } }
                ].map(nav => (
                    <button 
                        key={nav.label} 
                        type="button" 
                        onClick={nav.action}
                        className={`flex flex-col items-center justify-center min-w-[64px] px-2 py-1.5 rounded-xl transition-all ${activeNav === nav.label ? 'bg-primary-container/20 text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                        <span className="material-symbols-outlined text-xl" data-icon={nav.icon}>{nav.icon}</span>
                        <span className="text-[10px] mt-1 font-semibold">{nav.label}</span>
                    </button>
                ))}
            </nav>

            {/* Adopt Problem Modal */}
            {adoptModalOpen && selectedIssue && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-on-surface">Adopt Problem Statement</h3>
                            <button type="button" onClick={() => setAdoptModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                                <span className="material-symbols-outlined text-xl" data-icon="close">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAdoptProblem} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Project Title</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={projectTitle} 
                                    onChange={e => setProjectTitle(e.target.value)} 
                                    className="w-full px-3 py-2 bg-surface-container-low rounded-xl border-0 focus:ring-2 focus:ring-primary text-sm" 
                                    placeholder="Enter capstone title" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Proposed Solution / Approach</label>
                                <textarea 
                                    rows={3}
                                    value={projectDesc} 
                                    onChange={e => setProjectDesc(e.target.value)} 
                                    className="w-full px-3 py-2 bg-surface-container-low rounded-xl border-0 focus:ring-2 focus:ring-primary text-sm" 
                                    placeholder="Describe your technical methodology" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Faculty Mentor (Optional)</label>
                                <input 
                                    type="text" 
                                    value={mentorName} 
                                    onChange={e => setMentorName(e.target.value)} 
                                    className="w-full px-3 py-2 bg-surface-container-low rounded-xl border-0 focus:ring-2 focus:ring-primary text-sm" 
                                    placeholder="e.g. Dr. A. Kumar" 
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" disabled={submitting} onClick={() => setAdoptModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-on-surface-variant">Cancel</button>
                                <button 
                                    type="submit" 
                                    disabled={submitting} 
                                    className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {submitting && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                                    {submitting ? "Adopting..." : "Confirm & Form Team"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Project Details & Submission Modal */}
            {projectModalOpen && selectedProject && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-primary font-mono">{selectedProject.status || 'DRAFT'}</span>
                                <h3 className="text-lg font-bold text-on-surface">{selectedProject.title}</h3>
                            </div>
                            <button type="button" onClick={() => setProjectModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                                <span className="material-symbols-outlined text-xl" data-icon="close">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProject} className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-semibold text-on-surface-variant">Progress Percentage</label>
                                    <span className="text-xs font-mono font-bold text-primary">{editProgress}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={editProgress} 
                                    onChange={e => setEditProgress(Number(e.target.value))} 
                                    className="w-full accent-primary" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Documentation URL</label>
                                <input 
                                    type="url" 
                                    value={editDocsUrl} 
                                    onChange={e => setEditDocsUrl(e.target.value)} 
                                    className="w-full px-3 py-2 bg-surface-container-low rounded-xl border-0 focus:ring-2 focus:ring-primary text-sm" 
                                    placeholder="https://docs.google.com/..." 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Prototype / Repo URL</label>
                                <input 
                                    type="url" 
                                    value={editProtoUrl} 
                                    onChange={e => setEditProtoUrl(e.target.value)} 
                                    className="w-full px-3 py-2 bg-surface-container-low rounded-xl border-0 focus:ring-2 focus:ring-primary text-sm" 
                                    placeholder="https://github.com/..." 
                                />
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
                                {selectedProject.status !== 'submitted' && (
                                    <button 
                                        type="button" 
                                        disabled={submitting} 
                                        onClick={() => handleSubmitProject(selectedProject.id)}
                                        className="px-4 py-2 bg-secondary text-on-secondary rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-sm" data-icon="assignment_turned_in">assignment_turned_in</span>
                                        Submit for Review
                                    </button>
                                )}
                                <div className="flex gap-2 ml-auto">
                                    <button type="button" disabled={submitting} onClick={() => setProjectModalOpen(false)} className="px-3 py-2 text-sm font-semibold text-on-surface-variant">Cancel</button>
                                    <button 
                                        type="submit" 
                                        disabled={submitting} 
                                        className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {submitting && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                                        Save Progress
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Student Academic Profile & Credentials Modal */}
            {profileModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-scrim/50 backdrop-blur-md">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/30">
                        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                            <div>
                                <span className="text-[10px] font-mono uppercase font-bold text-primary tracking-widest">Academic Bank of Credits (ABC)</span>
                                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">badge</span>
                                    Student Academic Credentials
                                </h3>
                            </div>
                            <button type="button" onClick={() => setProfileModalOpen(false)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Digital Student ID Card */}
                        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-md relative overflow-hidden">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[10px] font-mono uppercase opacity-80 tracking-wide">Government of India · APAAR Digital ID</span>
                                    <p className="text-base font-extrabold mt-0.5">{userData?.name || "Aravind Kumar"}</p>
                                    <p className="text-xs opacity-90">{userData?.institution || "BIT Mesra (Birla Institute of Technology)"}</p>
                                </div>
                                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <span className="material-symbols-outlined text-xl">qr_code_2</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-mono">
                                <div>
                                    <span className="text-[9px] uppercase opacity-75 block">APAAR Number</span>
                                    <span className="font-bold tracking-wider">{userData?.apaar_id || "APAAR-12345"}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] uppercase opacity-75 block">Status</span>
                                    <span className="font-bold text-emerald-200 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                                        Verified
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Skills Summary */}
                        <div className="mt-4 space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">Verified Skills ({skills.length})</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {skills.length === 0 ? (
                                    <span className="text-xs text-on-surface-variant">No skills recorded yet.</span>
                                ) : (
                                    skills.map((s, idx) => (
                                        <span key={idx} className="px-2.5 py-1 bg-surface-container-high rounded-lg text-xs font-medium text-on-surface border border-outline-variant/30 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[13px] text-primary">check_circle</span>
                                            {s.skill_name}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                            <span className="text-on-surface-variant font-mono text-[11px]">Academic Year 2024-25</span>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => showToast("GitHub synced with SocioSolve Sandbox", "info")} className="px-3 py-1.5 bg-surface-container rounded-lg font-semibold hover:bg-surface-container-high">GitHub</button>
                                <button type="button" onClick={() => showToast("LinkedIn Verified Badge Active", "info")} className="px-3 py-1.5 bg-surface-container rounded-lg font-semibold hover:bg-surface-container-high">LinkedIn</button>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button 
                                type="button" 
                                onClick={() => setProfileModalOpen(false)} 
                                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
