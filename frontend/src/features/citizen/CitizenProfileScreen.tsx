// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../context/ToastContext";

export default function CitizenProfileScreen() {
    const navigate = useNavigate();
    const phone = useAuthStore(state => state.phone);
    const storedName = useAuthStore(state => state.name);
    const storedWard = useAuthStore(state => state.ward);
    const storedLocality = useAuthStore(state => state.locality);
    const updateProfile = useAuthStore(state => state.updateProfile);
    const logout = useAuthStore(state => state.logout);
    const { showToast } = useToast();

    const [name, setName] = useState(storedName || "");
    const [ward, setWard] = useState(storedWard || "Ward 4 (Morabadi)");
    const [locality, setLocality] = useState(storedLocality || "Morabadi, Ranchi");
    const [smsAlerts, setSmsAlerts] = useState(true);
    const [whatsappAlerts, setWhatsappAlerts] = useState(true);
    const [myReports, setMyReports] = useState<any[]>([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lang, setLang] = useState<"EN" | "HI">("EN");

    const citizenInitials = phone ? phone.slice(-2) : "CZ";
    const citizenBadgeId = phone ? `JH-${phone.slice(-4)}` : "JH-CITIZEN";

    useEffect(() => {
        const loadReports = async () => {
            try {
                const res = await fetch("/api/reports/my", { credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    setMyReports(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Failed to load user complaints:", err);
            } finally {
                setLoadingReports(false);
            }
        };
        loadReports();
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        updateProfile({ name: name.trim(), ward, locality: locality.trim() });
        setTimeout(() => {
            setSaving(false);
            showToast(lang === "HI" ? "नागरिक प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!" : "Citizen Profile updated successfully!", "success");
        }, 300);
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        } catch (e) {
            console.error(e);
        }
        logout();
        showToast("Logged out successfully", "info");
        navigate("/");
    };

    // Calculate dynamic civic reputation
    const karmaScore = Math.min(1000, 100 + (myReports.length * 150));
    const karmaLevel = karmaScore >= 600 ? "Gold Ward Custodian" : karmaScore >= 300 ? "Silver Civic Advocate" : "Bronze Reporter";

    const t = {
        EN: {
            title: "Citizen Profile",
            subtitle: "Jharkhand Urban Development • Verified Resident",
            cardBadge: "Verified Resident",
            fullName: "Full Name",
            mobile: "Registered Mobile Number",
            wardLabel: "Municipal Ward Preference",
            localityLabel: "Locality / Landmark",
            saveBtn: "Save Changes",
            saving: "Saving...",
            logoutBtn: "Log Out of Session",
            reputationTitle: "Civic Reputation & Badges",
            activeGrievances: "My Reported Grievances",
            noGrievances: "You have not submitted any grievances yet.",
            reportNew: "Report New Issue",
            notifications: "Redressal Notification Alerts",
            smsNote: "SMS ticket updates & field dispatch alerts",
            waNote: "WhatsApp proof of resolution photos",
            backToDashboard: "Back to Dashboard"
        },
        HI: {
            title: "नागरिक प्रोफ़ाइल",
            subtitle: "झारखंड नगर विकास • सत्यापित नागरिक",
            cardBadge: "सत्यापित नागरिक",
            fullName: "पूरा नाम",
            mobile: "पंजीकृत मोबाइल नंबर",
            wardLabel: "नगर निगम वार्ड",
            localityLabel: "इलाका / मोहल्ला",
            saveBtn: "परिवर्तन सहेजें",
            saving: "सहेजा जा रहा है...",
            logoutBtn: "लॉग आउट करें",
            reputationTitle: "नागरिक साख एवं उपलब्धियां",
            activeGrievances: "मेरी दर्ज की गई शिकायतें",
            noGrievances: "आपने अभी तक कोई शिकायत दर्ज नहीं की है।",
            reportNew: "नई शिकायत दर्ज करें",
            notifications: "निवारण सूचना संदेश",
            smsNote: "एसएमएस द्वारा शिकायत स्थिति एवं फील्ड अपडेट",
            waNote: "व्हाट्सएप पर समाधान फोटो और प्रमाण",
            backToDashboard: "डैशबोर्ड पर वापस जाएं"
        }
    }[lang];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="min-h-screen bg-background text-on-background pb-16"
        >
            {/* Top Navigation Bar */}
            <header className="bg-primary text-on-primary sticky top-0 z-40 shadow-sm border-b border-primary-container/40">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <button 
                        type="button" 
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary-fixed hover:text-white transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                        <span>{t.backToDashboard}</span>
                    </button>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            type="button"
                            onClick={() => setLang(lang === "EN" ? "HI" : "EN")}
                            className="text-xs px-2.5 py-1 rounded-full bg-primary-container/50 border border-primary-fixed/20 font-bold hover:bg-primary-container cursor-pointer"
                        >
                            {lang === "EN" ? "हिन्दी" : "English"}
                        </button>
                        <button 
                            type="button" 
                            onClick={handleLogout}
                            className="text-xs px-3 py-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">logout</span>
                            <span className="hidden sm:inline">{t.logoutBtn}</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Digital Citizen ID Card */}
                <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1b4332] text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl font-bold font-mono ring-2 ring-white/30 text-white">
                                {citizenInitials}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl sm:text-2xl font-bold font-headline-md tracking-tight">
                                        {name || (phone ? `Citizen +91 ${phone.slice(-5)}` : "Verified Citizen")}
                                    </h2>
                                    <span className="material-symbols-outlined text-emerald-400 text-xl" title="Verified Mobile">verified</span>
                                </div>
                                <p className="text-xs text-white/80 font-mono mt-0.5">
                                    {citizenBadgeId} • Ranchi Municipal Corporation
                                </p>
                            </div>
                        </div>

                        <div className="text-left sm:text-right bg-white/10 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                                {t.cardBadge}
                            </span>
                            <p className="text-xs text-white/70 mt-1 font-mono">{phone || "+91 98350 XXXXX"}</p>
                        </div>
                    </div>

                    {/* Karma Meter Bar */}
                    <div className="mt-6 pt-5 border-t border-white/15">
                        <div className="flex items-center justify-between text-xs font-semibold mb-2">
                            <span className="flex items-center gap-1.5 text-white/90">
                                <span className="material-symbols-outlined text-amber-400 text-base">military_tech</span>
                                <span>{karmaLevel}</span>
                            </span>
                            <span className="font-mono text-emerald-300 font-bold">{karmaScore} / 1000 Karma</span>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-400 to-teal-300 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(karmaScore / 1000) * 100}%` }}></div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-white/70 mt-2">
                            <span>{myReports.length} Grievance(s) Filed</span>
                            <span>Leveling up unlocks direct Municipal Ward Priority</span>
                        </div>
                    </div>
                </div>

                {/* Profile Edit & Ward Preferences Form */}
                <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 whisper-border ambient-shadow space-y-5">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant/30">
                        <span className="material-symbols-outlined text-primary text-2xl">manage_accounts</span>
                        <div>
                            <h3 className="font-headline-sm text-base font-bold text-on-surface">Resident Settings &amp; Municipal Ward</h3>
                            <p className="text-xs text-on-surface-variant">Customize your locality for automatic ward grievance routing</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant mb-1">{t.fullName}</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name (e.g. Ramesh Kumar)"
                                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:ring-2 focus:ring-primary text-sm text-on-surface outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant mb-1">{t.mobile}</label>
                                <input 
                                    type="text" 
                                    disabled
                                    value={phone ? `+91 ${phone}` : "+91 Verified Mobile"}
                                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 text-sm text-on-surface-variant cursor-not-allowed font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant mb-1">{t.wardLabel}</label>
                                <select 
                                    value={ward} 
                                    onChange={(e) => setWard(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:ring-2 focus:ring-primary text-sm text-on-surface outline-none cursor-pointer"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                                        <option key={num} value={`Ward ${num}`}>Ward {num} (Ranchi Municipal)</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-on-surface-variant mb-1">{t.localityLabel}</label>
                                <input 
                                    type="text" 
                                    value={locality}
                                    onChange={(e) => setLocality(e.target.value)}
                                    placeholder="e.g. Morabadi, Doranda, Lalpur"
                                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:ring-2 focus:ring-primary text-sm text-on-surface outline-none"
                                />
                            </div>
                        </div>

                        {/* Notification Preferences */}
                        <div className="pt-2">
                            <p className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">{t.notifications}</p>
                            <div className="space-y-2">
                                <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                                    <div>
                                        <p className="text-xs font-bold text-on-surface">SMS Status Alerts</p>
                                        <p className="text-[11px] text-on-surface-variant">{t.smsNote}</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={smsAlerts} 
                                        onChange={(e) => setSmsAlerts(e.target.checked)}
                                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                                    <div>
                                        <p className="text-xs font-bold text-on-surface">WhatsApp Resolution Proofs</p>
                                        <p className="text-[11px] text-on-surface-variant">{t.waNote}</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={whatsappAlerts} 
                                        onChange={(e) => setWhatsappAlerts(e.target.checked)}
                                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {saving && <span className="material-symbols-outlined text-base animate-spin">refresh</span>}
                                <span>{saving ? t.saving : t.saveBtn}</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* My Grievance History */}
                <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 whisper-border ambient-shadow space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                        <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-primary text-2xl">assignment</span>
                            <div>
                                <h3 className="font-headline-sm text-base font-bold text-on-surface">{t.activeGrievances}</h3>
                                <p className="text-xs text-on-surface-variant">Live status of issues registered by this mobile number</p>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => navigate('/report')}
                            className="px-3.5 py-1.5 rounded-full bg-secondary-container hover:bg-secondary-container/90 text-on-secondary-container font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-base">add</span>
                            <span>{t.reportNew}</span>
                        </button>
                    </div>

                    {loadingReports ? (
                        <div className="py-8 text-center text-xs text-on-surface-variant font-mono">
                            <span className="material-symbols-outlined animate-spin text-2xl text-primary mb-1">refresh</span>
                            <p>Loading personal grievance history...</p>
                        </div>
                    ) : myReports.length === 0 ? (
                        <div className="py-8 text-center text-on-surface-variant space-y-3">
                            <span className="material-symbols-outlined text-4xl opacity-40">task_alt</span>
                            <p className="text-xs font-medium">{t.noGrievances}</p>
                            <button 
                                type="button" 
                                onClick={() => navigate('/report')}
                                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm cursor-pointer"
                            >
                                {t.reportNew}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {myReports.map((r: any) => (
                                <div 
                                    key={r.id} 
                                    className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed">
                                                Ticket #{String(r.id).slice(0, 8)}
                                            </span>
                                            <span className="text-xs font-bold text-primary">{r.category}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-on-surface">{r.title || r.challenge_summary || r.description?.slice(0, 50)}</h4>
                                        <p className="text-xs text-on-surface-variant line-clamp-1">{r.description}</p>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                                            r.status === 'resolved' || r.status === 'implemented' 
                                                ? 'bg-emerald-100 text-emerald-800' 
                                                : r.status === 'in_progress' || r.status === 'assigned'
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {(r.status || 'reported').replace('_', ' ')}
                                        </span>
                                        <button 
                                            type="button" 
                                            onClick={() => navigate('/dashboard')}
                                            className="px-3 py-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface cursor-pointer"
                                        >
                                            View in Feed
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </motion.div>
    );
}
