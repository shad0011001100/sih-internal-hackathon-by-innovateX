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
    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [teamMembers, setTeamMembers] = useState<any[]>([
        { name: "Aravind Kumar", role: "Team Lead & IoT Architect", apaar_id: "APAAR-JH-9821", initials: "AK" },
        { name: "Priya Kumari", role: "GIS & Remote Sensing Analyst", apaar_id: "APAAR-JH-4412", initials: "PK" },
        { name: "Rohit Soren", role: "Hydraulic Modeling & Systems", apaar_id: "APAAR-JH-7730", initials: "RS" }
    ]);
    const [newMemberName, setNewMemberName] = useState("");
    const [newMemberApaar, setNewMemberApaar] = useState("");
    const [newMemberRole, setNewMemberRole] = useState("Hardware / IoT Engineer");
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [editProgress, setEditProgress] = useState(0);
    const [editDocsUrl, setEditDocsUrl] = useState("");
    const [editProtoUrl, setEditProtoUrl] = useState("");
    const [linkedinUrl, setLinkedinUrl] = useState(localStorage.getItem("student_linkedin") || "https://linkedin.com/in/aravind-kumar-bit");
    const [githubUrl, setGithubUrl] = useState(localStorage.getItem("student_github") || "https://github.com/aravind-kumar-tech");

    // Active Mission Control state
    const [missionPresentationUrl, setMissionPresentationUrl] = useState("");
    const [missionDocsUrl, setMissionDocsUrl] = useState("");
    const [missionProtoUrl, setMissionProtoUrl] = useState("");
    const [missionImpactReport, setMissionImpactReport] = useState("");
    const [missionProgress, setMissionProgress] = useState(0);
    const [savingMission, setSavingMission] = useState(false);
    const [releaseModalOpen, setReleaseModalOpen] = useState(false);
    const [releaseReason, setReleaseReason] = useState("");
    const [releasing, setReleasing] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        phaseName: "Phase 1: Synopsis & Pitch Deck (PPT)",
        phaseIndex: 1,
        phaseDeadlineDays: 5,
        deadlineDate: ""
    });

    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);
    const { showToast, showComingSoon } = useToast();

    const getHumanLocation = (issue: any): { name: string; landmark: string } => {
        if (!issue) return { name: "Ranchi Municipal Area", landmark: "Jharkhand Urban Development Zone" };
        const text = `${issue.title || ''} ${issue.description || ''} ${issue.challenge_summary || ''}`.toLowerCase();
        
        if (text.includes("morabadi")) return { name: "Morabadi, Ward 4", landmark: "Oxygen Park & Stadium Zone, Ranchi" };
        if (text.includes("doranda")) return { name: "Doranda, Ward 4", landmark: "Near Tribal Welfare Hostel & High Court roundabout" };
        if (text.includes("harmu")) return { name: "Harmu Housing Colony", landmark: "Harmu Bypass Road & Housing Sector, Ranchi" };
        if (text.includes("bariatu")) return { name: "Bariatu, Ranchi", landmark: "Near Primary Health Sub-Centre & RIMS Road" };
        if (text.includes("lalpur")) return { name: "Lalpur Chowk", landmark: "Commercial Vegetable Market & Circular Road, Ranchi" };
        if (text.includes("kanke")) return { name: "Kanke Road", landmark: "Kanke Dam & Agricultural University Belt, Ranchi" };
        if (text.includes("kishoreganj") || text.includes("sukhdeonagar")) return { name: "Kishoreganj", landmark: "Harmu Road Junction, Sukhdeo Nagar, Ranchi" };
        if (text.includes("kokar")) return { name: "Kokar, Ward 3", landmark: "Industrial Area & Sadar Hospital Zone" };
        if (text.includes("chutia")) return { name: "Chutia, Ward 6", landmark: "Station Road & Swarnarekha River Basin" };
        if (text.includes("hinoo")) return { name: "Hinoo, Ward 5", landmark: "Birsa Munda Airport Corridor, Ranchi" };
        if (text.includes("namkum")) return { name: "Namkum, Ward 9", landmark: "Namkum Industrial & Railway Crossing Area" };
        if (text.includes("ratu")) return { name: "Ratu Road", landmark: "Pandra Market & National Highway 75 corridor" };
        if (text.includes("main road")) return { name: "Main Road, Central Ranchi", landmark: "Overbridge & Commercial Market Corridor" };
        
        if (issue.gps_lat && issue.gps_lon) {
            const lat = Number(issue.gps_lat);
            const lon = Number(issue.gps_lon);
            if (Math.abs(lat - 23.35) < 0.02 && Math.abs(lon - 85.31) < 0.02) {
                return { name: "Harmu / Doranda", landmark: "South Ranchi Municipal Zone" };
            }
            if (Math.abs(lat - 23.39) < 0.02 && Math.abs(lon - 85.33) < 0.02) {
                return { name: "Morabadi", landmark: "North Ranchi Central Zone" };
            }
            return { 
                name: "Ranchi Municipal Area", 
                landmark: `Ranchi Urban Zone (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)` 
            };
        }
        
        return { name: "Ranchi Municipal Area", landmark: "Ranchi Municipal Corporation jurisdiction" };
    };

    const handleSaveSocials = async () => {
        localStorage.setItem("student_linkedin", linkedinUrl);
        localStorage.setItem("student_github", githubUrl);
        setUserData((prev: any) => ({ ...prev, linkedin_url: linkedinUrl, github_url: githubUrl }));
        try {
            await safeFetch("/api/student/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ linkedin_url: linkedinUrl, github_url: githubUrl })
            });
        } catch (err) {
            // Silently persist in local storage if backend offline
        }
        showToast("Profile links saved! Visible to Officials & Corporate Partners.", "success");
    };

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

            const user = dashData?.user || { name: 'Aravind Kumar', institution: 'BIT Mesra' };
            setUserData(user);
            if (user.linkedin_url && !localStorage.getItem("student_linkedin")) {
                setLinkedinUrl(user.linkedin_url);
            }
            if (user.github_url && !localStorage.getItem("student_github")) {
                setGithubUrl(user.github_url);
            }

            const fetchedProjects = Array.isArray(dashData?.projects) ? dashData.projects : [];
            setProjects(fetchedProjects);
            const hasActive = fetchedProjects.some((p: any) => p.status !== 'completed');
            if (hasActive) {
                setActiveNav("Mission");
            }
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
        const activeCount = projects.filter(p => p.status !== 'completed').length;
        if (activeCount >= 1) {
            showToast("Active Capstone Limit Reached (1/1): Complete your ongoing project before adopting another.", "warning");
            return;
        }
        if (issue.is_already_adopted) {
            showToast("You or your team has already adopted this problem statement.", "warning");
            return;
        }
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
            const res = await safeFetch("/api/student/projects", {
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
                id: res?.id || Date.now(),
                report_id: selectedIssue.id,
                title: projectTitle,
                description: projectDesc,
                category: selectedIssue.category || "General",
                status: "in_progress",
                mentor_name: mentorName || "Dr. B. K. Singh (BIT Mesra)",
                deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
                progress_pct: 10,
                created_at: new Date().toISOString(),
                presentation_url: "",
                documentation_url: "https://github.com/shad0011001100/sih-internal-hackathon-by-innovateX",
                prototype_url: "",
                impact_report: "",
                report: selectedIssue
            };
            setProjects(prev => [newProj, ...prev]);
            setOpenIssues(prev => prev.map(iss => iss.id === selectedIssue.id ? { ...iss, is_already_adopted: true } : iss));
            showToast("Problem adopted! Switched to your Active Mission workspace.", "success");
            setAdoptModalOpen(false);
            setActiveNav("Mission");
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to adopt problem");
            showToast(e.message || "Failed to adopt problem", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const openProjectModal = (proj: any) => {
        if (proj.status !== 'completed') {
            setActiveNav("Mission");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setSelectedProject(proj);
        setEditProgress(proj.progress_pct || 0);
        setEditDocsUrl(proj.documentation_url || "");
        setEditProtoUrl(proj.prototype_url || "");
        setProjectModalOpen(true);
    };

    const handleSaveMissionDeliverables = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const activeProj = projects.find(p => p.status !== 'completed');
        if (!activeProj) return;
        setSavingMission(true);
        try {
            await safeFetch(`/api/student/projects/${activeProj.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    progress_pct: Number(missionProgress),
                    presentation_url: missionPresentationUrl || undefined,
                    documentation_url: missionDocsUrl || undefined,
                    prototype_url: missionProtoUrl || undefined,
                    impact_report: missionImpactReport || undefined
                })
            });
            setProjects(prev => prev.map(p => p.id === activeProj.id ? {
                ...p,
                progress_pct: Number(missionProgress),
                presentation_url: missionPresentationUrl,
                documentation_url: missionDocsUrl,
                prototype_url: missionProtoUrl,
                impact_report: missionImpactReport
            } : p));
            showToast("Milestone deliverables saved successfully!", "success");
        } catch (e: any) {
            console.error(e);
            showToast(e.message || "Failed to save deliverables", "error");
        } finally {
            setSavingMission(false);
        }
    };

    const handleSubmitMissionForReview = async () => {
        const activeProj = projects.find(p => p.status !== 'completed');
        if (!activeProj) return;
        if (missionProgress < 100) {
            showToast("Please advance progress to 100% and link deliverables before submitting.", "warning");
            return;
        }
        setSubmitting(true);
        try {
            await safeFetch(`/api/student/projects/${activeProj.id}/submit`, { method: "POST" });
            setProjects(prev => prev.map(p => p.id === activeProj.id ? { ...p, status: "submitted" } : p));
            showToast("Capstone Project submitted for Official and Mentor Review!", "success");
        } catch (e: any) {
            console.error(e);
            showToast(e.message || "Submission failed", "error");
        } finally {
            setSubmitting(false);
        }
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
        if (Number(editProgress) < 100) {
            showToast(`Project milestone progress must be 100% (currently ${editProgress}%) to submit for review.`, "warning");
            return;
        }
        setSubmitting(true);
        try {
            // Persist the 100% progress along with documentation and prototype URLs
            await safeFetch(`/api/student/projects/${projectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    progress_pct: 100,
                    documentation_url: editDocsUrl || undefined,
                    prototype_url: editProtoUrl || undefined
                })
            });
            await safeFetch(`/api/student/projects/${projectId}/submit`, {
                method: "POST"
            });
            setProjects(prev => prev.map(p => p.id === projectId ? { 
                ...p, 
                progress_pct: 100, 
                documentation_url: editDocsUrl, 
                prototype_url: editProtoUrl, 
                status: 'submitted' 
            } : p));
            showToast("Project completed at 100% and submitted for mentor & academic review!", "success");
            setProjectModalOpen(false);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to submit project");
            showToast(e.message || "Failed to submit project", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddTeamMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberName.trim()) return;
        if (teamMembers.length >= 5) {
            showToast("Maximum team limit reached (5 members max per capstone).", "warning");
            return;
        }

        if (activeProject?.team_id) {
            try {
                const res = await safeFetch(`/api/student/teams/${activeProject.team_id}/members`, {
                    method: "POST",
                    body: JSON.stringify({
                        name: newMemberName.trim(),
                        role: newMemberRole,
                        apaar_id: newMemberApaar.trim() || undefined
                    })
                });
                const m = res.member;
                const initials = (m.name || "ST").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                setTeamMembers(prev => [...prev, { ...m, initials }]);
                showToast(res.message || `Teammate ${m.name} added to project team!`, "success");
                setNewMemberName("");
                setNewMemberApaar("");
                setTeamModalOpen(false);
            } catch (err: any) {
                showToast(err.message || "Failed to add teammate.", "error");
            }
        } else {
            const initials = newMemberName.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            const newM = {
                id: Date.now(),
                name: newMemberName.trim(),
                role: newMemberRole,
                apaar_id: newMemberApaar.trim() || `APAAR-JH-${Math.floor(1000 + Math.random() * 9000)}`,
                initials,
                is_leader: false
            };
            setTeamMembers(prev => [...prev, newM]);
            showToast(`Teammate ${newMemberName} added!`, "success");
            setNewMemberName("");
            setNewMemberApaar("");
            setTeamModalOpen(false);
        }
    };

    const handleRemoveTeamMember = async (memberId: number, memberName: string) => {
        if (teamMembers.length <= 1) {
            showToast("Minimum team size is 1 member. The last remaining student cannot be removed. To drop this project, use 'Release Problem Statement'.", "warning");
            return;
        }
        if (!window.confirm(`Are you sure you want to remove ${memberName} from the project team?`)) return;

        if (activeProject?.team_id) {
            try {
                const res = await safeFetch(`/api/student/teams/${activeProject.team_id}/members/${memberId}`, {
                    method: "DELETE"
                });
                setTeamMembers(prev => prev.filter(m => m.id !== memberId));
                showToast(res.message || `Removed ${memberName} from team.`, "success");
            } catch (err: any) {
                showToast(err.message || "Failed to remove teammate.", "error");
            }
        } else {
            setTeamMembers(prev => prev.filter(m => m.id !== memberId));
            showToast(`Removed ${memberName} from team.`, "info");
        }
    };

    const handleReleaseProject = async () => {
        if (!activeProject) return;
        setReleasing(true);
        try {
            const res = await safeFetch(`/api/student/projects/${activeProject.id}/release`, {
                method: "POST",
                body: JSON.stringify({ reason: releaseReason.trim() || "Team unable to build working prototype / pivot" })
            });
            showToast(res.message || "Problem statement released. Capstone slot unlocked!", "success");
            setReleaseModalOpen(false);
            setReleaseReason("");
            await fetchDashboard();
            setActiveNav("Issues");
        } catch (err: any) {
            showToast(err.message || "Failed to release problem statement.", "error");
        } finally {
            setReleasing(false);
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

    const activeProjects = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled');
    const activeProject = activeProjects[0] || null;
    const maxActiveProjects = 1;
    const canAdopt = activeProjects.length < maxActiveProjects;

    useEffect(() => {
        if (activeProject) {
            setMissionPresentationUrl(activeProject.presentation_url || "");
            setMissionDocsUrl(activeProject.documentation_url || "");
            setMissionProtoUrl(activeProject.prototype_url || "");
            setMissionImpactReport(activeProject.impact_report || activeProject.description || "");
            setMissionProgress(activeProject.progress_pct || 0);
            if (Array.isArray(activeProject.team_members) && activeProject.team_members.length > 0) {
                setTeamMembers(activeProject.team_members.map((m: any) => ({
                    id: m.id,
                    user_id: m.user_id,
                    name: m.name,
                    role: m.role,
                    apaar_id: m.apaar_id,
                    initials: (m.name || "ST").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
                    is_current_user: m.is_current_user,
                    is_leader: m.is_leader
                })));
            }
        }
    }, [activeProject?.id, activeProject?.progress_pct, activeProject?.team_members?.length]);

    useEffect(() => {
        if (!activeProject) return;

        const updateCountdown = () => {
            const createdTime = activeProject.created_at ? new Date(activeProject.created_at).getTime() : Date.now();
            const currentProgress = Number(missionProgress);

            let phaseName = "Phase 1: Synopsis & Pitch Deck (PPT)";
            let phaseIndex = 1;
            let phaseDeadlineDays = 5;

            if (currentProgress >= 30 && currentProgress < 70) {
                phaseName = "Phase 2: Working Prototype & Code Repository";
                phaseIndex = 2;
                phaseDeadlineDays = 15;
            } else if (currentProgress >= 70 && currentProgress < 100) {
                phaseName = "Phase 3: Field Verification & Final Review";
                phaseIndex = 3;
                phaseDeadlineDays = 25;
            } else if (currentProgress >= 100) {
                phaseName = "Phase 3 Completed: Ready for Government Sign-off";
                phaseIndex = 3;
                phaseDeadlineDays = 25;
            }

            const deadlineTime = createdTime + phaseDeadlineDays * 24 * 60 * 60 * 1000;
            const now = Date.now();
            const diff = Math.max(0, deadlineTime - now);

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            const deadlineDate = new Date(deadlineTime).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });

            setTimeRemaining({
                days,
                hours,
                minutes,
                seconds,
                phaseName,
                phaseIndex,
                phaseDeadlineDays,
                deadlineDate
            });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [activeProject?.id, activeProject?.created_at, missionProgress]);

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

            {/* Top Workspace Tab Selector */}
            <div className="sticky top-16 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/30 py-2.5 px-4 shadow-xs">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
                        <button
                            type="button"
                            onClick={() => { setActiveNav("Mission"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                                activeNav === "Mission"
                                    ? "bg-primary text-on-primary shadow-sm"
                                    : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm sm:text-base">rocket_launch</span>
                            <span>Active Mission</span>
                            {activeProject && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-emerald-400 text-emerald-950 font-mono text-[9px] font-extrabold animate-pulse">
                                    LIVE
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveNav("Dashboard"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                                activeNav === "Dashboard"
                                    ? "bg-primary text-on-primary shadow-sm"
                                    : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm sm:text-base">dashboard</span>
                            <span>Overview &amp; Projects</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => { setActiveNav("Issues"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                                activeNav === "Issues"
                                    ? "bg-primary text-on-primary shadow-sm"
                                    : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm sm:text-base">explore</span>
                            <span>Civic Challenges</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-surface-container-highest text-[10px] font-mono font-semibold">
                                {openIssues.length}
                            </span>
                        </button>
                    </div>

                    {activeProject && (
                        <button
                            type="button"
                            onClick={() => { setActiveNav("Mission"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                            className="hidden md:flex items-center gap-2 text-xs text-on-surface-variant bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl hover:bg-amber-500/20 transition-colors cursor-pointer shrink-0"
                            title="Go to Active Mission Control"
                        >
                            <span className="material-symbols-outlined text-amber-600 text-sm animate-pulse">alarm</span>
                            <span className="text-stone-900 dark:text-amber-100 font-medium">
                                Phase Due: <strong>{timeRemaining.days}d {timeRemaining.hours}h left</strong>
                            </span>
                        </button>
                    )}
                </div>
            </div>

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

                {/* 1. ACTIVE MISSION CONTROL VIEW (FOCUSED TAB) */}
                {activeNav === "Mission" && (
                    <motion.div variants={itemVariants} className="space-y-6">
                        {activeProject ? (
                            <>
                                {/* Hero Mission Header */}
                                <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/30 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-bold uppercase tracking-wider shadow-xs">
                                                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                                Active Capstone Mission
                                            </span>
                                            <span className="text-xs font-mono text-outline px-2 py-0.5 rounded-md bg-surface-container">
                                                Grievance #{String(activeProject.report_id || activeProject.id).padStart(4, '0')}
                                            </span>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-primary-container/30 text-primary text-xs font-mono font-bold uppercase">
                                            Status: {activeProject.status || 'IN PROGRESS'}
                                        </span>
                                    </div>

                                    <div>
                                        <h1 className="text-2xl font-bold font-heading text-on-surface leading-snug">
                                            {activeProject.title}
                                        </h1>
                                        <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                                            {activeProject.description || "Student-led technical engineering intervention under National SIH & Innovation Hub."}
                                        </p>
                                    </div>

                                    {/* Ground Location & Mentor Bar */}
                                    {(() => {
                                        const groundLoc = getHumanLocation(activeProject.report || activeProject);
                                        const lat = activeProject.report?.gps_lat;
                                        const lon = activeProject.report?.gps_lon;
                                        return (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-outline-variant/20">
                                                <div className="flex items-start gap-2.5 text-xs bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/20">
                                                    <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">location_on</span>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-on-surface">{groundLoc.name}</p>
                                                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">{groundLoc.landmark}</p>
                                                        {lat && lon && (
                                                            <a
                                                                href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold mt-1.5"
                                                            >
                                                                <span>View on Google Maps</span>
                                                                <span className="material-symbols-outlined text-xs">open_in_new</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2.5 text-xs bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/20">
                                                    <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">school</span>
                                                    <div>
                                                        <p className="font-bold text-on-surface">Faculty Mentor</p>
                                                        <p className="text-[11px] text-on-surface-variant mt-0.5">{activeProject.mentor_name || "Dr. B. K. Singh (BIT Mesra)"}</p>
                                                        <p className="text-[10px] text-outline mt-1 font-mono">Department of Civil &amp; Environmental Engineering</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Urgency Clock & Milestone Stepper */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Countdown Clock Widget */}
                                    <div className="lg:col-span-1 bg-gradient-to-br from-primary/10 via-surface-container-lowest to-surface-container-low rounded-3xl p-5 shadow-sm border border-primary/20 flex flex-col justify-between space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-stone-900 dark:text-amber-100 text-[11px] font-bold">
                                                    <span className="material-symbols-outlined text-[14px] text-amber-600 animate-spin">hourglass_top</span>
                                                    Live Countdown
                                                </span>
                                                <span className="text-[11px] font-mono text-outline font-medium">Phase {timeRemaining.phaseIndex} of 3</span>
                                            </div>
                                            <h3 className="text-base font-bold text-on-surface">{timeRemaining.phaseName}</h3>
                                            <p className="text-xs text-on-surface-variant mt-1">
                                                Submission Target: <strong className="text-on-surface">{timeRemaining.deadlineDate}</strong>
                                            </p>
                                        </div>

                                        {/* Digital Digits */}
                                        <div className="grid grid-cols-4 gap-2 text-center py-2">
                                            <div className="bg-surface-container-lowest rounded-2xl p-2.5 border border-outline-variant/20 shadow-xs">
                                                <span className="text-xl sm:text-2xl font-black font-mono text-primary">{String(timeRemaining.days).padStart(2, '0')}</span>
                                                <span className="block text-[9px] uppercase font-bold text-on-surface-variant tracking-wider mt-0.5">Days</span>
                                            </div>
                                            <div className="bg-surface-container-lowest rounded-2xl p-2.5 border border-outline-variant/20 shadow-xs">
                                                <span className="text-xl sm:text-2xl font-black font-mono text-primary">{String(timeRemaining.hours).padStart(2, '0')}</span>
                                                <span className="block text-[9px] uppercase font-bold text-on-surface-variant tracking-wider mt-0.5">Hours</span>
                                            </div>
                                            <div className="bg-surface-container-lowest rounded-2xl p-2.5 border border-outline-variant/20 shadow-xs">
                                                <span className="text-xl sm:text-2xl font-black font-mono text-primary">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                                                <span className="block text-[9px] uppercase font-bold text-on-surface-variant tracking-wider mt-0.5">Mins</span>
                                            </div>
                                            <div className="bg-surface-container-lowest rounded-2xl p-2.5 border border-outline-variant/20 shadow-xs">
                                                <span className="text-xl sm:text-2xl font-black font-mono text-primary">{String(timeRemaining.seconds).padStart(2, '0')}</span>
                                                <span className="block text-[9px] uppercase font-bold text-on-surface-variant tracking-wider mt-0.5">Secs</span>
                                            </div>
                                        </div>

                                        <div className="bg-surface-container-lowest/90 rounded-2xl p-3 border border-outline-variant/20 text-[11px] text-on-surface-variant leading-relaxed">
                                            {timeRemaining.phaseIndex === 1 && (
                                                <p>💡 <strong>Current Priority:</strong> Submit your idea pitch deck (Google Slides or PPT) to anchor project methodology with your mentor.</p>
                                            )}
                                            {timeRemaining.phaseIndex === 2 && (
                                                <p>⚙️ <strong>Current Priority:</strong> Commit source code to GitHub and link your functioning hardware/software prototype demo.</p>
                                            )}
                                            {timeRemaining.phaseIndex === 3 && (
                                                <p>🏆 <strong>Current Priority:</strong> Complete field trial telemetry and submit for Government implementation review.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Milestone Roadmap Stepper */}
                                    <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/30 space-y-4 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h3 className="text-base font-bold text-on-surface">Capstone Milestone Roadmap</h3>
                                                    <p className="text-xs text-on-surface-variant mt-0.5">Track deliverables from initial slide pitch to municipal rollout.</p>
                                                </div>
                                                <span className="text-sm font-bold font-mono text-primary px-3 py-1 rounded-full bg-primary/10">
                                                    {missionProgress}% Complete
                                                </span>
                                            </div>

                                            {/* Overall Progress Bar */}
                                            <div className="w-full bg-surface-container-high rounded-full h-2.5 mb-5 overflow-hidden">
                                                <motion.div 
                                                    className="bg-primary h-2.5 rounded-full transition-all" 
                                                    style={{ width: `${missionProgress}%` }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${missionProgress}%` }}
                                                />
                                            </div>

                                            {/* Milestone 3-Card Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className={`p-3.5 rounded-2xl border transition-all ${missionProgress >= 30 ? 'bg-emerald-500/10 border-emerald-500/30' : timeRemaining.phaseIndex === 1 ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-surface-container-low border-outline-variant/20'}`}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Milestone 1</span>
                                                        {missionProgress >= 30 ? (
                                                            <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                                                        ) : (
                                                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-bold">5 Days</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-bold text-on-surface">Pitch Deck (PPT)</p>
                                                    <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                                                        Slide deck covering problem analysis, circuit/software architecture.
                                                    </p>
                                                </div>

                                                <div className={`p-3.5 rounded-2xl border transition-all ${missionProgress >= 70 ? 'bg-emerald-500/10 border-emerald-500/30' : timeRemaining.phaseIndex === 2 ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-surface-container-low border-outline-variant/20'}`}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Milestone 2</span>
                                                        {missionProgress >= 70 ? (
                                                            <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                                                        ) : (
                                                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container font-bold">15 Days</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-bold text-on-surface">Prototype &amp; Code</p>
                                                    <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                                                        GitHub repository link and functional working demo deployment.
                                                    </p>
                                                </div>

                                                <div className={`p-3.5 rounded-2xl border transition-all ${missionProgress >= 100 ? 'bg-emerald-500/10 border-emerald-500/30' : timeRemaining.phaseIndex === 3 ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-surface-container-low border-outline-variant/20'}`}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Milestone 3</span>
                                                        {missionProgress >= 100 ? (
                                                            <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                                                        ) : (
                                                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant font-bold">25 Days</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-bold text-on-surface">Field Verification</p>
                                                    <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                                                        Impact notes &amp; final submission for municipal rollout sign-off.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Progress Advancers */}
                                        <div className="pt-3 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-on-surface-variant">Quick Milestone Advance:</span>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setMissionProgress(30)}
                                                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${missionProgress === 30 ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}
                                                >
                                                    30% (PPT Done)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMissionProgress(70)}
                                                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${missionProgress === 70 ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}
                                                >
                                                    70% (Prototype Built)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMissionProgress(100)}
                                                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${missionProgress === 100 ? 'bg-emerald-600 text-white' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}
                                                >
                                                    100% (Completed)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Deliverables Submission Hub & Ground Reality Dossier */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Deliverables Form */}
                                    <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/30 space-y-4">
                                        <div className="border-b border-outline-variant/20 pb-3">
                                            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">upload_file</span>
                                                Mission Deliverables Hub
                                            </h3>
                                            <p className="text-xs text-on-surface-variant mt-0.5">
                                                Link your team's slide deck, code repository, and prototype. Evaluated by academic mentors and municipal reviewers.
                                            </p>
                                        </div>

                                        <form onSubmit={handleSaveMissionDeliverables} className="space-y-4">
                                            {/* Presentation Deck URL */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-sm text-primary">slideshow</span>
                                                        Presentation / Pitch Deck URL (Google Slides / Canva / PDF)
                                                    </label>
                                                    {missionPresentationUrl && (
                                                        <a
                                                            href={missionPresentationUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-[11px] text-primary hover:underline font-bold flex items-center gap-0.5"
                                                        >
                                                            <span>Open Slides</span>
                                                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                                                        </a>
                                                    )}
                                                </div>
                                                <input
                                                    type="url"
                                                    value={missionPresentationUrl}
                                                    onChange={e => setMissionPresentationUrl(e.target.value)}
                                                    placeholder="e.g. https://docs.google.com/presentation/d/... or Canva / Drive link"
                                                    className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary text-xs font-mono text-on-surface"
                                                />
                                            </div>

                                            {/* Code Repository URL */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-sm text-primary">code</span>
                                                        Source Code Repository (GitHub / GitLab / Hardware Schematics)
                                                    </label>
                                                    {missionDocsUrl && (
                                                        <a
                                                            href={missionDocsUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-[11px] text-primary hover:underline font-bold flex items-center gap-0.5"
                                                        >
                                                            <span>View Repository</span>
                                                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                                                        </a>
                                                    )}
                                                </div>
                                                <input
                                                    type="url"
                                                    value={missionDocsUrl}
                                                    onChange={e => setMissionDocsUrl(e.target.value)}
                                                    placeholder="e.g. https://github.com/my-team/namkum-pipeline-telemetry"
                                                    className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary text-xs font-mono text-on-surface"
                                                />
                                            </div>

                                            {/* Working Prototype URL */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-sm text-primary">play_circle</span>
                                                        Live Working Prototype URL / Demo Walkthrough
                                                    </label>
                                                    {missionProtoUrl && (
                                                        <a
                                                            href={missionProtoUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-[11px] text-primary hover:underline font-bold flex items-center gap-0.5"
                                                        >
                                                            <span>Launch Demo</span>
                                                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                                                        </a>
                                                    )}
                                                </div>
                                                <input
                                                    type="url"
                                                    value={missionProtoUrl}
                                                    onChange={e => setMissionProtoUrl(e.target.value)}
                                                    placeholder="e.g. https://namkum-water-iot.vercel.app or YouTube Demo"
                                                    className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary text-xs font-mono text-on-surface"
                                                />
                                            </div>

                                            {/* Engineering Notes & Impact Summary */}
                                            <div>
                                                <label className="block text-xs font-bold text-on-surface mb-1">
                                                    Engineering Methodology &amp; Progress Summary
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={missionImpactReport}
                                                    onChange={e => setMissionImpactReport(e.target.value)}
                                                    placeholder="Describe your engineering architecture, telemetry sensor choices, deployment trials, or algorithmic approach..."
                                                    className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary text-xs text-on-surface leading-relaxed"
                                                />
                                            </div>

                                            {/* Milestone Progress Slider */}
                                            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-on-surface">Milestone Progress Slider</span>
                                                    <span className="font-mono font-bold text-primary text-sm">{missionProgress}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    step="5"
                                                    value={missionProgress}
                                                    onChange={e => setMissionProgress(Number(e.target.value))}
                                                    className="w-full accent-primary cursor-pointer"
                                                />
                                                <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
                                                    <span>0% (Initiation)</span>
                                                    <span>30% (PPT Deck)</span>
                                                    <span>70% (Working Prototype)</span>
                                                    <span>100% (Field Ready)</span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={savingMission}
                                                    className="px-5 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                >
                                                    {savingMission && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                                                    <span>{savingMission ? "Saving..." : "Save Milestone Deliverables"}</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleSubmitMissionForReview}
                                                    disabled={submitting || missionProgress < 100 || activeProject.status === 'submitted'}
                                                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                                                        missionProgress >= 100 && activeProject.status !== 'submitted'
                                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                                                            : 'bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed border border-outline-variant/30'
                                                    }`}
                                                    title={missionProgress < 100 ? "Reach 100% milestone progress to submit" : "Submit for Official Review"}
                                                >
                                                    {submitting && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                                                    <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                                                    <span>
                                                        {activeProject.status === 'submitted'
                                                            ? 'Submitted for Review'
                                                            : 'Submit to Government for Review'}
                                                    </span>
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Ground Reality Dossier & Team */}
                                    <div className="space-y-4">
                                        {/* Civic Dossier */}
                                        <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-outline-variant/30 space-y-3">
                                            <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2">
                                                <span className="material-symbols-outlined text-primary text-base">fact_check</span>
                                                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Ground Reality Dossier</h4>
                                            </div>

                                            <div>
                                                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Citizen's Original Grievance</p>
                                                <p className="text-xs text-on-surface bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 leading-relaxed max-h-36 overflow-y-auto">
                                                    {activeProject.report?.description || activeProject.description || "No citizen grievance description recorded."}
                                                </p>
                                            </div>

                                            {activeProject.report?.student_suitability_reason && (
                                                <div className="bg-[#c2edcb]/30 border border-[#3e644a]/20 rounded-xl p-3 text-[11px] text-[#24422e]">
                                                    <div className="flex items-center gap-1 font-bold mb-0.5">
                                                        <span className="material-symbols-outlined text-[14px]">psychology</span>
                                                        <span>AI Engineering Guidance</span>
                                                    </div>
                                                    <p className="leading-relaxed">{activeProject.report.student_suitability_reason}</p>
                                                </div>
                                            )}

                                            {Array.isArray(activeProject.report?.suggested_technologies) && activeProject.report.suggested_technologies.length > 0 && (
                                                <div>
                                                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Recommended Tech Stack</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {activeProject.report.suggested_technologies.map((t: string) => (
                                                            <span key={t} className="px-2 py-0.5 bg-surface-container-high text-on-surface text-[10px] rounded-md font-mono">{t}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Team Roster */}
                                        <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-outline-variant/30 space-y-3">
                                            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary text-base">group</span>
                                                    <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Active Capstone Team</h4>
                                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                                        {teamMembers.length} / 5 Members
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    disabled={teamMembers.length >= 5}
                                                    onClick={() => setTeamModalOpen(true)}
                                                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <span className="material-symbols-outlined text-xs">person_add</span>
                                                    <span>Add Teammate</span>
                                                </button>
                                            </div>

                                            {teamMembers.length === 1 && (
                                                <div className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-on-surface-variant">
                                                    <span className="material-symbols-outlined text-sm text-primary shrink-0">badge</span>
                                                    <span><strong>Solo Innovator (Min = 1):</strong> You are leading this capstone individually. You can invite up to 4 more teammates if you need extra hands!</span>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                {teamMembers.map((tm: any, idx: number) => {
                                                    const isSolo = teamMembers.length <= 1;
                                                    const isLead = tm.is_leader || idx === 0;
                                                    return (
                                                        <div key={tm.id || idx} className="flex items-center justify-between text-xs bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/15">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center font-mono shrink-0">
                                                                    {tm.initials || (tm.name || "ST").slice(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <p className="font-bold text-on-surface">{tm.name}</p>
                                                                        {isLead && (
                                                                            <span className="text-[9px] bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-md font-semibold">
                                                                                👑 Lead
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[10px] text-on-surface-variant">{tm.role}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-mono text-outline hidden sm:inline">{tm.apaar_id}</span>
                                                                {isSolo ? (
                                                                    <span
                                                                        className="p-1 text-outline/30 cursor-not-allowed"
                                                                        title="Minimum team size is 1 member. Cannot remove sole innovator. Use 'Release Problem Statement' below if you want to drop this project."
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">lock</span>
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveTeamMember(tm.id || idx, tm.name)}
                                                                        className="p-1 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                                                                        title={`Remove ${tm.name} from team`}
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">person_remove</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Escape Hatch: Release Problem Statement */}
                                            <div className="pt-2 border-t border-outline-variant/20">
                                                <button
                                                    type="button"
                                                    onClick={() => setReleaseModalOpen(true)}
                                                    className="w-full py-2 px-3 rounded-xl border border-error/30 text-error hover:bg-error/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                                    title="Stuck or unable to complete prototype? Release problem statement to unlock your slot."
                                                >
                                                    <span className="material-symbols-outlined text-sm">flag</span>
                                                    <span>Release / Forfeit Problem Statement</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Empty State when no active mission */
                            <div className="bg-surface-container-lowest rounded-3xl p-8 sm:p-12 text-center shadow-sm border border-outline-variant/30 max-w-xl mx-auto space-y-4 my-8">
                                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                                    <span className="material-symbols-outlined text-3xl">rocket_launch</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold font-heading text-on-surface">No Active Capstone Mission Selected</h2>
                                    <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed max-w-md mx-auto">
                                        You have 1 open capstone slot available! Choose a real-world civic problem statement to activate your dedicated team workspace, milestone deadlines, presentation deck submissions, and countdown timers.
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setActiveNav("Issues"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                        className="px-6 py-3 rounded-2xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary/90 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-sm">explore</span>
                                        <span>Browse Open Civic Challenges</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* 2. OVERVIEW & ALL PROJECTS VIEW */}
                {activeNav === "Dashboard" && (
                    <motion.div variants={itemVariants} className="space-y-6">
                        {/* Active Mission Quick Banner if in progress */}
                        {activeProject && (
                            <div className="bg-gradient-to-r from-primary/15 via-primary-container/20 to-surface-container-lowest border border-primary/30 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
                                        <span className="material-symbols-outlined text-xl">rocket_launch</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Active Capstone Mission</span>
                                            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-500/20 text-stone-900 dark:text-amber-100 font-bold">
                                                {timeRemaining.days}d {timeRemaining.hours}h left (Phase {timeRemaining.phaseIndex})
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-on-surface mt-0.5">{activeProject.title}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setActiveNav("Mission"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                    className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-sm hover:bg-primary/90 active:scale-95 transition-all shrink-0 cursor-pointer self-start sm:self-center"
                                >
                                    Open Mission Control →
                                </button>
                            </div>
                        )}

                        {/* Welcome Card */}
                        <motion.section variants={itemVariants} className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-outline-variant/30 flex items-center justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/20 text-primary font-semibold text-xs">
                                        <span className="material-symbols-outlined text-sm" data-icon="verified">verified</span>
                                        {userData?.institution || 'SocioSolve Student'}
                                    </span>
                                    {linkedinUrl && (
                                        <a
                                            href={linkedinUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0077b5]/10 text-[#0077b5] text-xs font-bold hover:bg-[#0077b5]/20 transition-colors"
                                            title="View LinkedIn Profile"
                                        >
                                            <span className="text-[11px] font-mono">in</span>
                                            <span>LinkedIn</span>
                                        </a>
                                    )}
                                    {githubUrl && (
                                        <a
                                            href={githubUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-container-highest transition-colors border border-outline-variant/30"
                                            title="View GitHub Repos"
                                        >
                                            <span className="material-symbols-outlined text-xs">code</span>
                                            <span>GitHub</span>
                                        </a>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setProfileModalOpen(true)}
                                        className="text-xs text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-xs">edit</span>
                                        <span>Edit Profile</span>
                                    </button>
                                </div>
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
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]" data-icon="edit">edit</span>{p.status !== 'completed' ? 'Open Mission' : 'Manage'}</span>
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
                                        onClick={() => { setActiveNav('Issues'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className="px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-semibold active:scale-95 transition-transform cursor-pointer"
                                    >
                                        Browse Problems
                                    </button>
                                </div>
                            )}
                        </motion.section>

                        {/* Student Innovation Team (Point 5) */}
                        <motion.section variants={itemVariants} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold font-heading text-on-surface flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary" data-icon="groups">groups</span>
                                        Student Capstone Team ({teamMembers.length} Members)
                                    </h2>
                                    <p className="text-xs text-on-surface-variant">Interdisciplinary student engineering team authenticated via APAAR Digital ID</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setTeamModalOpen(true)}
                                    className="px-3.5 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                    <span className="material-symbols-outlined text-sm">person_add</span>
                                    Add Teammate
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {teamMembers.map((m, idx) => (
                                    <div key={idx} className="bg-surface-container-lowest rounded-2xl p-3.5 whisper-border ambient-shadow flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs font-mono ring-1 ring-primary/20">
                                            {m.initials || m.name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-on-surface truncate">{m.name}</p>
                                                <span className="text-[9px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full font-semibold">Verified</span>
                                            </div>
                                            <p className="text-[11px] text-on-surface-variant truncate">{m.role}</p>
                                            <span className="text-[10px] font-mono text-outline block">{m.apaar_id}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                    </motion.div>
                )}

                {/* 3. BROWSE OPEN CIVIC CHALLENGES VIEW */}
                {activeNav === "Issues" && (
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
                        {/* Active Capstone Quota Status Indicator */}
                        {!canAdopt ? (
                            <div className="bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                                <div className="flex items-start sm:items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 font-bold shadow-xs">
                                        <span className="material-symbols-outlined text-xl">lock</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-stone-900 dark:text-amber-100">
                                            Active Capstone Limit Reached (1/1 Active)
                                        </p>
                                        <p className="text-xs text-stone-800 dark:text-stone-300 mt-0.5 leading-relaxed">
                                            You are currently leading <strong className="text-stone-950 dark:text-white font-bold">"{activeProjects[0]?.title || 'Active Capstone'}"</strong>. Complete your active project before adopting another.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setActiveNav("Mission"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 rounded-xl text-xs font-bold shrink-0 transition-all self-start sm:self-center cursor-pointer shadow-xs whitespace-nowrap"
                                >
                                    Open Mission Workspace →
                                </button>
                            </div>
                        ) : (
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-on-surface">
                                <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-primary text-xl">workspace_premium</span>
                                    <div>
                                        <p className="text-xs font-bold text-on-surface">Capstone Adoption Quota: 0 / 1 Active</p>
                                        <p className="text-[11px] text-on-surface-variant">You have 1 open capstone slot available. Choose any real-world civic problem below to adopt as your student project.</p>
                                    </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shrink-0 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                    Slot Available
                                </span>
                            </div>
                        )}

                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {['All', 'Roads', 'Water', 'Sanitation', 'Health', 'Education'].map(cat => (
                                <button 
                                    key={cat} 
                                    type="button" 
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${selectedCategory.toLowerCase() === cat.toLowerCase() ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'}`}
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
                                        {(() => {
                                            const normScore = issue.priority_score != null 
                                                ? (issue.priority_score <= 1.0 ? Math.round(issue.priority_score * 100) : Math.round(issue.priority_score)) 
                                                : null;
                                            const isHigh = (normScore != null && normScore > 70) || issue.priority === 'High';
                                            return (
                                                <span className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${isHigh ? 'bg-error-container text-on-error-container font-semibold' : 'bg-secondary-container text-on-secondary-container'}`}>
                                                    <span className="material-symbols-outlined text-[12px]" data-icon="flag">flag</span>
                                                    {normScore != null ? `${normScore > 70 ? 'High Priority' : 'Priority'} (${normScore}/100)` : (issue.priority || 'Normal')}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <h3 className="font-bold text-on-surface text-base mb-1">{issue.title || issue.description?.slice(0, 50)}</h3>
                                    {(() => {
                                        const loc = getHumanLocation(issue);
                                        return (
                                            <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-2">
                                                <span className="material-symbols-outlined text-[15px] text-primary">location_on</span>
                                                <span><strong>{loc.name}</strong> • {loc.landmark}</span>
                                            </div>
                                        );
                                    })()}
                                    <p className="text-xs text-on-surface-variant mb-2 line-clamp-3 leading-relaxed">{issue.description || issue.challenge_summary}</p>
                                    
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
                                        {issue.is_already_adopted ? (
                                            <button 
                                                type="button" 
                                                disabled
                                                className="px-3.5 py-1.5 bg-secondary-container/70 text-on-secondary-container rounded-full text-xs font-semibold cursor-not-allowed flex items-center gap-1.5 opacity-85"
                                                title="You or your team has already adopted this problem statement"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">task_alt</span>
                                                Already Adopted
                                            </button>
                                        ) : !canAdopt ? (
                                            <button 
                                                type="button" 
                                                disabled
                                                className="px-3.5 py-1.5 bg-surface-container-high text-on-surface-variant/70 border border-outline-variant/30 rounded-full text-xs font-semibold cursor-not-allowed flex items-center gap-1.5"
                                                title="Active Capstone Limit: Complete your existing project before adopting a new challenge"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">lock</span>
                                                Quota Full (1/1)
                                            </button>
                                        ) : (
                                            <button 
                                                type="button" 
                                                onClick={() => openAdoptModal(issue)}
                                                className="px-4 py-1.5 bg-primary text-on-primary rounded-full text-xs font-bold shadow-sm hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[14px]" data-icon="add_task">add_task</span>
                                                Adopt Problem
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>
                )}
            </motion.main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-outline-variant/30">
                {[
                    { label: 'Mission', icon: 'rocket_launch', navKey: 'Mission', badge: !!activeProject },
                    { label: 'Overview', icon: 'dashboard', navKey: 'Dashboard' },
                    { label: 'Challenges', icon: 'explore', navKey: 'Issues' },
                    { label: 'Profile', icon: 'person', action: () => { setProfileModalOpen(true); } }
                ].map(nav => (
                    <button 
                        key={nav.label} 
                        type="button" 
                        onClick={() => {
                            if (nav.action) nav.action();
                            else if (nav.navKey) {
                                setActiveNav(nav.navKey);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                        className={`relative flex flex-col items-center justify-center min-w-[64px] px-2 py-1.5 rounded-xl transition-all cursor-pointer ${
                            (nav.navKey && activeNav === nav.navKey) || (nav.label === 'Profile' && profileModalOpen)
                                ? 'bg-primary-container/20 text-primary font-bold'
                                : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        <span className="material-symbols-outlined text-xl" data-icon={nav.icon}>{nav.icon}</span>
                        <span className="text-[10px] mt-1 font-semibold">{nav.label}</span>
                        {nav.badge && (
                            <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Adopt Problem Modal */}
            {adoptModalOpen && selectedIssue && (() => {
                const loc = getHumanLocation(selectedIssue);
                return (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-scrim/50 backdrop-blur-sm overflow-y-auto">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-outline-variant/30 my-8 space-y-4">
                            {/* Modal Header */}
                            <div className="flex items-start justify-between gap-3 border-b border-outline-variant/20 pb-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                            {selectedIssue.category || "Civic Problem"}
                                        </span>
                                        <span className="text-[11px] font-mono text-outline">
                                            #{String(selectedIssue.id).padStart(4, '0')}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-on-surface leading-snug">
                                        {selectedIssue.title || selectedIssue.challenge_summary || `Civic Grievance #${selectedIssue.id}`}
                                    </h3>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setAdoptModalOpen(false)} 
                                    className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                                    aria-label="Close"
                                >
                                    <span className="material-symbols-outlined text-xl" data-icon="close">close</span>
                                </button>
                            </div>

                            {/* Civic Problem Ground Truth Briefing in Human Language */}
                            <div className="bg-surface-container-low/70 rounded-2xl p-4 border border-outline-variant/20 space-y-3.5">
                                {/* Where It Is (Location in Human Language) */}
                                <div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
                                        <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                                        <span>Where It Is (Ground Location)</span>
                                    </div>
                                    <div className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/20 flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-bold text-on-surface">{loc.name}</p>
                                            <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">{loc.landmark}</p>
                                        </div>
                                        {selectedIssue.gps_lat && selectedIssue.gps_lon && (
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${selectedIssue.gps_lat},${selectedIssue.gps_lon}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-primary hover:bg-primary hover:text-on-primary text-[11px] font-semibold transition-colors"
                                                title="Open in Google Maps"
                                            >
                                                <span>View on Map</span>
                                                <span className="material-symbols-outlined text-xs">open_in_new</span>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Problem Description in Human Language */}
                                <div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant mb-1">
                                        <span className="material-symbols-outlined text-sm text-outline">description</span>
                                        <span>Citizen Problem Description</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-on-surface leading-relaxed bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/20 whitespace-pre-line">
                                        {selectedIssue.description || selectedIssue.challenge_summary || "No detailed description provided by citizen."}
                                    </p>
                                </div>

                                {/* AI Engineering Guidance */}
                                {selectedIssue.student_suitability_reason && (
                                    <div className="flex items-start gap-2 bg-[#c2edcb]/30 border border-[#3e644a]/20 rounded-xl p-2.5 text-[11px] text-[#24422e]">
                                        <span className="material-symbols-outlined text-[15px] text-[#3e644a] shrink-0 mt-0.5">psychology</span>
                                        <div>
                                            <span className="font-bold">AI Triage Note: </span>
                                            <span>{selectedIssue.student_suitability_reason}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Active Capstone Quota Notice */}
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-on-surface">
                                <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">workspace_premium</span>
                                <div>
                                    <p className="font-bold text-on-surface">Academic Capstone Commitment (1/1 Quota)</p>
                                    <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                                        Adopting this civic challenge commits your active capstone slot. To maintain institutional accountability and prevent problem hoarding, students can lead 1 active project at a time until completion.
                                    </p>
                                </div>
                            </div>

                            {/* Adoption Form */}
                            <form onSubmit={handleAdoptProblem} className="space-y-3.5 pt-1">
                                <div>
                                    <label className="block text-xs font-bold text-on-surface mb-1">
                                        Capstone Project Title
                                    </label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={projectTitle} 
                                        onChange={e => setProjectTitle(e.target.value)} 
                                        className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-on-surface font-medium" 
                                        placeholder="e.g. IoT Acoustic Leak Detector & Auto-Shutoff" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-on-surface mb-1">
                                        Proposed Engineering Solution / Approach
                                    </label>
                                    <textarea 
                                        rows={3}
                                        value={projectDesc} 
                                        onChange={e => setProjectDesc(e.target.value)} 
                                        className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-on-surface leading-relaxed" 
                                        placeholder="Describe how your student team plans to solve this civic issue using IoT, AI, or engineering methods..." 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-on-surface mb-1">
                                        Faculty Mentor Name (Optional)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={mentorName} 
                                        onChange={e => setMentorName(e.target.value)} 
                                        className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-on-surface" 
                                        placeholder="e.g. Dr. R. K. Sen (BIT Mesra)" 
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-outline-variant/20">
                                    <button 
                                        type="button" 
                                        disabled={submitting} 
                                        onClick={() => setAdoptModalOpen(false)} 
                                        className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface rounded-xl hover:bg-surface-container transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={submitting} 
                                        className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                    >
                                        {submitting && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                                        <span>{submitting ? "Adopting..." : "Confirm & Form Team"}</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                );
            })()}

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
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">4-Phase Solution Milestones (Point 7)</label>
                                        <span className="text-xs font-mono font-bold text-primary">{editProgress}% Completed</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                            { pct: 25, label: "Phase 1: Architecture", desc: "Formulation & Sensor Specs" },
                                            { pct: 50, label: "Phase 2: Prototype", desc: "Working Lab Hardware/App" },
                                            { pct: 75, label: "Phase 3: Field Pilot", desc: "On-site Ward Testing" },
                                            { pct: 100, label: "Phase 4: Deployment", desc: "Govt Handover Complete" }
                                        ].map(phase => (
                                            <button
                                                key={phase.pct}
                                                type="button"
                                                onClick={() => setEditProgress(phase.pct)}
                                                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                                                    editProgress >= phase.pct 
                                                        ? 'bg-primary/10 border-primary text-primary font-semibold' 
                                                        : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-outline'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between text-[11px] mb-1">
                                                    <span className="font-bold font-mono">{phase.pct}%</span>
                                                    {editProgress >= phase.pct && <span className="material-symbols-outlined text-sm text-primary">check_circle</span>}
                                                </div>
                                                <p className="text-[11px] font-bold truncate">{phase.label}</p>
                                                <p className="text-[10px] opacity-75 truncate">{phase.desc}</p>
                                            </button>
                                        ))}
                                    </div>

                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        value={editProgress} 
                                        onChange={e => setEditProgress(Number(e.target.value))} 
                                        className="w-full accent-primary mt-1" 
                                    />
                                </div>
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
                                    Number(editProgress) >= 100 ? (
                                        <button 
                                            type="button" 
                                            disabled={submitting} 
                                            onClick={() => handleSubmitProject(selectedProject.id)}
                                            className="px-4 py-2 bg-secondary text-on-secondary rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                                        >
                                            <span className="material-symbols-outlined text-sm" data-icon="assignment_turned_in">assignment_turned_in</span>
                                            Submit for Review
                                        </button>
                                    ) : (
                                        <div 
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface-variant text-[11px] font-medium select-none"
                                            title="Milestone progress must reach 100% (Ground Deployment) to submit for mentor review"
                                        >
                                            <span className="material-symbols-outlined text-[14px] text-outline">lock</span>
                                            <span>Reach 100% to Submit ({editProgress}%)</span>
                                        </div>
                                    )
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

            {/* Add Teammate Modal */}
            {teamModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-scrim/50 backdrop-blur-md">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/30">
                        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono uppercase font-bold text-primary tracking-widest">Student Team-Up</span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                        {teamMembers.length} / 5 Members
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-on-surface flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary">person_add</span>
                                    Add Interdisciplinary Teammate
                                </h3>
                            </div>
                            <button type="button" onClick={() => setTeamModalOpen(false)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleAddTeamMember} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Student Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newMemberName}
                                    onChange={e => setNewMemberName(e.target.value)}
                                    placeholder="e.g. Sneha Murmu"
                                    className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:ring-2 focus:ring-primary text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">APAAR Digital ID (Ministry of Education)</label>
                                <input
                                    type="text"
                                    value={newMemberApaar}
                                    onChange={e => setNewMemberApaar(e.target.value)}
                                    placeholder="e.g. APAAR-JH-5521"
                                    className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:ring-2 focus:ring-primary text-sm font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Role / Domain Focus</label>
                                <select
                                    value={newMemberRole}
                                    onChange={e => setNewMemberRole(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:ring-2 focus:ring-primary text-sm"
                                >
                                    <option value="Hardware &amp; IoT Engineer">Hardware &amp; IoT Engineer</option>
                                    <option value="Fullstack &amp; Mobile Developer">Fullstack &amp; Mobile Developer</option>
                                    <option value="GIS &amp; Remote Sensing Analyst">GIS &amp; Remote Sensing Analyst</option>
                                    <option value="Civil &amp; Environmental Specialist">Civil &amp; Environmental Specialist</option>
                                    <option value="AI &amp; Data Pipeline Engineer">AI &amp; Data Pipeline Engineer</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                                <button type="button" onClick={() => setTeamModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-on-surface-variant cursor-pointer">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer">
                                    <span className="material-symbols-outlined text-sm">check</span>
                                    Add to Team
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Release / Forfeit Problem Statement Modal */}
            {releaseModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-scrim/50 backdrop-blur-md">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/30 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center">
                                    <span className="material-symbols-outlined text-lg">flag</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-on-surface">Release Problem Statement</h3>
                                    <p className="text-[11px] text-on-surface-variant">Forfeit challenge &amp; unlock quota slot</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReleaseModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <div className="bg-error/5 border border-error/20 rounded-2xl p-3.5 space-y-2 text-xs text-on-surface-variant">
                            <p className="font-bold text-error flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">warning</span>
                                What happens when you release?
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                                <li>Your <strong>1-project capstone quota is unlocked</strong> so you can adopt another civic challenge immediately.</li>
                                <li>The civic problem statement is returned to the public pool so other engineering teams can solve it.</li>
                                <li>All team members are relieved from this mission control workspace.</li>
                            </ul>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-on-surface mb-1.5">
                                Reason for Releasing (Optional Feedback)
                            </label>
                            <textarea
                                rows={3}
                                value={releaseReason}
                                onChange={e => setReleaseReason(e.target.value)}
                                placeholder="e.g. Lacks ultrasonic flow sensor hardware, team pivoted to AI data challenge..."
                                className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:ring-2 focus:ring-primary text-xs leading-relaxed"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
                            <button
                                type="button"
                                disabled={releasing}
                                onClick={() => setReleaseModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl cursor-pointer"
                            >
                                Keep Working
                            </button>
                            <button
                                type="button"
                                disabled={releasing}
                                onClick={handleReleaseProject}
                                className="px-4 py-2.5 rounded-xl bg-error text-on-error text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {releasing ? (
                                    <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                                ) : (
                                    <span className="material-symbols-outlined text-sm">done</span>
                                )}
                                <span>Confirm Release</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Student Academic Profile & Credentials Modal */}
            {profileModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-scrim/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 30 }} 
                        className="bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl border border-outline-variant/30 flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden"
                    >
                        {/* Mobile Handle */}
                        <div className="pt-2.5 pb-1 sm:hidden flex justify-center shrink-0">
                            <div className="w-10 h-1 bg-outline-variant/40 rounded-full" />
                        </div>

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/20 shrink-0">
                            <div>
                                <span className="text-[9px] font-mono uppercase font-bold text-primary tracking-widest block">Academic Bank of Credits (ABC)</span>
                                <h3 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-xl">badge</span>
                                    Student Academic Credentials
                                </h3>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setProfileModalOpen(false)} 
                                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
                                aria-label="Close credentials"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Scrollable Content Body */}
                        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 overscroll-contain">
                            {/* Digital Student ID Card - Compact */}
                            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-800 to-primary text-white shadow-sm relative overflow-hidden">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="text-[9px] font-mono uppercase opacity-85 tracking-wider block">Government of India · APAAR Digital ID</span>
                                        <p className="text-sm sm:text-base font-extrabold mt-0.5">{userData?.name || "Aravind Kumar"}</p>
                                        <p className="text-[11px] opacity-90 leading-tight">{userData?.institution || "BIT Mesra (Birla Institute of Technology)"}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-lg">qr_code_2</span>
                                    </div>
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center justify-between text-[11px] font-mono">
                                    <div>
                                        <span className="text-[8.5px] uppercase opacity-75 block">APAAR Number</span>
                                        <span className="font-bold tracking-wider">{userData?.apaar_id || "APAAR-12345"}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8.5px] uppercase opacity-75 block">Status</span>
                                        <span className="font-bold text-emerald-200 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                                            Verified
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Skills Summary - Compact Pills */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant font-mono">Verified Skills ({skills.length})</h4>
                                    <span className="text-[10px] text-primary font-medium">NEP 2020 Aligned</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {skills.length === 0 ? (
                                        <span className="text-xs text-on-surface-variant">No skills recorded yet.</span>
                                    ) : (
                                        skills.map((s, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-surface-container-high rounded-md text-[11px] font-medium text-on-surface border border-outline-variant/30 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px] text-primary">check_circle</span>
                                                {s.skill_name}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Professional Profiles: LinkedIn & GitHub - Compact */}
                            <div className="pt-2.5 border-t border-outline-variant/20 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface font-mono flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs text-primary">public</span>
                                        Public Recruiter Profiles
                                    </h4>
                                    <span className="text-[9.5px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">
                                        Visible to Industry
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <label className="text-[10.5px] font-semibold text-on-surface-variant flex items-center justify-between mb-0.5">
                                            <span>LinkedIn Profile URL</span>
                                            {linkedinUrl && (
                                                <a href={linkedinUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[10px] flex items-center gap-0.5 font-medium">
                                                    <span>View Profile</span>
                                                    <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                                </a>
                                            )}
                                        </label>
                                        <input
                                            type="url"
                                            value={linkedinUrl}
                                            onChange={(e) => setLinkedinUrl(e.target.value)}
                                            placeholder="https://linkedin.com/in/your-profile"
                                            className="w-full text-xs px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 focus:ring-2 focus:ring-primary outline-none text-on-surface"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10.5px] font-semibold text-on-surface-variant flex items-center justify-between mb-0.5">
                                            <span>GitHub / Project Portfolio URL</span>
                                            {githubUrl && (
                                                <a href={githubUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[10px] flex items-center gap-0.5 font-medium">
                                                    <span>View Repos</span>
                                                    <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                                </a>
                                            )}
                                        </label>
                                        <input
                                            type="url"
                                            value={githubUrl}
                                            onChange={(e) => setGithubUrl(e.target.value)}
                                            placeholder="https://github.com/your-username"
                                            className="w-full text-xs px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 focus:ring-2 focus:ring-primary outline-none text-on-surface"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Action Footer - ALWAYS VISIBLE */}
                        <div className="p-3 sm:p-4 bg-surface-container-lowest border-t border-outline-variant/20 shrink-0 flex items-center justify-between gap-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-10">
                            <button
                                type="button"
                                onClick={handleSaveSocials}
                                className="flex-1 py-2.5 px-3 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            >
                                <span className="material-symbols-outlined text-sm">save</span>
                                <span>Save URLs</span>
                            </button>

                            <button 
                                type="button" 
                                onClick={() => { handleSaveSocials(); setProfileModalOpen(false); }} 
                                className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            >
                                <span>Done</span>
                                <span className="material-symbols-outlined text-sm">check</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
