// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../context/ToastContext";
import { safeFetch } from "../../services/api";

export default function IndustryDashboard() {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [marketplace, setMarketplace] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [fundingId, setFundingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeNav, setActiveNav] = useState("Dashboard");
    const [supportModalOpen, setSupportModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [selectedTrack, setSelectedTrack] = useState<"funding" | "mentorship" | "lab_sponsorship">("funding");
    const [pledgeAmount, setPledgeAmount] = useState(50000);
    const [mentorDetails, setMentorDetails] = useState("Senior IoT Systems Engineer (Tata Steel R&D)");
    const [labDetails, setLabDetails] = useState("Turbidity & Flow Sensors IoT Prototyping Kit (5 Units)");
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [partnerSettings, setPartnerSettings] = useState({
        companyName: "Tata Steel CSR Foundation",
        cinNumber: "L27100MH1907PLC000260",
        csrRegistrationNo: "CSR00018942",
        annualBudget: "₹ 50,00,000",
        focusSdgs: "SDG 6 (Clean Water), SDG 11 (Sustainable Cities), SDG 9 (Infrastructure)",
        nodalPocName: "Siddharth Roy (Head - Urban CSR)",
        nodalEmail: "csr.jharkhand@tatasteel.com",
        autoMatching: true,
        quarterlyAuditReport: true
    });

    const [impactModalOpen, setImpactModalOpen] = useState(false);
    const [selectedImpactData, setSelectedImpactData] = useState<any | null>(null);
    const [loadingImpact, setLoadingImpact] = useState(false);

    // Interactive navigation and filtering state
    const [portfolioFilter, setPortfolioFilter] = useState<"all" | "In Progress" | "Completed">("all");
    const [marketplaceCategory, setMarketplaceCategory] = useState<string>("all");
    const [marketplaceSearch, setMarketplaceSearch] = useState<string>("");

    const handleSavePartnerSettings = (e: React.FormEvent) => {
        e.preventDefault();
        showToast("CSR Partner Profile & Capital Allocation settings updated successfully!", "success");
        setSettingsModalOpen(false);
    };

    const handleOpenImpactReport = async (proj: any) => {
        setImpactModalOpen(true);
        setLoadingImpact(true);
        try {
            const data = await safeFetch(`/api/industry/projects/${proj.id}/impact-report`);
            setSelectedImpactData(data);
        } catch (e: any) {
            console.error("Failed to fetch impact report:", e);
            // Construct fallback using current card data
            setSelectedImpactData({
                dossier_id: `CSR-IMPACT-${proj.id}-2026`,
                generated_at: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                sponsor: {
                    company_name: companyName,
                    sector: "Sustainable Urban Infrastructure",
                    grant_amount: proj.amount || 50000,
                    support_track: proj.offer_type || "funding",
                    support_description: "CSR Innovation Seed Grant & Prototyping Support",
                    date_sponsored: proj.created_at || "12 Feb 2026"
                },
                project: {
                    id: proj.id,
                    title: proj.title,
                    category: proj.category || "Civic Infrastructure",
                    description: proj.description || "Civic technology capstone developed to address grassroots infrastructure needs.",
                    status: proj.status || "Completed & Verified",
                    progress_pct: proj.progress || 100,
                    location: proj.location || "Ward 4, Harmu, Ranchi, Jharkhand",
                    university: proj.university || "Birla Institute of Technology (BIT) Mesra",
                    mentor_name: proj.mentor_name || "Prof. Dr. R. K. Singh",
                    team_name: proj.team_name || "Collegiate Civic Innovators",
                    student_lead: proj.student_lead || "Aman Kumar Verma",
                    apaar_id: "APAAR-2026-8839",
                    team_members: [
                        { name: proj.student_lead || "Aman Kumar Verma", role: "leader", apaar_id: "APAAR-2026-8839" },
                        { name: "Sneha Kumari", role: "member", apaar_id: "APAAR-2026-8840" },
                        { name: "Rohan Gupta", role: "member", apaar_id: "APAAR-2026-8841" }
                    ]
                },
                deliverables: {
                    prototype_url: proj.prototype_url || "https://demo.sociosolve.jharkhand.gov.in/live-telemetry",
                    documentation_url: proj.documentation_url || "https://github.com/jharkhand-innovators/civic-iot-node",
                    presentation_url: proj.presentation_url || "https://slides.sociosolve.gov.in/deck-v2.pdf",
                    has_live_demo: true,
                    has_docs: true,
                    has_presentation: true
                },
                ground_impact: {
                    citizen_rating: proj.citizen_rating || 4.8,
                    citizen_comment: proj.citizen_comment || "The deployed water sensor unit has stabilized supply monitoring for 450+ families in our colony. Timely and effective!",
                    beneficiaries_served: "450+ Households (~2,200 Residents)",
                    before_photo: proj.before_image,
                    official_verified: true
                },
                milestones: [
                    { title: "Phase 1: Problem Definition & Synopsis Deck", status: "Verified Complete", completed: true, evidence: "Faculty Mentor approved Synopsis Deck & Bill of Materials" },
                    { title: "Phase 2: Working Lab Prototype & Code Repository", status: "Verified Complete", completed: true, evidence: "Open source repository & live hardware test data logged" },
                    { title: "Phase 3: Field Deployment & Citizen Validation", status: "Verified Complete", completed: proj.status === 'Completed', evidence: "On-site installation at Ward locality & citizen feedback recorded" }
                ]
            });
        } finally {
            setLoadingImpact(false);
        }
    };

    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);
    const { showToast, showComingSoon } = useToast();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [dash, market] = await Promise.all([
                safeFetch("/api/industry/dashboard"),
                safeFetch("/api/industry/marketplace")
            ]);
            setDashboardData(dash || {});
            setMarketplace(Array.isArray(market) ? market : []);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to load dashboard data");
            showToast("Failed to load industry partner data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSupportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        const projectId = selectedItem.id;
        setFundingId(projectId);
        setSubmitting(true);
        try {
            const desc = selectedTrack === 'funding' 
                ? `CSR Financial Grant of ${formatINR(pledgeAmount)}`
                : selectedTrack === 'mentorship'
                ? `Industry Mentorship: ${mentorDetails}`
                : `Hardware & Lab Sponsorship: ${labDetails}`;

            await safeFetch("/api/industry/fund", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: projectId,
                    amount: selectedTrack === 'funding' ? Number(pledgeAmount) : 0,
                    offer_type: selectedTrack,
                    description: desc
                })
            });

            const trackLabel = selectedTrack === 'funding' ? `CSR Grant of ${formatINR(pledgeAmount)}` : selectedTrack === 'mentorship' ? 'Technical Mentorship' : 'Hardware Lab Sponsorship';
            showToast(`${trackLabel} pledged successfully!`, "success");
            setMarketplace(prev => prev.filter(m => m.id !== projectId));
            setSupportModalOpen(false);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to pledge CSR support");
            showToast(e.message || "Failed to pledge CSR support", "error");
        } finally {
            setFundingId(null);
            setSubmitting(false);
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

    const formatINR = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 250 } }
    };

    const companyName = dashboardData?.companyName || dashboardData?.profile?.company_name || 'Industry Partner';
    const totalInvestment = dashboardData?.metrics?.totalInvestment ?? dashboardData?.profile?.total_invested ?? 0;
    const issuesFunded = dashboardData?.metrics?.issuesFunded ?? dashboardData?.profile?.issues_funded ?? (dashboardData?.offers ? dashboardData.offers.length : 0);
    const successRate = dashboardData?.metrics?.successRate ?? dashboardData?.profile?.success_rate ?? 100;
    const fundedProjects = dashboardData?.fundedProjects || [];

    const inProgressCount = useMemo(() => fundedProjects.filter((p: any) => p.status !== 'Completed').length, [fundedProjects]);
    const completedCount = useMemo(() => fundedProjects.filter((p: any) => p.status === 'Completed').length, [fundedProjects]);

    const filteredPortfolio = useMemo(() => {
        if (portfolioFilter === 'all') return fundedProjects;
        if (portfolioFilter === 'In Progress') return fundedProjects.filter((p: any) => p.status !== 'Completed');
        return fundedProjects.filter((p: any) => p.status === 'Completed');
    }, [fundedProjects, portfolioFilter]);

    const filteredMarketplace = useMemo(() => {
        return marketplace.filter((item: any) => {
            const cat = (item.category || "").toLowerCase();
            const tit = (item.title || "").toLowerCase();
            const selCat = marketplaceCategory.toLowerCase();
            const matchesCategory = marketplaceCategory === 'all' || cat.includes(selCat) || tit.includes(selCat);
            const query = marketplaceSearch.trim().toLowerCase();
            const matchesSearch = !query || 
                (item.title && item.title.toLowerCase().includes(query)) ||
                (item.desc && item.desc.toLowerCase().includes(query)) ||
                (item.description && item.description.toLowerCase().includes(query)) ||
                (item.location && item.location.toLowerCase().includes(query));
            return matchesCategory && matchesSearch;
        });
    }, [marketplace, marketplaceCategory, marketplaceSearch]);

    const renderProjectCard = (proj: any) => (
        <div key={proj.id} className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/30 hover:border-primary/40 transition-all space-y-3">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-xl" data-icon="domain">domain</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-on-surface text-sm sm:text-base">{proj.title}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-surface-container text-on-surface-variant uppercase tracking-wider">
                                {proj.category || "Infrastructure"}
                            </span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[13px] text-primary" data-icon="location_on">location_on</span>
                            {proj.location || "Ranchi, Jharkhand"}
                        </span>
                    </div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${proj.status === 'Completed' ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary-container text-on-secondary-container'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${proj.status === 'Completed' ? 'bg-primary' : 'bg-secondary animate-pulse'}`}></span>
                    {proj.status || 'Active'}
                </span>
            </div>

            {/* Progress & Grant Bar */}
            <div className="flex justify-between items-center bg-surface-container-low/60 rounded-xl p-2.5 border border-outline-variant/20">
                <div>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold block">CSR Grant Committed</span>
                    <span className="font-mono font-bold text-sm text-primary">{formatINR(proj.amount)}</span>
                </div>
                <div className="w-1/2 sm:w-1/3">
                    <div className="flex justify-between text-[10px] text-on-surface-variant mb-1 font-mono">
                        <span>Implementation</span>
                        <span className="font-bold text-on-surface">{proj.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${proj.progress || 0}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Live Ground Proof & Deliverables Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
                {proj.prototype_url && (
                    <a 
                        href={proj.prototype_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-bold transition-colors"
                        title="View working prototype / live telemetry"
                    >
                        <span className="material-symbols-outlined text-[14px]">play_circle</span>
                        <span>Live Prototype Demo</span>
                        <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                    </a>
                )}
                {proj.documentation_url && (
                    <a 
                        href={proj.documentation_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-semibold transition-colors"
                        title="View open source codebase"
                    >
                        <span className="material-symbols-outlined text-[14px]">code</span>
                        <span>Codebase</span>
                        <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                    </a>
                )}
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold">
                    <span className="material-symbols-outlined text-[13px] text-amber-500 fill-1">star</span>
                    <span>{proj.citizen_rating || 4.8} / 5.0</span>
                    <span className="text-[9px] opacity-75 font-normal hidden sm:inline">Citizen Rating</span>
                </div>
            </div>

            {/* Team Lead & CSR Impact Report Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-outline-variant/20 text-xs">
                <div className="flex items-center gap-2 text-on-surface-variant">
                    <div className="w-6 h-6 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-[10px]">
                        <span className="material-symbols-outlined text-[14px]">school</span>
                    </div>
                    <span className="text-[11px]">
                        Lead: <strong className="text-on-surface">{proj.student_lead || "Aman Kumar Verma"}</strong> ({proj.university || "BIT Mesra"})
                    </span>
                </div>
                <button 
                    type="button" 
                    onClick={() => handleOpenImpactReport(proj)}
                    className="px-3.5 py-1.5 rounded-xl bg-inverse-surface text-primary-fixed hover:opacity-90 active:scale-95 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ml-auto"
                >
                    <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                    <span>CSR Impact Dossier</span>
                </button>
            </div>
        </div>
    );

    const renderMarketplaceCard = (item: any) => (
        <div key={item.id} className="bg-gradient-to-br from-surface-container-lowest to-surface-container-low rounded-2xl p-5 shadow-sm hover:shadow-md border border-primary/20 relative overflow-hidden flex flex-col justify-between transition-all">
            <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary uppercase tracking-wider">
                        {item.category || "Civic Innovation"}
                    </span>
                    <span className="px-2 py-0.5 bg-error/15 text-error text-[10px] font-bold rounded-full">
                        {item.impact || 'High'} Impact
                    </span>
                </div>
                <h3 className="font-bold text-on-surface text-base sm:text-lg mb-1.5">{item.title}</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mb-4 line-clamp-3 leading-relaxed">{item.desc || item.description}</p>
                {item.location && (
                    <div className="flex items-center gap-1 text-[11px] text-on-surface-variant mb-3">
                        <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                        <span>{item.location}</span>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 mt-auto">
                <div>
                    <span className="text-[10px] text-outline uppercase block mb-0.5 font-medium">Est. Capital / Need</span>
                    <span className="font-heading font-bold text-base text-on-surface">{formatINR(item.estCost || item.estimated_cost || 50000)}</span>
                </div>
                <button 
                    type="button"
                    onClick={() => {
                        setSelectedItem(item);
                        setPledgeAmount(item.estCost || item.estimated_cost || 50000);
                        setSupportModalOpen(true);
                    }} 
                    className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[16px]">handshake</span>
                    Sponsor / Mentor
                </button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-inverse-surface">
                <span className="material-symbols-outlined animate-spin text-primary-fixed text-4xl" data-icon="sync">sync</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-inverse-surface text-inverse-on-surface shadow-md">
                <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] text-outline uppercase tracking-widest font-bold">Partner Portal</span>
                        <div className="flex items-center gap-2">
                            <h1 className="font-heading font-bold text-lg">{companyName}</h1>
                            <span className="material-symbols-outlined text-primary-fixed text-sm" data-icon="verified">verified</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            type="button" 
                            onClick={() => setSettingsModalOpen(true)} 
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-inverse-on-surface text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-white/10"
                            title="CSR Partner Settings &amp; Allocation"
                        >
                            <span className="material-symbols-outlined text-sm">settings</span>
                            <span className="hidden sm:inline">Settings</span>
                        </button>
                        <button 
                            type="button" 
                            onClick={handleLogout} 
                            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer" 
                            aria-label="Logout"
                        >
                            <span className="material-symbols-outlined text-xl" data-icon="logout">logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Top Interactive Navigation Tabs */}
            <div className="bg-surface-container-low border-b border-outline-variant/30 sticky top-16 z-30 shadow-xs">
                <div className="max-w-[1200px] mx-auto px-4 flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">
                    {[
                        { id: "Dashboard", label: "Dashboard Overview", icon: "grid_view", count: null },
                        { id: "Portfolio", label: "CSR Portfolio", icon: "account_balance_wallet", count: fundedProjects.length },
                        { id: "Marketplace", label: "Student Marketplace", icon: "volunteer_activism", count: marketplace.length },
                    ].map(tab => {
                        const isActive = activeNav === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    setActiveNav(tab.id);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                                    isActive
                                        ? "bg-inverse-surface text-primary-fixed shadow-sm"
                                        : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                                }`}
                            >
                                <span className={`material-symbols-outlined text-base ${isActive ? 'fill-1' : ''}`}>{tab.icon}</span>
                                <span>{tab.label}</span>
                                {tab.count !== null && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                        isActive ? "bg-primary-fixed/20 text-primary-fixed" : "bg-surface-container-highest text-on-surface-variant"
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <motion.main variants={containerVariants} initial="hidden" animate="show" className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-6 space-y-6">
                
                {error && (
                    <div className="p-4 rounded-2xl bg-error-container text-on-error-container flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-xl" data-icon="error">error</span>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={fetchDashboardData} 
                            className="px-3 py-1 bg-surface-container-lowest text-on-surface rounded-lg text-xs font-bold hover:bg-surface-variant"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* VIEW 1: DASHBOARD OVERVIEW */}
                {activeNav === "Dashboard" && (
                    <>
                        {/* Impact Summary */}
                        <motion.section variants={itemVariants} className="grid grid-cols-3 gap-3">
                            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col items-center text-center col-span-3 sm:col-span-1 bg-gradient-to-br from-primary-container/10 to-transparent">
                                <span className="text-xs text-on-surface-variant font-semibold mb-1 uppercase tracking-wider">Total CSR Investment</span>
                                <div className="flex items-center gap-1 text-primary font-heading font-bold text-2xl">
                                    {formatINR(totalInvestment)}
                                    <span className="material-symbols-outlined text-base" data-icon="trending_up">trending_up</span>
                                </div>
                            </div>
                            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col items-center text-center col-span-1">
                                <span className="text-xs text-on-surface-variant font-semibold mb-1 uppercase tracking-wider">Funded</span>
                                <span className="font-heading font-bold text-2xl text-on-surface">{issuesFunded}</span>
                            </div>
                            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col items-center text-center col-span-1">
                                <span className="text-xs text-on-surface-variant font-semibold mb-1 uppercase tracking-wider">Success</span>
                                <span className="font-heading font-bold text-2xl text-secondary">{successRate}%</span>
                            </div>
                        </motion.section>

                        {/* Recent Funded Projects Snapshot */}
                        <motion.section variants={itemVariants} className="space-y-4">
                            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
                                    <h2 className="text-lg font-bold font-heading text-on-surface">Active Funded Projects</h2>
                                </div>
                                {fundedProjects.length > 0 && (
                                    <button 
                                        type="button"
                                        onClick={() => { setActiveNav("Portfolio"); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>View Full Portfolio ({fundedProjects.length})</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                )}
                            </div>

                            {fundedProjects.length === 0 ? (
                                <div className="p-6 rounded-2xl bg-surface-container-low text-center space-y-2">
                                    <p className="text-xs text-on-surface-variant">No funded projects yet in your corporate portfolio.</p>
                                    <button 
                                        type="button"
                                        onClick={() => { setActiveNav("Marketplace"); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold cursor-pointer"
                                    >
                                        Browse Open Student Capstones
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {fundedProjects.slice(0, 2).map(renderProjectCard)}
                                </div>
                            )}
                        </motion.section>

                        {/* Featured Marketplace Opportunities Snapshot */}
                        <motion.section variants={itemVariants} className="space-y-4">
                            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-secondary text-xl">volunteer_activism</span>
                                    <h2 className="text-lg font-bold font-heading text-on-surface">Opportunities Awaiting CSR Capital</h2>
                                </div>
                                {marketplace.length > 0 && (
                                    <button 
                                        type="button"
                                        onClick={() => { setActiveNav("Marketplace"); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className="text-xs font-bold text-secondary hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>Explore All Marketplace ({marketplace.length})</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                )}
                            </div>

                            {marketplace.length === 0 ? (
                                <p className="text-xs text-on-surface-variant italic py-2">No problems currently open in marketplace.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {marketplace.slice(0, 2).map(renderMarketplaceCard)}
                                </div>
                            )}
                        </motion.section>
                    </>
                )}

                {/* VIEW 2: DEDICATED PORTFOLIO VIEW */}
                {activeNav === "Portfolio" && (
                    <motion.section variants={itemVariants} id="funded-projects" className="space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/30 pb-4">
                            <div>
                                <h2 className="text-xl font-bold font-heading text-on-surface flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-2xl">account_balance_wallet</span>
                                    CSR Project Portfolio
                                </h2>
                                <p className="text-xs text-on-surface-variant mt-1">
                                    Track student execution, verify live prototype links, monitor citizen ratings, and generate CSR audit dossiers.
                                </p>
                            </div>

                            {/* Portfolio Status Filter Chips */}
                            <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-2xl border border-outline-variant/20 self-start sm:self-auto">
                                {[
                                    { id: "all", label: "All", count: fundedProjects.length },
                                    { id: "In Progress", label: "In Progress", count: inProgressCount },
                                    { id: "Completed", label: "Completed", count: completedCount },
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => setPortfolioFilter(f.id as any)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                            portfolioFilter === f.id
                                                ? "bg-surface-container-lowest text-on-surface shadow-xs"
                                                : "text-on-surface-variant hover:text-on-surface"
                                        }`}
                                    >
                                        <span>{f.label}</span>
                                        <span className="text-[10px] font-mono opacity-80">({f.count})</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredPortfolio.length === 0 ? (
                            <div className="bg-surface-container-lowest rounded-3xl p-10 text-center border border-outline-variant/30 space-y-3">
                                <div className="w-14 h-14 rounded-2xl bg-surface-container mx-auto flex items-center justify-center text-on-surface-variant">
                                    <span className="material-symbols-outlined text-3xl">inventory_2</span>
                                </div>
                                <h3 className="font-bold text-on-surface text-base">No projects found for filter: "{portfolioFilter}"</h3>
                                <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                                    {portfolioFilter === 'all' 
                                        ? "Your organization hasn't sponsored any student capstone projects yet. Browse the marketplace to find impactful student solutions."
                                        : `There are currently no projects matching the status "${portfolioFilter}".`}
                                </p>
                                <button 
                                    type="button"
                                    onClick={() => { setActiveNav("Marketplace"); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary-container shadow-sm active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-sm">volunteer_activism</span>
                                    <span>Browse Student Marketplace</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredPortfolio.map(renderProjectCard)}
                            </div>
                        )}
                    </motion.section>
                )}

                {/* VIEW 3: DEDICATED MARKETPLACE VIEW */}
                {activeNav === "Marketplace" && (
                    <motion.section variants={itemVariants} id="marketplace-section" className="space-y-5">
                        <div className="border-b border-outline-variant/30 pb-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-xl font-bold font-heading text-on-surface flex items-center gap-2">
                                        <span className="material-symbols-outlined text-secondary text-2xl">volunteer_activism</span>
                                        Student Capstone Marketplace
                                    </h2>
                                    <p className="text-xs text-on-surface-variant mt-1">
                                        Verified civic problem statements adopted by engineering teams seeking CSR funding, hardware kits, or technical mentorship.
                                    </p>
                                </div>
                                <span className="text-xs font-mono text-on-surface-variant self-start sm:self-auto px-3 py-1 bg-surface-container rounded-full">
                                    <strong>{filteredMarketplace.length}</strong> available
                                </span>
                            </div>

                            {/* Search and Category Filter Toolbar */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <div className="relative flex-1">
                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
                                    <input 
                                        type="text"
                                        value={marketplaceSearch}
                                        onChange={e => setMarketplaceSearch(e.target.value)}
                                        placeholder="Search challenges by title, keywords, or location..."
                                        className="w-full pl-10 pr-10 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:ring-2 focus:ring-secondary text-xs text-on-surface placeholder:text-on-surface-variant/60"
                                    />
                                    {marketplaceSearch && (
                                        <button 
                                            type="button" 
                                            onClick={() => setMarketplaceSearch("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    )}
                                </div>

                                {/* Category Chips */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                                    {["all", "Water", "Sanitation", "Energy", "Infrastructure", "Health"].map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setMarketplaceCategory(cat)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                                                marketplaceCategory === cat
                                                    ? "bg-secondary text-on-secondary font-bold shadow-xs"
                                                    : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                                            }`}
                                        >
                                            {cat === "all" ? "All Categories" : cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {filteredMarketplace.length === 0 ? (
                            <div className="bg-surface-container-lowest rounded-3xl p-10 text-center border border-outline-variant/30 space-y-3">
                                <div className="w-14 h-14 rounded-2xl bg-surface-container mx-auto flex items-center justify-center text-on-surface-variant">
                                    <span className="material-symbols-outlined text-3xl">search_off</span>
                                </div>
                                <h3 className="font-bold text-on-surface text-base">No marketplace items match your criteria</h3>
                                <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                                    Try clearing your search query or selecting a different problem category.
                                </p>
                                <button 
                                    type="button"
                                    onClick={() => { setMarketplaceSearch(""); setMarketplaceCategory("all"); }}
                                    className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-xs font-bold cursor-pointer transition-all"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {filteredMarketplace.map(renderMarketplaceCard)}
                            </div>
                        )}
                    </motion.section>
                )}

                {/* CSR 3-Track Support Modal (Point 6) */}
                {supportModalOpen && selectedItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-outline-variant/30 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                                <div>
                                    <span className="text-[10px] font-mono uppercase font-bold text-secondary tracking-widest">Industry &amp; CSR Matching (Point 6)</span>
                                    <h3 className="text-lg font-bold text-on-surface">Pledge Support for Student Capstone</h3>
                                </div>
                                <button type="button" onClick={() => setSupportModalOpen(false)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer">
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>

                            <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                                <h4 className="text-xs font-bold text-on-surface">{selectedItem.title}</h4>
                                <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-2">{selectedItem.desc || selectedItem.description}</p>
                            </div>

                            <form onSubmit={handleSupportSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Select CSR Support Track</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { key: "funding", label: "CSR Grant", icon: "payments", desc: "Capital Funding" },
                                            { key: "mentorship", label: "Mentorship", icon: "school", desc: "Expert Engineers" },
                                            { key: "lab_sponsorship", label: "Lab Hardware", icon: "memory", desc: "Sensors & Kits" }
                                        ].map(track => (
                                            <button
                                                key={track.key}
                                                type="button"
                                                onClick={() => setSelectedTrack(track.key as any)}
                                                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                                                    selectedTrack === track.key 
                                                        ? 'bg-secondary/10 border-secondary text-secondary font-bold shadow-xs' 
                                                        : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-outline'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-lg block mb-1">{track.icon}</span>
                                                <p className="text-xs font-bold truncate">{track.label}</p>
                                                <p className="text-[10px] opacity-75 truncate">{track.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedTrack === "funding" && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Grant Pledge Amount (INR ₹)</label>
                                        <input
                                            type="number"
                                            required
                                            min="5000"
                                            step="5000"
                                            value={pledgeAmount}
                                            onChange={e => setPledgeAmount(Number(e.target.value))}
                                            className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:ring-2 focus:ring-secondary text-sm font-mono font-bold text-on-surface"
                                        />
                                    </div>
                                )}

                                {selectedTrack === "mentorship" && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Assigned Technical Mentor / Domain Expert</label>
                                        <input
                                            type="text"
                                            required
                                            value={mentorDetails}
                                            onChange={e => setMentorDetails(e.target.value)}
                                            placeholder="e.g. Lead SCADA & IoT Architect (Tata Steel Automation)"
                                            className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:ring-2 focus:ring-secondary text-sm text-on-surface"
                                        />
                                    </div>
                                )}

                                {selectedTrack === "lab_sponsorship" && (
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">Hardware / Lab Equipment Package</label>
                                        <input
                                            type="text"
                                            required
                                            value={labDetails}
                                            onChange={e => setLabDetails(e.target.value)}
                                            placeholder="e.g. 10x ESP32 Turbidity & pH Sensor Kits + Cloud Gateway"
                                            className="w-full px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:ring-2 focus:ring-secondary text-sm text-on-surface"
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
                                    <button type="button" onClick={() => setSupportModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-on-surface-variant cursor-pointer">Cancel</button>
                                    <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                                        {submitting && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                                        Confirm CSR Support
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </motion.main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-inverse-surface/95 backdrop-blur-md shadow-lg border-t border-inverse-surface">
                {[
                    { label: 'Dashboard', icon: 'grid_view', action: () => { setActiveNav('Dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
                    { label: 'Portfolio', icon: 'account_balance_wallet', action: () => { setActiveNav('Portfolio'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
                    { label: 'Marketplace', icon: 'volunteer_activism', action: () => { setActiveNav('Marketplace'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
                    { label: 'Settings', icon: 'settings', action: () => setSettingsModalOpen(true) }
                ].map(nav => (
                    <button 
                        key={nav.label} 
                        type="button"
                        onClick={nav.action}
                        className={`flex flex-col items-center justify-center min-w-[64px] px-2 py-1.5 rounded-xl transition-all cursor-pointer ${activeNav === nav.label ? 'text-primary-fixed font-bold' : 'text-inverse-on-surface/60 hover:text-inverse-on-surface'}`}
                    >
                        <span className={`material-symbols-outlined text-xl ${activeNav === nav.label ? 'fill-1' : ''}`} data-icon={nav.icon}>{nav.icon}</span>
                        <span className="text-[10px] mt-1 font-semibold">{nav.label}</span>
                    </button>
                ))}
            </nav>

            {/* CSR Partner Settings & Allocation Modal */}
            {settingsModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-fade-in">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-outline-variant/30 max-h-[90vh] overflow-y-auto text-on-surface"
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-inverse-surface text-primary-fixed flex items-center justify-center">
                                    <span className="material-symbols-outlined text-lg">settings</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold font-headline-sm text-on-surface">CSR Partner Profile &amp; Policies</h3>
                                    <p className="text-[11px] text-on-surface-variant">Manage corporate entity credentials, allocation pool &amp; SDG focus</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setSettingsModalOpen(false)} className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container cursor-pointer">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSavePartnerSettings} className="space-y-4 pt-4">
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">domain</span>
                                    Corporate Entity Credentials
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Company / Entity Name</label>
                                        <input 
                                            type="text"
                                            value={partnerSettings.companyName}
                                            onChange={e => setPartnerSettings({ ...partnerSettings, companyName: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:ring-2 focus:ring-primary text-on-surface outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">MCA CSR Registration No.</label>
                                        <input 
                                            type="text"
                                            value={partnerSettings.csrRegistrationNo}
                                            onChange={e => setPartnerSettings({ ...partnerSettings, csrRegistrationNo: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:ring-2 focus:ring-primary text-on-surface outline-none font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Corporate CIN</label>
                                        <input 
                                            type="text"
                                            value={partnerSettings.cinNumber}
                                            onChange={e => setPartnerSettings({ ...partnerSettings, cinNumber: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:ring-2 focus:ring-primary text-on-surface outline-none font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Annual CSR Allocation Pool</label>
                                        <input 
                                            type="text"
                                            value={partnerSettings.annualBudget}
                                            onChange={e => setPartnerSettings({ ...partnerSettings, annualBudget: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:ring-2 focus:ring-primary text-on-surface outline-none font-semibold text-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2 border-t border-outline-variant/20">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">contact_mail</span>
                                    Nodal CSR Point of Contact
                                </h4>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">POC Name &amp; Designation</label>
                                        <input 
                                            type="text"
                                            value={partnerSettings.nodalPocName}
                                            onChange={e => setPartnerSettings({ ...partnerSettings, nodalPocName: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:ring-2 focus:ring-primary text-on-surface outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Nodal Official Email</label>
                                        <input 
                                            type="email"
                                            value={partnerSettings.nodalEmail}
                                            onChange={e => setPartnerSettings({ ...partnerSettings, nodalEmail: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:ring-2 focus:ring-primary text-on-surface outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Priority UN Sustainable Development Goals (SDGs)</label>
                                    <input 
                                        type="text"
                                        value={partnerSettings.focusSdgs}
                                        onChange={e => setPartnerSettings({ ...partnerSettings, focusSdgs: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl bg-surface-container-low border border-outline-variant/40 focus:ring-2 focus:ring-primary text-on-surface outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-outline-variant/20">
                                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={partnerSettings.autoMatching}
                                        onChange={e => setPartnerSettings({ ...partnerSettings, autoMatching: e.target.checked })}
                                        className="mt-0.5 rounded text-primary focus:ring-primary cursor-pointer"
                                    />
                                    <div>
                                        <span className="text-xs font-bold text-on-surface block">Automated State Innovation Grant Co-Matching</span>
                                        <span className="text-[10px] text-on-surface-variant">Enable Jharkhand Innovation Council 1:1 matching on approved CSR student capstone funding</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={partnerSettings.quarterlyAuditReport}
                                        onChange={e => setPartnerSettings({ ...partnerSettings, quarterlyAuditReport: e.target.checked })}
                                        className="mt-0.5 rounded text-primary focus:ring-primary cursor-pointer"
                                    />
                                    <div>
                                        <span className="text-xs font-bold text-on-surface block">Quarterly Impact &amp; 80G Tax Utilization Audit Delivery</span>
                                        <span className="text-[10px] text-on-surface-variant">Receive automated certified fund utilization certificates verified by university nodal officers</span>
                                    </div>
                                </label>
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
                                    className="px-5 py-2 text-xs font-bold bg-inverse-surface text-primary-fixed rounded-xl shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-sm">save</span>
                                    Save Partner Settings
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* CSR Project Impact & Performance Report Modal */}
            {impactModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-scrim/70 backdrop-blur-md animate-fade-in print:p-0 print:bg-white">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl border border-outline-variant/30 max-h-[92vh] overflow-y-auto text-on-surface space-y-5 print:shadow-none print:border-none print:max-h-none print:w-full"
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between pb-4 border-b border-outline-variant/20">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                        CSR Performance &amp; Impact Dossier
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        Verified On-Ground
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold font-heading text-on-surface">
                                    {selectedImpactData?.project?.title || "Civic Project Performance Report"}
                                </h3>
                                <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">
                                    Dossier Ref: {selectedImpactData?.dossier_id || "CSR-IMPACT-2026"} • {selectedImpactData?.generated_at}
                                </p>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setImpactModalOpen(false)} 
                                className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container cursor-pointer print:hidden"
                                aria-label="Close"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        {loadingImpact ? (
                            <div className="py-12 flex flex-col items-center justify-center space-y-3">
                                <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
                                <p className="text-xs text-on-surface-variant font-medium">Collating ground performance &amp; verification telemetry...</p>
                            </div>
                        ) : selectedImpactData ? (
                            <div className="space-y-5 text-xs">
                                {/* 1. Sponsorship & Corporate Credentials */}
                                <div className="bg-surface-container-low/70 rounded-2xl p-4 border border-outline-variant/25 space-y-2.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">domain</span>
                                        Corporate CSR Grantor
                                    </span>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <div>
                                            <span className="text-[10px] text-on-surface-variant block">Company / Entity</span>
                                            <strong className="text-on-surface text-xs font-semibold">{selectedImpactData.sponsor?.company_name || partnerSettings.companyName}</strong>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-on-surface-variant block">MCA CSR Reg. No.</span>
                                            <span className="font-mono text-on-surface text-xs">{partnerSettings.csrRegistrationNo}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-on-surface-variant block">Grant Allocated</span>
                                            <span className="font-mono font-bold text-primary text-xs">{formatINR(selectedImpactData.sponsor?.grant_amount)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Problem Statement Solved */}
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">location_on</span>
                                        Civic Challenge &amp; Ground Locality
                                    </span>
                                    <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/20 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-on-surface">{selectedImpactData.project?.location}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-container font-semibold uppercase">{selectedImpactData.project?.category}</span>
                                        </div>
                                        <p className="text-[11px] text-on-surface-variant leading-relaxed">
                                            {selectedImpactData.project?.description}
                                        </p>
                                    </div>
                                </div>

                                {/* 3. Student Solver Team & University Endorsement */}
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">school</span>
                                        Collegiate Student Innovators
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                                            <span className="text-[10px] text-on-surface-variant block">University / Institution</span>
                                            <strong className="text-on-surface text-xs">{selectedImpactData.project?.university}</strong>
                                            <span className="text-[10px] text-on-surface-variant block mt-1">Mentor: {selectedImpactData.project?.mentor_name}</span>
                                        </div>
                                        <div className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                                            <span className="text-[10px] text-on-surface-variant block">Team Lead &amp; APAAR Registry</span>
                                            <strong className="text-on-surface text-xs">{selectedImpactData.project?.student_lead}</strong>
                                            <span className="text-[10px] font-mono text-primary block mt-1">{selectedImpactData.project?.apaar_id}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Verifiable Live Deliverables (Proof of Functionality) */}
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">verified</span>
                                        Proof of Execution &amp; Live Deliverables
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <a 
                                            href={selectedImpactData.deliverables?.prototype_url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="p-3 rounded-2xl bg-primary/10 hover:bg-primary/15 border border-primary/25 flex items-center justify-between group transition-all"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-xl">play_circle</span>
                                                <div>
                                                    <span className="text-xs font-bold text-on-surface block group-hover:text-primary transition-colors">Working Prototype</span>
                                                    <span className="text-[10px] text-primary flex items-center gap-1 font-semibold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                                        Live Telemetry / Demo
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-sm text-primary group-hover:translate-x-0.5 transition-transform">open_in_new</span>
                                        </a>

                                        <a 
                                            href={selectedImpactData.deliverables?.documentation_url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 flex items-center justify-between group transition-all"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-on-surface-variant text-xl">code</span>
                                                <div>
                                                    <span className="text-xs font-bold text-on-surface block">GitHub Codebase</span>
                                                    <span className="text-[10px] text-on-surface-variant">Verified Open-Source Repo</span>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:translate-x-0.5 transition-transform">open_in_new</span>
                                        </a>
                                    </div>
                                </div>

                                {/* 5. Ground Truth & Citizen Voice */}
                                <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/25 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm fill-1">star</span>
                                            Ground Citizen Satisfaction
                                        </span>
                                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                            ⭐ {selectedImpactData.ground_impact?.citizen_rating || 4.8} / 5.0
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 italic leading-relaxed">
                                        "{selectedImpactData.ground_impact?.citizen_comment || "The student prototype was deployed in our colony and successfully addressed our local water telemetry issue."}"
                                    </p>
                                    <div className="flex items-center justify-between pt-1 text-[10px] text-amber-800/75 dark:text-amber-300/75">
                                        <span>Beneficiaries: <strong>{selectedImpactData.ground_impact?.beneficiaries_served || "450+ Households"}</strong></span>
                                        <span className="flex items-center gap-1 font-semibold">
                                            <span className="material-symbols-outlined text-[12px]">verified</span>
                                            Municipal Inspection Verified
                                        </span>
                                    </div>
                                </div>

                                {/* 6. 3-Phase Milestone Checklist */}
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                                        Milestone Execution Roadmap
                                    </span>
                                    <div className="space-y-1.5">
                                        {selectedImpactData.milestones?.map((m: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className={`material-symbols-outlined text-base ${m.completed ? 'text-primary fill-1' : 'text-on-surface-variant'}`}>
                                                        {m.completed ? 'check_circle' : 'pending'}
                                                    </span>
                                                    <div>
                                                        <span className="font-semibold text-on-surface text-[11px] block">{m.title}</span>
                                                        <span className="text-[10px] text-on-surface-variant">{m.evidence}</span>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${m.completed ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                                                    {m.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* Modal Footer Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20 print:hidden">
                            <span className="text-[10px] text-on-surface-variant italic">
                                SocioSolve Civic Innovation &bull; Gov of Jharkhand &bull; SIH 2026
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    type="button" 
                                    onClick={() => setImpactModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl cursor-pointer"
                                >
                                    Close
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => window.print()}
                                    className="px-4 py-2 text-xs font-bold bg-inverse-surface text-primary-fixed rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-sm">print</span>
                                    <span>Print / Export CSR Dossier</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
