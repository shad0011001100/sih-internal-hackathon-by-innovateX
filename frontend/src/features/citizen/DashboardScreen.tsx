// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../context/ToastContext";
import { safeFetch } from "../../services/api";

export default function DashboardScreen() {
    const [reports, setReports] = useState<any[]>([]);
    const [myReports, setMyReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"All" | "My Reports" | "In Progress" | "Resolved">("All");
    const [selectedWard, setSelectedWard] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [upvotes, setUpvotes] = useState<Record<string | number, number>>({});
    const [upvoted, setUpvoted] = useState<Record<string | number, boolean>>({});
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [lang, setLang] = useState<"EN" | "HI">("EN");

    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);
    const phone = useAuthStore(state => state.phone);
    const { showToast } = useToast();

    const citizenInitials = phone ? phone.slice(-2) : "CZ";
    const citizenName = phone ? `Citizen (${phone})` : (lang === "HI" ? "सत्यापित नागरिक" : "Verified Citizen");
    const citizenIdBadge = phone ? `JH-${phone.slice(-4)}` : "JH-CITIZEN";

    // Dynamic Civic Reputation: Base 100 for verified phone + 150 per submitted report + 10 per upvote
    const upvotesGivenCount = Object.keys(upvoted).length;
    const civicReputation = Math.min(1000, 100 + (myReports.length * 150) + (upvotesGivenCount * 10));

    const t = {
        EN: {
            title: "SocioSolve",
            sub: "Government of Jharkhand • Citizen Grievance Redressal",
            home: "Home & Feed",
            report: "Report Issue",
            solvers: "Student Solvers",
            helpline: "Helpline",
            johar: phone ? `Johar, Citizen!` : "Johar, Citizen!",
            verified: "Verified Citizen",
            reputation: "Civic Reputation",
            activeCases: "My Active Cases",
            communityWins: "Resolved Cases",
            myCasesSubtitle: "Tracked directly by you",
            searchPlaceholder: "Search civic issues by locality, handpump, road, ward...",
            allIssues: "Community Feed",
            myReportsTab: "My Complaints",
            inProgress: "In Progress",
            resolved: "Resolved",
            clearFilters: "Reset Filters",
            noIssues: "No reports match your current search or filter criteria.",
            firstResponder: "Civic First Responders",
            callHelpline: "Call 1913 Toll-Free",
            viewProgress: "View Progress",
            upvote: "Upvote",
            upvoted: "Upvoted",
            profile: "Profile"
        },
        HI: {
            title: "सोशियोसॉल्व",
            sub: "झारखंड सरकार • नागरिक शिकायत निवारण प्रणाली",
            home: "मुख्य पृष्ठ",
            report: "शिकायत दर्ज करें",
            solvers: "छात्र समाधानकर्ता",
            helpline: "हेल्पलाइन",
            johar: "जोहार, नागरिक!",
            verified: "सत्यापित नागरिक",
            reputation: "नागरिक साख",
            activeCases: "मेरी सक्रिय शिकायतें",
            communityWins: "सुलझाए गए मामले",
            myCasesSubtitle: "आपके द्वारा दर्ज",
            searchPlaceholder: "वार्ड, हैंडपंप, सड़क या समस्या खोजें...",
            allIssues: "समुदाय फ़ीड",
            myReportsTab: "मेरी शिकायतें",
            inProgress: "प्रगति पर",
            resolved: "समाधानित",
            clearFilters: "फ़िल्टर हटाएं",
            noIssues: "कोई समस्या इस खोज से मेल नहीं खाती।",
            firstResponder: "आपातकालीन सहायता",
            callHelpline: "1913 पर कॉल करें",
            viewProgress: "प्रगति देखें",
            upvote: "समर्थन दें",
            upvoted: "समर्थन दिया",
            profile: "प्रोफ़ाइल"
        }
    }[lang];

    const [intelligenceData, setIntelligenceData] = useState<any | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
    const [feedbackRating, setFeedbackRating] = useState<number>(5);
    const [feedbackComment, setFeedbackComment] = useState<string>("");
    const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);
    const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);
    const [existingFeedback, setExistingFeedback] = useState<any | null>(null);

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const [myData, feedData, intelData] = await Promise.all([
                safeFetch("/api/reports/my", { credentials: "include" }),
                safeFetch("/api/reports?verified_only=false&limit=50", { credentials: "include" }),
                safeFetch("/api/reports/intelligence", { credentials: "include" }).catch(() => null)
            ]);

            setMyReports(Array.isArray(myData) ? myData : []);
            setReports(Array.isArray(feedData) ? feedData : []);
            if (intelData && intelData.status === "ok") {
                setIntelligenceData(intelData);
            }
        } catch (err: any) {
            const errorMsg = err.message || "Failed to load civic reports.";
            setError(errorMsg);
            showToast(errorMsg, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    // When a report is selected, check for existing feedback
    useEffect(() => {
        if (selectedReport) {
            setFeedbackSuccess(false);
            setFeedbackComment("");
            setFeedbackRating(5);
            setExistingFeedback(null);
            safeFetch(`/api/reports/${selectedReport.id}/feedback`, { credentials: "include" })
                .then(data => {
                    if (data && data.rating) {
                        setExistingFeedback(data);
                    }
                })
                .catch(() => setExistingFeedback(null));
        }
    }, [selectedReport]);

    const handleSubmitFeedback = async (reportId: number) => {
        if (!feedbackRating) {
            showToast("Please select a rating (1-5 stars)", "warning");
            return;
        }
        setSubmittingFeedback(true);
        try {
            await safeFetch(`/api/reports/${reportId}/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment.trim() || undefined })
            });
            showToast("Thank you! Outcome feedback submitted successfully.", "success");
            setFeedbackSuccess(true);
            setExistingFeedback({ rating: feedbackRating, comment: feedbackComment.trim() });
            fetchReports();
        } catch (err: any) {
            showToast(err.message || "Failed to submit outcome feedback", "error");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await safeFetch("/api/auth/logout", { method: "POST", credentials: "include" });
            showToast("Logged out successfully", "info");
        } catch (err: any) {
            setError("Logout failed");
            showToast("Logout error encountered", "error");
        } finally {
            setLoading(false);
            logout();
            navigate("/");
        }
    };

    const handleUpvote = (reportId: string | number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const allReps = [...reports, ...myReports];
        const targetReport = allReps.find(r => String(r.id) === String(reportId));
        if (targetReport && ['resolved', 'implemented'].includes(targetReport.status)) {
            showToast("This issue is already resolved and does not require priority upvoting.", "info");
            return;
        }
        if (upvoted[reportId]) {
            showToast("You have already upvoted this grievance.", "info");
            return;
        }
        setUpvoted(prev => ({ ...prev, [reportId]: true }));
        setUpvotes(prev => ({ ...prev, [reportId]: (prev[reportId] || 0) + 1 }));
        showToast("Upvote recorded! Priority score boosted for municipal dispatch.", "success");
    };

    const baseReports = activeTab === "My Reports" ? myReports : reports;

    const filteredReports = baseReports.filter(r => {
        // Search filter: matches title, description, category, or department
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const titleMatch = (r.title || "").toLowerCase().includes(q);
            const descMatch = (r.description || "").toLowerCase().includes(q);
            const catMatch = (r.category || "").toLowerCase().includes(q);
            const deptMatch = (r.assigned_department || r.department || "").toLowerCase().includes(q);
            const sumMatch = (r.challenge_summary || "").toLowerCase().includes(q);
            if (!titleMatch && !descMatch && !catMatch && !deptMatch && !sumMatch) {
                return false;
            }
        }

        // Ward filter (from Heatmap or search)
        if (selectedWard) {
            const wText = `ward ${selectedWard}`.toLowerCase();
            const desc = (r.description || "").toLowerCase();
            const title = (r.title || "").toLowerCase();
            const sum = (r.challenge_summary || "").toLowerCase();
            if (!desc.includes(wText) && !title.includes(wText) && !sum.includes(wText)) {
                return false;
            }
        }

        // Category quick filter
        if (selectedCategory !== "All") {
            const catClean = selectedCategory.toLowerCase();
            const rCat = (r.category || "").toLowerCase();
            if (!rCat.includes(catClean)) {
                return false;
            }
        }

        // Tab status filter
        if (activeTab === "In Progress") {
            return r.status === "in_progress" || r.status === "assigned" || r.status === "validated";
        }
        if (activeTab === "Resolved") {
            return r.status === "resolved" || r.status === "implemented";
        }
        return true;
    });

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="min-h-screen flex flex-col bg-background text-on-background selection:bg-[#c2edcb] selection:text-[#00210f]"
        >

{/*  Top Header / Navigation Bar (Full-Width Responsive Desktop & Mobile)  */}
<header className="bg-primary sticky top-0 z-40 shadow-sm border-b border-primary-container/40">
<div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
{/*  Brand Logo & Region  */}
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-surface-container-lowest/15 flex items-center justify-center text-on-primary">
<span className="material-symbols-outlined text-2xl" data-icon="eco">eco</span>
</div>
<div>
<div className="flex items-center gap-2">
<span className="text-xl font-bold font-headline-sm text-on-primary tracking-tight">{t.title}</span>
<span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-primary-container/80 border border-primary-fixed/25 text-[11px] font-mono uppercase tracking-wider text-primary-fixed">Jharkhand</span>
</div>
<p className="hidden sm:block text-[11px] text-primary-fixed/80 font-medium">{t.sub}</p>
</div>
</div>
{/*  Desktop Nav Links  */}
<nav aria-label="Desktop primary" className="hidden md:flex items-center gap-1 lg:gap-2">
<button onClick={() => { setActiveTab("All"); setSelectedWard(null); setSelectedCategory("All"); setSearchQuery(""); window.scrollTo({ top: 0, behavior: "smooth" }); }} type="button" className={`px-3.5 py-2 rounded-full font-label-md text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${activeTab === 'All' && !selectedWard ? 'text-on-primary bg-primary-container/70' : 'text-primary-fixed hover:text-on-primary hover:bg-primary-container/30'}`}>
<span className="material-symbols-outlined text-lg" data-icon="feed">feed</span>
        {t.home}
      </button>
<button onClick={() => { setActiveTab("My Reports"); window.scrollTo({ top: 0, behavior: "smooth" }); }} type="button" className={`px-3.5 py-2 rounded-full font-label-md text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${activeTab === 'My Reports' ? 'text-on-primary bg-primary-container/70' : 'text-primary-fixed hover:text-on-primary hover:bg-primary-container/30'}`}>
<span className="material-symbols-outlined text-lg">folder_shared</span>
        {t.myReportsTab} ({myReports.length})
      </button>
<button onClick={() => navigate('/report')} type="button" className="px-3.5 py-2 rounded-full text-primary-fixed hover:text-on-primary hover:bg-primary-container/30 font-label-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
<span className="material-symbols-outlined text-lg" data-icon="assignment_add">assignment_add</span>
        {t.report}
      </button>
<button onClick={() => { document.getElementById("student-solvers")?.scrollIntoView({ behavior: "smooth" }); showToast("Viewing active University Student Solvers", "info"); }} type="button" className="px-3.5 py-2 rounded-full text-primary-fixed hover:text-on-primary hover:bg-primary-container/30 font-label-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
<span className="material-symbols-outlined text-lg" data-icon="diversity_3">diversity_3</span>
        {t.solvers}
      </button>
<button onClick={() => { document.getElementById("hotline")?.scrollIntoView({ behavior: "smooth" }); showToast("Viewing 24x7 Helpline & Emergency Contacts", "info"); }} type="button" className="px-3.5 py-2 rounded-full text-primary-fixed hover:text-on-primary hover:bg-primary-container/30 font-label-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
<span className="material-symbols-outlined text-lg" data-icon="phone_in_talk">phone_in_talk</span>
        {t.helpline}
      </button>
<button onClick={() => navigate('/profile')} type="button" className="px-3.5 py-2 rounded-full text-primary-fixed hover:text-on-primary hover:bg-primary-container/30 font-label-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
<span className="material-symbols-outlined text-lg">account_circle</span>
        {t.profile}
      </button>
</nav>
{/*  Right Controls: Language Switch & Report CTA  */}
<div className="flex items-center gap-2 sm:gap-3">
{/*  Language Switch  */}
<button 
    onClick={() => {
        const nextLang = lang === "EN" ? "HI" : "EN";
        setLang(nextLang);
        showToast(nextLang === "HI" ? "भाषा बदलकर हिन्दी की गई" : "Language set to English", "success");
    }} 
    aria-label="Change Language" 
    type="button" 
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-container/50 hover:bg-primary-container text-on-primary text-xs font-semibold border border-primary-fixed/20 transition-all active:scale-95 cursor-pointer"
>
<span className="material-symbols-outlined text-base" data-icon="translate">translate</span>
<span className={`font-mono ${lang === 'EN' ? 'font-bold underline' : 'opacity-70'}`}>EN</span>
<span className="opacity-50">/</span>
<span className={`font-sans ${lang === 'HI' ? 'font-bold underline' : 'opacity-70'}`}>हिन्दी</span>
</button>
{/*  Desktop Report Button  */}
<button onClick={() => navigate('/report')} type="button" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary-container hover:bg-secondary-container/90 text-on-secondary-container font-headline-sm text-xs md:text-sm font-bold shadow-sm transition-all active:scale-95 cursor-pointer">
<span className="material-symbols-outlined text-lg" data-icon="add_circle">add_circle</span>
<span>{t.report}</span>
</button>
{/*  User Avatar / Profile Trigger  */}
<button onClick={() => navigate('/profile')} title={`Logged in as ${citizenName} • Click to open Profile`} type="button" className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs ring-2 ring-primary-container cursor-pointer hover:bg-primary-container hover:text-white transition-colors border-0">
        {citizenInitials}
</button>
</div>
</div>
</header>
{/*  Mobile Hero Banner (Visible only on mobile screens < lg)  */}
<section className="lg:hidden bg-primary relative px-4 pt-3 pb-12 rounded-b-[28px] text-on-primary overflow-hidden">
<div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden">
<svg className="w-full h-full object-cover" fill="none" preserveAspectRatio="none" viewBox="0 0 400 200">
<path d="M0,80 C120,130 240,40 400,100 L400,200 L0,200 Z" fill="#FFFFFF"></path>
<path d="M0,130 C150,80 280,160 400,110 L400,200 L0,200 Z" fill="#C2EDCB"></path>
</svg>
</div>
<div className="relative z-10 flex flex-col space-y-2">
<div className="flex items-center justify-between">
<span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary-container/70 border border-primary-fixed/20 text-on-primary-container text-xs font-semibold">
<span className="material-symbols-outlined text-[14px]" data-icon="verified_user">verified_user</span>
        {t.verified}
      </span>
<span className="text-xs text-primary-fixed/90 font-mono tracking-wider">{citizenIdBadge}</span>
</div>
<div>
<h2 className="text-2xl font-bold font-headline-lg tracking-tight">{t.johar}</h2>
<div className="flex items-center gap-1.5 mt-0.5 text-primary-fixed text-xs">
<span className="material-symbols-outlined text-[16px]" data-icon="location_on">location_on</span>
<span>{phone ? `Mobile: ${phone} • Ranchi Municipal Area` : "Ranchi Municipal Area"}</span>
</div>
</div>
</div>
</section>
{/*  Mobile Stats Strip (Overlap banner on mobile)  */}
<section className="lg:hidden px-4 -mt-7 relative z-20 mb-4">
<div className="grid grid-cols-2 gap-3">
<div 
    onClick={() => { setActiveTab("My Reports"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
    className={`bg-surface-container-lowest rounded-2xl p-4 whisper-border ambient-shadow flex flex-col justify-between cursor-pointer transition-all ${activeTab === 'My Reports' ? 'ring-2 ring-primary' : ''}`}
>
<div className="flex items-center justify-between">
<span className="text-on-surface-variant font-label-md text-xs">{t.activeCases}</span>
<div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-base" data-icon="assignment">assignment</span>
</div>
</div>
<div className="flex items-baseline gap-2 mt-2">
<span className="text-2xl font-bold font-mono text-on-surface leading-none">{myReports.length}</span>
<span className="text-[11px] text-on-surface-variant">{t.myCasesSubtitle}</span>
</div>
</div>
<div 
    onClick={() => { setActiveTab("Resolved"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
    className={`bg-surface-container-lowest rounded-2xl p-4 whisper-border ambient-shadow flex flex-col justify-between cursor-pointer transition-all ${activeTab === 'Resolved' ? 'ring-2 ring-primary' : ''}`}
>
<div className="flex items-center justify-between">
<span className="text-on-surface-variant font-label-md text-xs">{t.communityWins}</span>
<div className="w-7 h-7 rounded-full bg-primary-fixed/50 flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-base" data-icon="check_circle">check_circle</span>
</div>
</div>
<div className="flex items-baseline gap-2 mt-2">
<span className="text-2xl font-bold font-mono text-primary leading-none">
    {reports.filter(r => r.status === 'resolved' || r.status === 'implemented').length}
</span>
<span className="text-[11px] text-primary font-semibold">Community wins</span>
</div>
</div>
</div>
</section>
{/*  Main Responsive Content Container: 12-Column Grid (Desktop max-w-[1200px])  */}
<div className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
{/*  LEFT COLUMN (col-span-3 on Desktop): Citizen Profile & Ward Vitals  */}
<aside className="hidden lg:block lg:col-span-3 space-y-5 sticky top-24">
{/*  Citizen Profile Card  */}
<div className="bg-surface-container-lowest rounded-3xl p-5 whisper-border ambient-shadow">
<div className="flex items-start justify-between mb-4">
<div className="relative">
<div className="w-16 h-16 rounded-2xl bg-primary text-on-primary flex items-center justify-center text-2xl font-bold font-headline-md shadow-sm">
              {citizenInitials}
            </div>
<span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary-fixed flex items-center justify-center text-primary text-xs ring-2 ring-surface-container-lowest" title="Verified">
<span className="material-symbols-outlined text-[13px] fill-1" data-icon="check">check</span>
</span>
</div>
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed/40 text-on-primary-fixed-variant text-[11px] font-mono font-semibold">
            {citizenIdBadge}
          </span>
</div>
<h3 className="text-headline-md font-headline-md font-bold text-on-surface">{t.johar}</h3>
<p className="text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
<span className="material-symbols-outlined text-sm text-primary" data-icon="shield">shield</span>
          {phone ? `Verified Mobile: ${phone}` : "Verified Citizen • Ranchi Zone"}
        </p>
{/*  Civic Reputation Meter  */}
<div className="mt-4 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
<div className="flex items-center justify-between text-xs font-semibold mb-1.5">
<span className="text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-sm text-secondary" data-icon="stars">stars</span>
              {t.reputation}
            </span>
<span className="font-mono text-primary font-bold">{civicReputation} <span className="text-outline text-[10px]">/ 1000</span></span>
</div>
<div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
<div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(civicReputation / 1000) * 100}%` }}></div>
</div>
<p className="text-[11px] text-on-surface-variant mt-1.5">
    {myReports.length > 0 
        ? `${myReports.length} complaint(s) filed • Active contributor in Ranchi` 
        : "Verified Citizen • Report civic issues to level up"}
</p>
</div>
{/*  Case Counts Grid  */}
<div className="grid grid-cols-2 gap-2.5 mt-4">
<button 
    type="button"
    onClick={() => setActiveTab("My Reports")}
    className={`bg-surface-container-low/70 rounded-xl p-3 border text-left transition-all cursor-pointer ${activeTab === 'My Reports' ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/20 hover:border-primary/40'}`}
>
<span className="text-[11px] text-on-surface-variant font-medium">{t.activeCases}</span>
<div className="flex items-baseline gap-1 mt-1">
<span className="text-2xl font-bold font-mono text-on-surface">{myReports.length}</span>
<span className="text-[10px] text-secondary font-semibold">Tracked</span>
</div>
</button>
<button 
    type="button"
    onClick={() => setActiveTab("Resolved")}
    className={`bg-surface-container-low/70 rounded-xl p-3 border text-left transition-all cursor-pointer ${activeTab === 'Resolved' ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/20 hover:border-primary/40'}`}
>
<span className="text-[11px] text-on-surface-variant font-medium">{t.communityWins}</span>
<div className="flex items-baseline gap-1 mt-1">
<span className="text-2xl font-bold font-mono text-primary">
    {reports.filter(r => r.status === 'resolved' || r.status === 'implemented').length}
</span>
<span className="text-[10px] text-primary font-semibold">Wins</span>
</div>
</button>
</div>
<button 
    type="button" 
    onClick={() => navigate('/profile')}
    className="w-full mt-3 py-2 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold flex items-center justify-between transition-all border border-outline-variant/30 cursor-pointer"
>
    <span className="flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm text-primary">badge</span>
        <span>Resident Profile &amp; Settings</span>
    </span>
    <span className="material-symbols-outlined text-sm text-outline">arrow_forward</span>
</button>
</div>
{/*  Municipal Live Vitals Card  */}
<div className="bg-surface-container-lowest rounded-3xl p-5 whisper-border ambient-shadow">
<div className="flex items-center justify-between mb-3.5">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-xl" data-icon="analytics">analytics</span>
<h4 className="font-headline-sm text-sm font-bold text-on-surface">
    {selectedWard ? `Ward ${selectedWard} Vitals` : "Ranchi Municipal Vitals"}
</h4>
</div>
<span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">Live</span>
</div>
<ul className="space-y-3 text-xs">
<li className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
<span className="flex items-center gap-2 text-on-surface-variant">
<span className="material-symbols-outlined text-blue-600 text-base" data-icon="water_drop">water_drop</span>
              Water Supply Index
            </span>
<span className="font-mono font-bold text-on-surface">82% <span className="text-[10px] text-primary font-semibold">Stable</span></span>
</li>
<li className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
<span className="flex items-center gap-2 text-on-surface-variant">
<span className="material-symbols-outlined text-amber-500 text-base" data-icon="lightbulb">lightbulb</span>
              Streetlights Functional
            </span>
<span className="font-mono font-bold text-on-surface">94% <span className="text-[10px] text-primary font-semibold">Normal</span></span>
</li>
<li className="flex items-center justify-between">
<span className="flex items-center gap-2 text-on-surface-variant">
<span className="material-symbols-outlined text-emerald-600 text-base" data-icon="delete_sweep">delete_sweep</span>
              Waste Cleared Today
            </span>
<span className="font-mono font-bold text-on-surface">98% <span className="text-[10px] text-primary font-semibold">On-time</span></span>
</li>
</ul>
</div>
{/*  Civic First Responders Helpline  */}
<div className="bg-primary/5 rounded-3xl p-5 border border-primary/20">
<div className="flex items-center gap-2.5 text-primary mb-2">
<span className="material-symbols-outlined text-xl" data-icon="emergency">emergency</span>
<h5 className="font-headline-sm text-sm font-bold">Civic First Responders</h5>
</div>
<p className="text-xs text-on-surface-variant leading-relaxed">
          Urgent municipal emergency in your ward? Direct bridge to Ranchi Municipal Disaster Cell.
        </p>
<a className="mt-3 inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all" href="tel:1913">
<span className="material-symbols-outlined text-base" data-icon="call">call</span>
<span>Call 1913 Toll-Free</span>
</a>
</div>
</aside>
{/*  CENTER FEED (col-span-6 on Desktop): Search, Filters, Issue Cards  */}
<main className="lg:col-span-6 space-y-4 pb-20 lg:pb-8">
{/*  CLOSED INNOVATION LOOP BANNER (Point 10)  */}
<div className="bg-gradient-to-r from-primary/15 via-emerald-500/10 to-secondary/15 rounded-3xl p-5 border border-primary/20 shadow-xs relative overflow-hidden">
    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
        <span className="material-symbols-outlined text-sm">all_inclusive</span>
        Jharkhand Closed Innovation Loop
    </div>
    <h3 className="font-headline-sm text-base font-bold text-on-surface">Citizen Grievances Solved by Local University Research</h3>
    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
        Grievances submitted by citizens are AI-validated, assigned to premier Jharkhand engineering faculties (BIT Mesra, NIT Jamshedpur, IIT Dhanbad), funded by CSR partners, and verified on ground.
    </p>
    <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-outline-variant/30 text-center">
        <div className="bg-surface-container-lowest/80 rounded-xl p-2">
            <span className="block text-primary font-bold text-xs">1. Report</span>
            <span className="text-[10px] text-on-surface-variant">Citizen + GPS</span>
        </div>
        <div className="bg-surface-container-lowest/80 rounded-xl p-2">
            <span className="block text-secondary font-bold text-xs">2. Triage</span>
            <span className="text-[10px] text-on-surface-variant">AI Scoring</span>
        </div>
        <div className="bg-surface-container-lowest/80 rounded-xl p-2">
            <span className="block text-amber-600 font-bold text-xs">3. Solve</span>
            <span className="text-[10px] text-on-surface-variant">Faculty + Team</span>
        </div>
        <div className="bg-surface-container-lowest/80 rounded-xl p-2">
            <span className="block text-emerald-600 font-bold text-xs">4. Impact</span>
            <span className="text-[10px] text-on-surface-variant">Govt Rollout</span>
        </div>
    </div>
</div>

{/*  DISTRICT & PANCHAYAT PROBLEM INTELLIGENCE WIDGET (Point 3)  */}
{intelligenceData && (
    <div className="bg-surface-container-lowest rounded-3xl p-5 whisper-border ambient-shadow space-y-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">insights</span>
                </span>
                <div>
                    <h4 className="font-headline-sm text-sm font-bold text-on-surface">Jharkhand Civic Intelligence</h4>
                    <p className="text-[11px] text-on-surface-variant">Real-time local district &amp; panchayat grievance aggregation</p>
                </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                LIVE
            </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center py-2 bg-surface-container-low/60 rounded-2xl">
            <div>
                <span className="block text-lg font-bold font-mono text-on-surface">{intelligenceData.total_grievances || reports.length}</span>
                <span className="text-[10px] text-on-surface-variant font-medium">Total Grievances</span>
            </div>
            <div>
                <span className="block text-lg font-bold font-mono text-primary">{intelligenceData.resolution_rate || "74%"}</span>
                <span className="text-[10px] text-on-surface-variant font-medium">Resolution Rate</span>
            </div>
            <div>
                <span className="block text-lg font-bold font-mono text-secondary">{intelligenceData.districts_active || 24}</span>
                <span className="text-[10px] text-on-surface-variant font-medium">Districts Tracked</span>
            </div>
        </div>

        {intelligenceData.hotspots && intelligenceData.hotspots.length > 0 && (
            <div className="pt-2">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Priority Panchayat &amp; Ward Hotspots:</span>
                <div className="space-y-1.5">
                    {intelligenceData.hotspots.slice(0, 3).map((h: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-surface-container-low/40">
                            <span className="flex items-center gap-1.5 text-on-surface font-medium">
                                <span className="material-symbols-outlined text-sm text-amber-500">warning</span>
                                {h.district || "Ranchi"} • {h.panchayat_ward || "Ward 14"}
                            </span>
                            <span className="font-mono text-xs font-semibold text-primary">
                                {h.category} (Sev: {h.severity || "High"})
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
)}

{/*  Search & Filters Container  */}
<div className="bg-surface-container-lowest rounded-3xl p-4 whisper-border ambient-shadow space-y-3">
{/*  Live Controlled Search Bar  */}
<div className="relative flex items-center">
<span className="material-symbols-outlined absolute left-3.5 text-outline text-xl" data-icon="search">search</span>
<input 
    className="w-full pl-10 pr-10 py-2.5 bg-surface-container-low rounded-2xl border-0 focus:ring-2 focus:ring-primary text-body-md text-sm text-on-surface placeholder:text-outline-variant font-medium outline-none" 
    placeholder={t.searchPlaceholder} 
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
/>
{searchQuery ? (
    <button 
        type="button" 
        onClick={() => setSearchQuery("")} 
        aria-label="Clear Search" 
        className="absolute right-2.5 p-1.5 text-on-surface-variant hover:text-primary rounded-lg transition-colors cursor-pointer"
    >
        <span className="material-symbols-outlined text-xl">close</span>
    </button>
) : (
    <button 
        type="button" 
        onClick={() => setShowFilters(!showFilters)} 
        aria-label="Filter" 
        title="Toggle Category Filters"
        className={`absolute right-2.5 p-1.5 rounded-lg transition-colors cursor-pointer ${showFilters ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-primary'}`}
    >
        <span className="material-symbols-outlined text-xl" data-icon="tune">tune</span>
    </button>
)}
</div>

{/*  Expandable Category Quick Filter Pills  */}
{showFilters && (
    <div className="pt-2 pb-1 border-t border-outline-variant/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">Category:</span>
        {["All", "Water", "Road", "Sanitation", "Streetlight", "Electricity"].map(cat => (
            <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all active:scale-95 whitespace-nowrap ${
                    selectedCategory === cat 
                        ? 'bg-[#294e36] text-white shadow-xs' 
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
            >
                {cat === "All" ? "All Categories" : cat}
            </button>
        ))}
    </div>
)}

{/*  Filter Pills Tablist & Active Ward Tag  */}
<div className="flex flex-wrap items-center justify-between gap-2 pt-1">
    <div aria-label="Issue filters" className="flex items-center gap-2 overflow-x-auto no-scrollbar" role="tablist">
        <button 
            onClick={() => { setActiveTab('All'); }} 
            aria-selected={activeTab === 'All'} 
            className={`min-h-[36px] px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all shadow-sm cursor-pointer ${activeTab === 'All' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant whisper-border hover:bg-surface-container-high font-medium'}`} 
            role="tab" 
            type="button"
        >
            {t.allIssues}
        </button>
        <button 
            onClick={() => { setActiveTab('My Reports'); }} 
            aria-selected={activeTab === 'My Reports'} 
            className={`min-h-[36px] px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all shadow-sm cursor-pointer flex items-center gap-1.5 ${activeTab === 'My Reports' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant whisper-border hover:bg-surface-container-high font-medium'}`} 
            role="tab" 
            type="button"
        >
            <span>{t.myReportsTab}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'My Reports' ? 'bg-on-primary text-primary font-bold' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {myReports.length}
            </span>
        </button>
        <button 
            onClick={() => setActiveTab('In Progress')} 
            aria-selected={activeTab === 'In Progress'} 
            className={`min-h-[36px] px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all shadow-sm cursor-pointer ${activeTab === 'In Progress' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant whisper-border hover:bg-surface-container-high font-medium'}`} 
            role="tab" 
            type="button"
        >
            {t.inProgress}
        </button>
        <button 
            onClick={() => setActiveTab('Resolved')} 
            aria-selected={activeTab === 'Resolved'} 
            className={`min-h-[36px] px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all shadow-sm cursor-pointer ${activeTab === 'Resolved' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant whisper-border hover:bg-surface-container-high font-medium'}`} 
            role="tab" 
            type="button"
        >
            {t.resolved}
        </button>
    </div>

    {/*  Active Ward Pill  */}
    {selectedWard && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-xs font-bold font-mono animate-fade-in">
            <span>Ward {selectedWard}</span>
            <button 
                type="button" 
                onClick={() => setSelectedWard(null)} 
                className="hover:bg-primary-container/80 rounded-full p-0.5 cursor-pointer"
                title="Clear Ward filter"
            >
                <span className="material-symbols-outlined text-sm block">close</span>
            </button>
        </span>
    )}
</div>
</div>

{/*  Loading State  */}
{loading && (
    <div className="bg-surface-container-lowest rounded-3xl p-8 text-center whisper-border ambient-shadow space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-mono text-on-surface-variant">Fetching synchronized civic reports...</p>
    </div>
)}

{/*  Error State Banner  */}
{!loading && error && (
    <div className="bg-red-50 rounded-2xl p-4 border border-red-200 text-red-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-red-600">error</span>
            <span>{error}</span>
        </div>
        <button 
            type="button" 
            onClick={fetchReports} 
            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
        >
            Retry
        </button>
    </div>
)}

{/*  Empty State  */}
{!loading && !error && filteredReports.length === 0 && (
    <div className="bg-surface-container-low rounded-3xl p-8 text-center text-on-surface-variant border border-dashed border-outline-variant/50 space-y-3">
        <span className="material-symbols-outlined text-4xl opacity-50 block mx-auto" data-icon="inbox">inbox</span>
        <p className="text-sm font-medium">
            {activeTab === "My Reports" 
                ? (lang === "HI" ? "आपने अभी तक कोई शिकायत दर्ज नहीं की है।" : "You haven't submitted any civic complaints yet.")
                : t.noIssues}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
            {activeTab === "My Reports" ? (
                <button 
                    type="button" 
                    onClick={() => navigate('/report')} 
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold cursor-pointer shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    <span>{t.report}</span>
                </button>
            ) : (
                <>
                    {searchQuery && (
                        <button 
                            type="button" 
                            onClick={() => setSearchQuery("")} 
                            className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold cursor-pointer"
                        >
                            Clear Search
                        </button>
                    )}
                    <button 
                        type="button" 
                        onClick={() => { setActiveTab("All"); setSelectedWard(null); setSelectedCategory("All"); setSearchQuery(""); }} 
                        className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold cursor-pointer shadow-xs"
                    >
                        {t.clearFilters}
                    </button>
                </>
            )}
        </div>
    </div>
)}

{/*  Report Cards Feed  */}
{!loading && filteredReports.map((report: any) => {
    const reportId = report.id;
    const currentUpvotes = (report.priority_score ? Math.round(report.priority_score * 10) : 5) + (upvotes[reportId] || 0);
    const hasUpvoted = !!upvoted[reportId];
    const displayTitle = report.title || report.challenge_summary || (report.description ? report.description.split('\n')[0].slice(0, 60) : `Civic Grievance #${reportId}`);

    return (
        <article 
            key={reportId} 
            className="bg-surface-container-lowest rounded-3xl p-5 whisper-border ambient-shadow transition-all hover:border-primary/40 focus-within:ring-2 focus-within:ring-primary space-y-3"
        >
            {/*  Top Status & Category Row  */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                        report.status === 'resolved' || report.status === 'implemented' ? 'bg-primary-fixed text-on-primary-fixed' :
                        report.status === 'in_progress' || report.status === 'assigned' ? 'bg-secondary-container text-on-secondary-container' :
                        'bg-error-container text-on-error-container'
                    }`}>
                        {(report.status === 'resolved' || report.status === 'implemented') ? (
                            <span className="material-symbols-outlined text-sm" data-icon="verified">verified</span>
                        ) : (
                            <span className="relative flex h-2 w-2">
                                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                            </span>
                        )}
                        {(report.status || 'reported').replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="hidden sm:inline-flex items-center text-xs font-mono text-outline">
                        #{String(reportId).slice(0, 8).toUpperCase()}
                    </span>
                </div>
                <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                    {report.category || 'Civic Issue'}
                </span>
            </div>
            
            {/*  Issue Title / Description */}
            <h4 
                onClick={() => setSelectedReport(report)} 
                className="text-headline-sm font-headline-sm text-on-surface font-bold text-lg hover:text-primary cursor-pointer transition-colors"
            >
                {displayTitle}
            </h4>
            <p className="text-body-md text-sm text-on-surface-variant leading-relaxed line-clamp-3">
                {report.description}
            </p>

            {/*  Attached Photo / Evidence  */}
            {report.photo_url && report.photo_url !== "dummy" && (
                <div 
                    onClick={() => setSelectedReport(report)}
                    className="rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface-container-high relative max-h-56 cursor-pointer"
                >
                    <div className="aspect-video w-full bg-gradient-to-tr from-surface-container-highest via-surface-container to-surface-container-high flex flex-col items-center justify-center text-center overflow-hidden">
                        <img src={report.photo_url} alt="Evidence" className="w-full h-full object-cover" />
                    </div>
                </div>
            )}

            {/*  Interactive Bottom Action Row  */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-outline-variant/30">
                <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium">
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-outline" data-icon="calendar_today">calendar_today</span>
                        {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                    {report.gps_lat && report.gps_lon && (
                        <span className="hidden sm:flex items-center gap-1 font-mono text-[11px]">
                            <span className="material-symbols-outlined text-sm text-outline" data-icon="location_on">location_on</span>
                            {Number(report.gps_lat).toFixed(3)}°, {Number(report.gps_lon).toFixed(3)}°
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/*  Interactive Upvote Button or Resolved State  */}
                    {['resolved', 'implemented'].includes(report.status) ? (
                        <span 
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                            title="Issue resolved on ground"
                        >
                            <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                            <span>{report.status === 'implemented' ? 'Implemented' : 'Resolved'}</span>
                            <span className="text-[10px] text-emerald-600/70 font-mono ml-0.5">({currentUpvotes})</span>
                        </span>
                    ) : (
                        <button 
                            type="button"
                            onClick={(e) => handleUpvote(reportId, e)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                                hasUpvoted 
                                    ? 'bg-[#c2edcb] text-[#294e36] ring-1 ring-[#3e644a]/40 shadow-xs' 
                                    : 'bg-surface-container hover:bg-primary/10 text-on-surface hover:text-primary'
                            }`}
                            title="Upvote grievance priority"
                        >
                            <span className={`material-symbols-outlined text-[16px] ${hasUpvoted ? 'text-[#3e644a]' : 'text-outline'}`}>
                                thumb_up
                            </span>
                            <span>{currentUpvotes}</span>
                        </button>
                    )}

                    {/*  Interactive Timeline Detail View Button  */}
                    <button 
                        type="button"
                        onClick={() => setSelectedReport(report)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[16px]">timeline</span>
                        <span>View Progress</span>
                    </button>
                </div>
            </div>
        </article>
    );
})}
</main>

{/*  RIGHT RAIL (col-span-3 on Desktop): Heatmap, Student Solvers, Hotline  */}
<aside className="hidden lg:block lg:col-span-3 space-y-5 sticky top-24">
{/*  Ranchi Ward Map / Live Heatmap Card  */}
<div className="bg-surface-container-lowest rounded-3xl p-5 whisper-border ambient-shadow">
<div className="flex items-center justify-between mb-3">
<h4 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-2">
<span className="material-symbols-outlined text-primary" data-icon="map">map</span>
            Ranchi Live Heatmap
          </h4>
<span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold">12 Wards</span>
</div>
{/*  Stylized Ward Grid Heatmap  */}
<div className="relative rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/30 p-3">
<div className="grid grid-cols-4 gap-1.5 aspect-square">
{[
    { name: "W1", num: "1", title: "Ward 1 - Normal", style: "bg-primary/20 hover:bg-primary/40 text-primary" },
    { name: "W2", num: "2", title: "Ward 2 - Low", style: "bg-primary-fixed hover:bg-primary/40 text-primary" },
    { name: "W3", num: "3", title: "Ward 3 - Medium Load", style: "bg-secondary-container/60 hover:bg-secondary-container text-on-secondary-container" },
    { name: "W4★", num: "4", title: "Ward 4 - High Activity", style: "bg-error-container hover:bg-error-container/90 text-on-error-container ring-2 ring-error" },
    { name: "W5", num: "5", title: "Ward 5 - Normal", style: "bg-primary-fixed/80 hover:bg-primary/40 text-primary" },
    { name: "W6", num: "6", title: "Ward 6 - Moderate", style: "bg-secondary-container/40 hover:bg-secondary-container text-on-secondary-container" },
    { name: "W7", num: "7", title: "Ward 7 - Normal", style: "bg-primary/20 hover:bg-primary/40 text-primary" },
    { name: "W8", num: "8", title: "Ward 8 - Low", style: "bg-primary-fixed hover:bg-primary/40 text-primary" },
    { name: "W9", num: "9", title: "Ward 9 - Low", style: "bg-primary/10 hover:bg-primary/40 text-primary" },
    { name: "W10", num: "10", title: "Ward 10 - Moderate", style: "bg-secondary-container/50 hover:bg-secondary-container text-on-secondary-container" },
    { name: "W11", num: "11", title: "Ward 11 - Low", style: "bg-primary-fixed hover:bg-primary/40 text-primary" },
    { name: "W12", num: "12", title: "Ward 12 - Normal", style: "bg-primary/20 hover:bg-primary/40 text-primary" },
].map((ward) => (
    <button
        key={ward.name}
        type="button"
        onClick={() => { 
            setSearchQuery(`Ward ${ward.num}`); 
            setActiveTab("All");
            showToast(`Filtering civic feed for Ward ${ward.num}`, "info"); 
        }}
        title={`Click to filter feed for Ward ${ward.num}`}
        className={`rounded-lg flex flex-col items-center justify-center text-[10px] font-mono font-bold transition-all cursor-pointer border-0 active:scale-95 ${ward.style}`}
    >
        {ward.name}
    </button>
))}
</div>
<div className="flex items-center justify-between text-[10px] text-on-surface-variant font-mono mt-2 pt-2 border-t border-outline-variant/20">
<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-fixed"></span> Low</span>
<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary-container"></span> Mod</span>
<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error"></span> High Priority</span>
</div>
</div>
</div>
{/*  Student Solvers Active Colleges & Projects Card  */}
<div id="student-solvers" className="bg-surface-container-lowest rounded-3xl p-5 whisper-border ambient-shadow scroll-mt-20">
<div className="flex items-center justify-between mb-3">
<h4 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-2">
<span className="material-symbols-outlined text-primary" data-icon="groups">groups</span>
            {t.solvers}
          </h4>
<span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold">Live Capstones</span>
</div>
<p className="text-xs text-on-surface-variant mb-3">Top University Chapters building engineering solutions for Ranchi grievances:</p>
<ul className="space-y-2.5">
<li className="p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between">
    <div className="flex items-center gap-2.5">
        <span className="w-7 h-7 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs font-mono">BM</span>
        <div>
            <p className="text-xs font-bold text-on-surface">BIT Mesra • Team AquaTech</p>
            <p className="text-[10px] text-primary font-medium">IoT Handpump Flow &amp; Telemetry</p>
        </div>
    </div>
    <span className="text-xs font-mono font-bold text-primary">#1</span>
</div>
<div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-on-surface-variant">
    <span>Ward 4 Adoption</span>
    <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Prototype Deployed</span>
</div>
</li>

<li className="p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between">
    <div className="flex items-center gap-2.5">
        <span className="w-7 h-7 rounded-xl bg-surface-container-highest text-on-surface flex items-center justify-center font-bold text-xs font-mono">RU</span>
        <div>
            <p className="text-xs font-bold text-on-surface">Ranchi Univ • GreenCity</p>
            <p className="text-[10px] text-primary font-medium">Drainage Desiltation AI Route</p>
        </div>
    </div>
    <span className="text-xs font-mono font-bold text-outline">#2</span>
</div>
<div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-on-surface-variant">
    <span>Ward 2 &amp; 3 Audits</span>
    <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">In Testing</span>
</div>
</li>

<li className="p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between">
    <div className="flex items-center gap-2.5">
        <span className="w-7 h-7 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-xs font-mono">IIM</span>
        <div>
            <p className="text-xs font-bold text-on-surface">IIM Ranchi • Civic Lab</p>
            <p className="text-[10px] text-primary font-medium">Municipal SLA Bottleneck Audits</p>
        </div>
    </div>
    <span className="text-xs font-mono font-bold text-outline">#3</span>
</div>
<div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-on-surface-variant">
    <span>Urban Logistics Model</span>
    <span className="font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Policy Sign-off</span>
</div>
</li>
</ul>
<button 
    type="button" 
    onClick={() => navigate('/login/student')} 
    className="w-full mt-3 py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-0"
>
    <span className="material-symbols-outlined text-sm">school</span>
    <span>Join as Student Solver Chapter</span>
</button>
</div>
{/*  Ward Notice Highlights Card  */}
<div className="bg-surface-container-lowest rounded-3xl p-5 whisper-border ambient-shadow">
<div className="flex items-center gap-2 text-on-surface font-headline-sm font-bold text-sm mb-2.5">
<span className="material-symbols-outlined text-secondary" data-icon="campaign">campaign</span>
          Ward Highlights Notice
        </div>
<p className="text-xs text-on-surface-variant leading-relaxed">
          Bi-weekly Ward 4 Sabha scheduled this Sunday 10:00 AM at Community Hall Morabadi. Topic: Monsoon drainage cleaning review.
        </p>
<button 
    type="button" 
    onClick={() => showComingSoon("Ward Sabha Agenda Download")} 
    className="inline-block mt-2 text-[11px] font-semibold text-primary hover:underline cursor-pointer bg-transparent border-0 p-0 text-left"
>
    Download Agenda (PDF) →
</button>
</div>
{/*  Multilingual Voice Hotline Card  */}
<div id="hotline" className="rounded-3xl p-5 bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-sm scroll-mt-20">
<div className="flex items-center gap-2 mb-2">
<span className="material-symbols-outlined text-2xl text-secondary-fixed" data-icon="record_voice_over">record_voice_over</span>
<h5 className="font-headline-sm text-sm font-bold">Multilingual Voice Hotline</h5>
</div>
<p className="text-xs text-primary-fixed/90 leading-relaxed mb-3">
          Can't type? Report via phone in <strong className="text-white">Santali, Ho, Kurukh, Mundari, or Hindi</strong>.
        </p>
<div className="p-3 rounded-2xl bg-surface-container-lowest/15 border border-surface-container-lowest/20 flex items-center justify-between">
<div>
<span className="text-[10px] font-mono uppercase text-primary-fixed">Toll-Free Helpline</span>
<p className="text-sm font-bold font-mono text-white tracking-wide">1800-JH-VOICE</p>
</div>
<a className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold hover:scale-105 active:scale-95 transition-transform" href="tel:18005486423">
<span className="material-symbols-outlined text-base" data-icon="call">call</span>
</a>
</div>
</div>
</aside>
</div>
</div>

{/*  Interactive Timeline / Detail Modal  */}
<AnimatePresence>
{selectedReport && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#3e644a]/20 space-y-5 text-[#1b1b1e]"
        >
            <div className="flex items-start justify-between pb-3 border-b border-[#c1c8c0]/40">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#c2edcb] text-[#294e36]">
                            Ticket #{String(selectedReport.id).slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-xs text-[#727972] font-semibold">{selectedReport.category}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1b1b1e]">
                        {selectedReport.title || selectedReport.challenge_summary || "Civic Grievance Details"}
                    </h3>
                </div>
                <button 
                    type="button" 
                    onClick={() => setSelectedReport(null)}
                    aria-label="Close dialog"
                    className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[#727972] hover:text-[#1b1b1e] cursor-pointer"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
                <div>
                    <p className="font-semibold text-gray-500 uppercase tracking-wider text-[11px]">Description</p>
                    <p className="text-[#424942] mt-0.5 leading-relaxed bg-[#fbf8fc] p-3 rounded-xl border border-[#c1c8c0]/40">
                        {selectedReport.description}
                    </p>
                </div>

                {selectedReport.photo_url && selectedReport.photo_url !== "dummy" && (
                    <div>
                        <p className="font-semibold text-gray-500 uppercase tracking-wider text-[11px] mb-1">Evidence Photo</p>
                        <img src={selectedReport.photo_url} alt="Evidence" className="w-full max-h-48 object-cover rounded-xl border" />
                    </div>
                )}

                {/*  Redressal Pipeline Timeline  */}
                <div className="pt-2">
                    <p className="font-bold text-[#1b1b1e] text-xs uppercase tracking-wider mb-3">6-Step Redressal Timeline</p>
                    <div className="space-y-2.5 text-xs">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                            <div>
                                <p className="font-bold text-[#1b1b1e]">1. Ticket Logged &amp; Geotagged</p>
                                <p className="text-gray-500 text-[11px]">Recorded into Ranchi Municipal Database</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                            <div>
                                <p className="font-bold text-[#1b1b1e]">2. AI Triage &amp; Spam Screening</p>
                                <p className="text-gray-500 text-[11px]">Verified genuine • Priority score computed</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-lg ${selectedReport.status !== 'reported' ? 'text-emerald-600' : 'text-amber-500 animate-pulse'}`}>
                                {selectedReport.status !== 'reported' ? 'check_circle' : 'pending'}
                            </span>
                            <div>
                                <p className="font-bold text-[#1b1b1e]">3. Department Allocation</p>
                                <p className="text-gray-500 text-[11px]">
                                    {selectedReport.assigned_department || selectedReport.department || "PHED & RMC Ward 4 Cell"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-lg ${['assigned', 'in_progress', 'under_review', 'implemented', 'resolved'].includes(selectedReport.status) ? 'text-emerald-600' : 'text-gray-300'}`}>
                                {['assigned', 'in_progress', 'under_review', 'implemented', 'resolved'].includes(selectedReport.status) ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <div>
                                <p className="font-bold text-[#1b1b1e]">
                                    {selectedReport.is_student_eligible !== false ? "4. Student Solver Adoption" : "4. Municipal Crew Dispatch"}
                                </p>
                                <p className="text-gray-500 text-[11px]">
                                    {selectedReport.is_student_eligible !== false 
                                        ? "BIT Mesra & University Engineering Chapters" 
                                        : "RMC Engineering & Ward Maintenance Wing (Physical Labor)"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-lg ${['in_progress', 'under_review', 'implemented', 'resolved'].includes(selectedReport.status) ? 'text-emerald-600' : 'text-gray-300'}`}>
                                {['in_progress', 'under_review', 'implemented', 'resolved'].includes(selectedReport.status) ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <div>
                                <p className="font-bold text-[#1b1b1e]">5. Field Work &amp; Repair</p>
                                <p className="text-gray-500 text-[11px]">Active engineering and inspection</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-lg ${['implemented', 'resolved'].includes(selectedReport.status) ? 'text-emerald-600' : 'text-gray-300'}`}>
                                {['implemented', 'resolved'].includes(selectedReport.status) ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <div>
                                <p className="font-bold text-[#1b1b1e]">6. Citizen Verification &amp; Closeout</p>
                                <p className="text-gray-500 text-[11px]">Feedback rating &amp; SLA compliance sign-off</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-3 border-t border-[#c1c8c0]/40 flex items-center justify-between">
                {['resolved', 'implemented'].includes(selectedReport.status) ? (
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                        <span>{selectedReport.status === 'implemented' ? 'Ground Implementation Complete' : 'Issue Resolved'}</span>
                    </span>
                ) : (
                    <button 
                        type="button" 
                        onClick={(e) => handleUpvote(selectedReport.id, e)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            upvoted[selectedReport.id]
                                ? 'bg-[#c2edcb] text-[#294e36]'
                                : 'bg-[#3e644a] text-white hover:bg-[#2e4c37]'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">thumb_up</span>
                        <span>{upvoted[selectedReport.id] ? t.upvoted : t.upvote}</span>
                    </button>
                )}
                <button 
                    type="button" 
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#1b1b1e] text-xs font-semibold cursor-pointer"
                >
                    Close
                </button>
            </div>
        </motion.div>
    </div>
)}
</AnimatePresence>

{/*  Floating Action Button (FAB) for Reporting Civic Issues (Mobile Only)  */}
<aside className="lg:hidden fixed bottom-20 right-5 z-40">
<button onClick={() => navigate('/report')} aria-label="Report new civic issue" className="w-14 h-14 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center elevated-fab-shadow active:scale-90 transition-transform focus:outline-none focus:ring-4 focus:ring-secondary-container/40 cursor-pointer" type="button">
<span className="material-symbols-outlined text-[32px] select-none pointer-events-none" data-icon="add">add</span>
</button>
</aside>

{/*  BottomNavBar (Mobile Only)  */}
<nav aria-label="Primary Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2 bg-surface-container-low/95 backdrop-blur-md shadow-sm border-t border-outline-variant/30">
<button 
    onClick={() => { setActiveTab("All"); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
    aria-current={activeTab === "All" ? "page" : undefined} 
    aria-label="Feed" 
    className={`flex flex-col items-center justify-center min-h-[44px] min-w-[54px] rounded-xl px-2 py-1 active:scale-90 transition-transform duration-150 cursor-pointer ${activeTab === 'All' ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:text-primary'}`} 
    type="button"
>
    <span className="material-symbols-outlined text-[20px]" data-icon="feed">feed</span>
    <span className="text-[10px] mt-0.5">Feed</span>
</button>

<button 
    onClick={() => { setActiveTab("My Reports"); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
    aria-label="My Reports" 
    className={`flex flex-col items-center justify-center min-h-[44px] min-w-[54px] rounded-xl px-2 py-1 active:scale-90 transition-transform duration-150 cursor-pointer ${activeTab === 'My Reports' ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:text-primary'}`} 
    type="button"
>
    <div className="relative">
        <span className="material-symbols-outlined text-[20px]" data-icon="assignment">assignment</span>
        {myReports.length > 0 && (
            <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {myReports.length}
            </span>
        )}
    </div>
    <span className="text-[10px] mt-0.5">My Cases</span>
</button>

<button 
    onClick={() => { document.getElementById("student-solvers")?.scrollIntoView({ behavior: "smooth" }); showToast("Active University Student Solvers", "info"); }} 
    aria-label="Student Solvers" 
    className="flex flex-col items-center justify-center min-h-[44px] min-w-[54px] text-on-surface-variant px-2 py-1 hover:text-primary active:scale-90 transition-transform duration-150 cursor-pointer" 
    type="button"
>
    <span className="material-symbols-outlined text-[20px]" data-icon="diversity_3">diversity_3</span>
    <span className="text-[10px] mt-0.5">Solvers</span>
</button>

<button 
    onClick={() => navigate('/profile')} 
    aria-label="Profile" 
    className="flex flex-col items-center justify-center min-h-[44px] min-w-[54px] text-on-surface-variant px-2 py-1 hover:text-primary active:scale-90 transition-transform duration-150 cursor-pointer" 
    type="button"
>
    <span className="material-symbols-outlined text-[20px]" data-icon="account_circle">account_circle</span>
    <span className="text-[10px] mt-0.5">{t.profile}</span>
</button>
</nav>

{/*  Full-Width Multi-Column Footer (Spanning 100% Viewport)  */}
<footer className="w-full bg-surface-container border-t border-outline-variant/30 text-on-surface-variant mt-auto">
<div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
{/*  Col 1: Brand & Gov Info  */}
<div className="space-y-3">
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center">
<span className="material-symbols-outlined text-lg" data-icon="eco">eco</span>
</div>
<span className="text-base font-bold font-headline-sm text-on-surface">SocioSolve Jharkhand</span>
</div>
<p className="text-xs leading-relaxed text-on-surface-variant">
          Unified civic technology and community engagement platform developed in partnership with the Department of Urban Development &amp; Housing, Government of Jharkhand.
        </p>
<div className="pt-1 flex items-center gap-2 text-xs font-mono text-outline">
<span>RNC-CIVIC-V2.4</span>
<span>•</span>
<span className="inline-flex items-center gap-1 text-primary font-semibold">
<span className="w-2 h-2 rounded-full bg-primary"></span> Systems Operational
          </span>
</div>
</div>
{/*  Col 2: Grievance Redressal  */}
<div className="space-y-2.5">
<h5 className="font-headline-sm text-xs font-bold uppercase tracking-wider text-on-surface">Civic Grievance</h5>
<ul className="space-y-2 text-xs">
<li><button type="button" onClick={() => { setActiveTab('All'); setSearchQuery('Water'); showToast("Filtered by Water & Sanitation", "info"); }} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-left text-xs">Water &amp; Sanitation (Jal Jeevan)</button></li>
<li><button type="button" onClick={() => { setActiveTab('All'); setSearchQuery('Road'); showToast("Filtered by Roads & Potholes", "info"); }} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-left text-xs">Road Resurfacing &amp; Potholes</button></li>
<li><button type="button" onClick={() => { setActiveTab('All'); setSearchQuery('Streetlight'); showToast("Filtered by Streetlights", "info"); }} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-left text-xs">Streetlighting &amp; Clean Energy</button></li>
<li><button type="button" onClick={() => { setActiveTab('All'); setSearchQuery('Waste'); showToast("Filtered by Solid Waste & Drainage", "info"); }} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-left text-xs">Solid Waste &amp; Drainage Desiltation</button></li>
<li><button type="button" onClick={() => showComingSoon("Ward Grievance Escalation Chart")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-left text-xs">Ward Grievance Escalation Chart</button></li>
</ul>
</div>
{/*  Col 3: Youth & Academic Solvers  */}
<div className="space-y-2.5">
<h5 className="font-headline-sm text-xs font-bold uppercase tracking-wider text-on-surface">Youth &amp; Academia</h5>
<ul className="space-y-2 text-xs">
<li><button type="button" onClick={() => showComingSoon("Student Solver Fellowship")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-left text-xs">Student Solver Fellowship</button></li>
<li><button type="button" onClick={() => showComingSoon("Engineering Clubs Adoption Portal")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-left text-xs">Engineering Clubs Adoption Portal</button></li>
<li><button type="button" onClick={() => showComingSoon("Civic Data Sandbox")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-left text-xs">Civic Data &amp; Research Sandbox</button></li>
<li><button type="button" onClick={() => showComingSoon("BIT Mesra & RU Innovation Chapter")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-left text-xs">BIT Mesra &amp; RU Innovation Chapter</button></li>
<li><button type="button" onClick={() => showComingSoon("Jharkhand Civic Hackathon")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-left text-xs">Quarterly Jharkhand Civic Hackathon</button></li>
</ul>
</div>
{/*  Col 4: State Helplines  */}
<div className="space-y-3">
<h5 className="font-headline-sm text-xs font-bold uppercase tracking-wider text-on-surface">Emergency &amp; Support</h5>
<p className="text-xs text-on-surface-variant">24/7 dedicated redressal hotlines across 24 districts:</p>
<div className="space-y-1.5 text-xs font-mono">
<div className="p-2 rounded-xl bg-surface-container-lowest whisper-border flex items-center justify-between">
<span className="text-on-surface-variant">Civic Emergency:</span>
<span className="font-bold text-primary">1913</span>
</div>
<div className="p-2 rounded-xl bg-surface-container-lowest whisper-border flex items-center justify-between">
<span className="text-on-surface-variant">Tribal Voice Helpline:</span>
<span className="font-bold text-secondary">1800-JH-VOICE</span>
</div>
</div>
</div>
</div>
{/*  Sub-footer copyright & language  */}
<div className="pt-6 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
<p>© 2025 Government of Jharkhand &amp; SocioSolve Citizens Collective. All rights reserved.</p>
<div className="flex items-center gap-4 text-[11px]">
<button type="button" onClick={() => showComingSoon("Citizen Privacy Policy")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs">Citizen Privacy Policy</button>
<button type="button" onClick={() => showComingSoon("Open Data Portal")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs">Open Data Portal</button>
<button type="button" onClick={() => showComingSoon("Ward Guidelines")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs">Ward Guidelines</button>
<button type="button" onClick={() => showComingSoon("Accessibility Statement")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs">Accessibility (WCAG 2.1)</button>
</div>
</div>
</div>
</footer>
{/*  SELECTED REPORT DETAIL & CITIZEN OUTCOME FEEDBACK MODAL (Point 7, 8, 9)  */}
{selectedReport && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 whisper-border ambient-shadow space-y-5 relative">
            <div className="flex items-start justify-between">
                <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-primary-fixed/40 text-on-primary-fixed-variant">
                        Grievance #{selectedReport.id} • {selectedReport.category}
                    </span>
                    <h3 className="font-headline-sm text-lg font-bold text-on-surface mt-1">
                        {selectedReport.description?.slice(0, 70)}...
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    aria-label="Close modal"
                    className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            {/*  5-Stage Grievance Progress Stepper (Point 9)  */}
            <div className="bg-surface-container-low/70 rounded-2xl p-4 border border-outline-variant/30 space-y-3">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Grievance Lifecycle Progress
                </span>
                {(() => {
                    const stages = [
                        { key: "reported", label: "Reported", desc: "Citizen filed + GPS verified" },
                        { key: "validated", label: "AI Triaged", desc: "Severity & duplicate checked" },
                        { key: "assigned", label: "Assigned", desc: "University lab allocated" },
                        { key: "in_progress", label: "Field Pilot", desc: "Prototype & deployment underway" },
                        { key: "implemented", label: "Implemented", desc: "Ground rollout verified" },
                    ];
                    const order = ["reported", "validated", "assigned", "in_progress", "under_review", "implemented", "resolved"];
                    const currentIdx = order.indexOf(selectedReport.status?.toLowerCase() || "reported");

                    return (
                        <div className="space-y-2.5">
                            {stages.map((stage, idx) => {
                                const stageIdx = order.indexOf(stage.key);
                                const isDone = currentIdx >= stageIdx;
                                const isCurrent = currentIdx === stageIdx || (stage.key === "implemented" && (currentIdx >= 5));
                                return (
                                    <div key={stage.key} className="flex items-start gap-3">
                                        <div className="relative flex flex-col items-center">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                isDone 
                                                    ? 'bg-primary text-on-primary' 
                                                    : 'bg-surface-container-highest text-outline'
                                            }`}>
                                                {isDone ? (
                                                    <span className="material-symbols-outlined text-[14px]">check</span>
                                                ) : (
                                                    idx + 1
                                                )}
                                            </div>
                                            {idx < stages.length - 1 && (
                                                <div className={`w-0.5 h-6 mt-1 ${isDone && currentIdx > stageIdx ? 'bg-primary' : 'bg-surface-container-highest'}`}></div>
                                            )}
                                        </div>
                                        <div className="flex-1 pb-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-bold ${isCurrent ? 'text-primary' : isDone ? 'text-on-surface' : 'text-outline'}`}>
                                                    {stage.label}
                                                </span>
                                                {isCurrent && (
                                                    <span className="px-2 py-0.2 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">Active State</span>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-on-surface-variant block">{stage.desc}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>

            {/*  Report Details Summary  */}
            <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                    <span className="text-on-surface-variant">GPS Coordinates:</span>
                    <span className="font-mono text-on-surface font-medium">{selectedReport.gps_lat?.toFixed(4)}, {selectedReport.gps_lon?.toFixed(4)}</span>
                </div>
                {selectedReport.assigned_department && (
                    <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                        <span className="text-on-surface-variant">Allocated Department:</span>
                        <span className="text-primary font-semibold">{selectedReport.assigned_department}</span>
                    </div>
                )}
                {selectedReport.priority_score && (
                    <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                        <span className="text-on-surface-variant">AI Priority Score:</span>
                        <span className="font-mono font-bold text-amber-600">
                            {selectedReport.priority_score <= 1.0 ? Math.round(selectedReport.priority_score * 100) : Math.round(selectedReport.priority_score)}/100 Priority
                        </span>
                    </div>
                )}
            </div>

            {/*  CITIZEN OUTCOME FEEDBACK SECTION (Point 9)  */}
            <div className="pt-2 border-t border-outline-variant/30">
                {selectedReport.status === "implemented" || selectedReport.status === "resolved" ? (
                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20 space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">reviews</span>
                            <div>
                                <h4 className="font-headline-sm text-sm font-bold text-on-surface">Citizen Outcome Feedback</h4>
                                <p className="text-[11px] text-on-surface-variant">Rate the real-world resolution quality of this grievance</p>
                            </div>
                        </div>

                        {existingFeedback || feedbackSuccess ? (
                            <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-primary/20 space-y-2">
                                <div className="flex items-center gap-1 text-amber-500">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span key={star} className="material-symbols-outlined text-base">
                                            {(existingFeedback?.rating || feedbackRating) >= star ? "star" : "star_border"}
                                        </span>
                                    ))}
                                    <span className="text-xs font-bold text-on-surface ml-2">
                                        {(existingFeedback?.rating || feedbackRating)} / 5 Stars
                                    </span>
                                </div>
                                <p className="text-xs text-on-surface-variant italic">
                                    "{existingFeedback?.comment || feedbackComment || "Issue successfully redressed on ground."}"
                                </p>
                                <span className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold">
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                    Outcome Verified by Citizen
                                </span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-on-surface block mb-1.5">Rating (1 to 5 Stars):</label>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setFeedbackRating(star)}
                                                className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-2xl">
                                                    {feedbackRating >= star ? "star" : "star_border"}
                                                </span>
                                            </button>
                                        ))}
                                        <span className="text-xs font-mono font-bold text-on-surface-variant ml-2">{feedbackRating} Stars</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-on-surface block mb-1">Your Feedback / Resolution Comments:</label>
                                    <textarea
                                        value={feedbackComment}
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                        rows={3}
                                        placeholder="e.g. The water pipeline was repaired within 48 hours and clean drinking water is restored."
                                        className="w-full text-xs p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>

                                <button
                                    type="button"
                                    disabled={submittingFeedback}
                                    onClick={() => handleSubmitFeedback(selectedReport.id)}
                                    className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                    {submittingFeedback ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-sm">send</span>
                                            Submit Outcome Feedback
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-3 rounded-xl bg-surface-container-low text-on-surface-variant text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-secondary">info</span>
                        <span>Outcome feedback opens once the ground implementation is completed and verified.</span>
                    </div>
                )}
            </div>
        </div>
    </div>
)}

        </motion.div>
    );
}
