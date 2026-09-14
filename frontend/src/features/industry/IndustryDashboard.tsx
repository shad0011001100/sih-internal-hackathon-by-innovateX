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

    const handleFund = async (projectId: number, amount: number) => {
        setFundingId(projectId);
        setSubmitting(true);
        try {
            await safeFetch("/api/industry/fund", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: projectId,
                    amount: Number(amount),
                    offer_type: "funding"
                })
            });
            showToast(`Funding pledge of ${formatINR(amount)} initiated successfully!`, "success");
            setMarketplace(prev => prev.filter(m => m.id !== projectId));
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to pledge funding");
            showToast(e.message || "Failed to initiate funding pledge", "error");
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
                    <button 
                        type="button" 
                        onClick={handleLogout} 
                        className="p-2 hover:bg-white/10 rounded-full transition-colors" 
                        aria-label="Logout"
                    >
                        <span className="material-symbols-outlined text-xl" data-icon="logout">logout</span>
                    </button>
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
                <motion.section variants={itemVariants} className="space-y-4">
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
                <motion.section variants={itemVariants} className="space-y-4">
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
                                    disabled={fundingId === item.id || submitting}
                                    onClick={() => handleFund(item.id, item.estCost || item.estimated_cost || 50000)} 
                                    className="px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-full text-sm font-bold shadow-sm active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {fundingId === item.id ? (
                                        <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-[18px]" data-icon="payments">payments</span>
                                    )}
                                    {fundingId === item.id ? "Pledging..." : "Fund This"}
                                </button>
                            </div>
                        </div>
                    ))}
                </motion.section>

            </motion.main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-inverse-surface/95 backdrop-blur-md shadow-lg border-t border-inverse-surface">
                {[
                    { label: 'Dashboard', icon: 'grid_view', action: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); setActiveNav('Dashboard'); } },
                    { label: 'Portfolio', icon: 'account_balance_wallet', action: () => { showComingSoon("Portfolio Tracker"); setActiveNav('Portfolio'); } },
                    { label: 'Impact', icon: 'monitoring', action: () => { showComingSoon("Impact Analytics"); setActiveNav('Impact'); } },
                    { label: 'Settings', icon: 'settings', action: () => { showComingSoon("Partner Settings"); setActiveNav('Settings'); } }
                ].map(nav => (
                    <button 
                        key={nav.label} 
                        type="button"
                        onClick={nav.action}
                        className={`flex flex-col items-center justify-center min-w-[64px] px-2 py-1.5 rounded-xl transition-all ${activeNav === nav.label ? 'text-primary-fixed font-bold' : 'text-inverse-on-surface/60 hover:text-inverse-on-surface'}`}
                    >
                        <span className={`material-symbols-outlined text-xl ${activeNav === nav.label ? 'fill-1' : ''}`} data-icon={nav.icon}>{nav.icon}</span>
                        <span className="text-[10px] mt-1 font-semibold">{nav.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}
