// @ts-nocheck
import React, { useState, useEffect } from "react";
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

    const handleSavePartnerSettings = (e: React.FormEvent) => {
        e.preventDefault();
        showToast("CSR Partner Profile & Capital Allocation settings updated successfully!", "success");
        setSettingsModalOpen(false);
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

                {/* Funded Projects Feed */}
                <motion.section variants={itemVariants} id="funded-projects" className="space-y-4">
                    <h2 className="text-lg font-bold font-heading text-on-surface border-b border-outline-variant/30 pb-2">Your Funded Projects</h2>
                    <div className="space-y-3">
                        {fundedProjects.length === 0 ? (
                            <p className="text-xs text-on-surface-variant italic py-2">No funded projects yet.</p>
                        ) : null}
                        {fundedProjects.map((proj: any) => (
                            <div key={proj.id} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                                            <span className="material-symbols-outlined text-[18px]" data-icon="domain">domain</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-on-surface text-sm">{proj.title}</h3>
                                            <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]" data-icon="location_on">location_on</span>
                                                {proj.location || "Jharkhand"}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${proj.status === 'Completed' ? 'bg-primary text-on-primary' : 'bg-secondary-container text-on-secondary-container'}`}>
                                        {proj.status || 'Active'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                    <span className="font-mono font-bold text-on-surface">{formatINR(proj.amount)}</span>
                                    <div className="w-1/2">
                                        <div className="flex justify-end text-[9px] text-on-surface-variant mb-1 font-mono">{proj.progress || 0}%</div>
                                        <div className="w-full bg-surface-container-highest rounded-full h-1.5">
                                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${proj.progress || 0}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* CSR Marketplace */}
                <motion.section variants={itemVariants} id="marketplace-section" className="space-y-4">
                    <h2 className="text-lg font-bold font-heading text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary" data-icon="volunteer_activism">volunteer_activism</span>
                        Fund a New Problem
                    </h2>
                    {marketplace.length === 0 ? (
                        <p className="text-xs text-on-surface-variant italic py-2">No problems currently open in marketplace.</p>
                    ) : null}
                    {marketplace.map(item => (
                        <div key={item.id} className="bg-gradient-to-br from-surface-container-lowest to-surface-container-low rounded-2xl p-5 shadow-md border border-primary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 px-3 py-1 bg-error text-on-error text-[10px] font-bold rounded-bl-xl">{item.impact || 'High'} Impact</div>
                            <h3 className="font-bold text-on-surface text-lg mb-2 pr-16">{item.title}</h3>
                            <p className="text-sm text-on-surface-variant mb-4">{item.desc || item.description}</p>
                            <div className="flex items-center justify-between mt-2 pt-4 border-t border-outline-variant/20">
                                <div>
                                    <span className="text-[10px] text-outline uppercase block mb-0.5">Est. Cost</span>
                                    <span className="font-heading font-bold text-on-surface">{formatINR(item.estCost || item.estimated_cost || 50000)}</span>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setSelectedItem(item);
                                        setPledgeAmount(item.estCost || item.estimated_cost || 50000);
                                        setSupportModalOpen(true);
                                    }} 
                                    className="px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-full text-sm font-bold shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">handshake</span>
                                    Sponsor / Mentor
                                </button>
                            </div>
                        </div>
                    ))}
                </motion.section>

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
                    { label: 'Dashboard', icon: 'grid_view', action: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); setActiveNav('Dashboard'); } },
                    { label: 'Portfolio', icon: 'account_balance_wallet', action: () => { document.getElementById('funded-projects')?.scrollIntoView({ behavior: 'smooth' }); setActiveNav('Portfolio'); } },
                    { label: 'Marketplace', icon: 'volunteer_activism', action: () => { document.getElementById('marketplace-section')?.scrollIntoView({ behavior: 'smooth' }); setActiveNav('Marketplace'); } },
                    { label: 'Settings', icon: 'settings', action: () => { setSettingsModalOpen(true); setActiveNav('Settings'); } }
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
        </div>
    );
}
