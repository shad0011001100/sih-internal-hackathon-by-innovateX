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
    const [showStudentSolversModal, setShowStudentSolversModal] = useState(false);
    const [showHelplineModal, setShowHelplineModal] = useState(false);
    const [showAiScoreInfoModal, setShowAiScoreInfoModal] = useState(false);

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
            avgResolution: "Avg. Resolution",
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
            avgResolution: "औसत समाधान",
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

    const getReportLocationName = (report: any): string => {
        if (report.locality) return report.locality;
        const text = `${report.title || ''} ${report.description || ''} ${report.challenge_summary || ''}`.toLowerCase();
        if (text.includes("morabadi")) return "Morabadi, Ranchi";
        if (text.includes("doranda")) return "Doranda, Ward 4";
        if (text.includes("harmu")) return "Harmu Housing Colony";
        if (text.includes("bariatu")) return "Bariatu, Ranchi";
        if (text.includes("lalpur")) return "Lalpur, Ranchi";
        if (text.includes("kanke")) return "Kanke Road, Ranchi";
        if (text.includes("kishoreganj") || text.includes("sukhdeonagar")) return "Kishoreganj, Ranchi";
        if (text.includes("kokar")) return "Kokar, Ward 3";
        if (text.includes("chutia")) return "Chutia, Ward 6";
        if (text.includes("hinoo")) return "Hinoo, Ward 5";
        if (text.includes("namkum")) return "Namkum Industrial Belt";
        if (text.includes("ratu")) return "Ratu Road, Ranchi";
        if (report.ward) return `Ward ${report.ward}, Ranchi`;
        return "Ranchi Municipal Area";
    };

    const getReportEvidenceImage = (report: any): string => {
        if (report.photo_base64 && report.photo_base64.length > 50) {
            return report.photo_base64;
        }
        if (report.photo_url && report.photo_url !== "dummy" && !report.photo_url.includes("via.placeholder")) {
            return report.photo_url;
        }
        const text = `${report.category || ''} ${report.title || ''} ${report.description || ''}`.toLowerCase();
        if (text.includes("waste") || text.includes("garbage") || text.includes("sanitation") || text.includes("sewer") || text.includes("drain")) {
            return "https://images.unsplash.com/photo-1611288875628-9d4133465b79?w=500&auto=format&fit=crop&q=80";
        }
        if (text.includes("water") || text.includes("turbid") || text.includes("pipeline") || text.includes("pipe") || text.includes("leak")) {
            return "https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?w=500&auto=format&fit=crop&q=80";
        }
        if (text.includes("road") || text.includes("pothole") || text.includes("subsidence") || text.includes("asphalt") || text.includes("transport")) {
            return "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&auto=format&fit=crop&q=80";
        }
        if (text.includes("light") || text.includes("solar") || text.includes("electricity") || text.includes("power") || text.includes("lamp")) {
            return "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80";
        }
        if (text.includes("school") || text.includes("education")) {
            return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&auto=format&fit=crop&q=80";
        }
        if (text.includes("health") || text.includes("hospital") || text.includes("clinic")) {
            return "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=80";
        }
        return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80";
    };

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
<button onClick={() => setShowStudentSolversModal(true)} type="button" className="px-3.5 py-2 rounded-full text-primary-fixed hover:text-on-primary hover:bg-primary-container/30 font-label-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
<span className="material-symbols-outlined text-lg" data-icon="diversity_3">diversity_3</span>
        {t.solvers}
      </button>
<button onClick={() => setShowHelplineModal(true)} type="button" className="px-3.5 py-2 rounded-full text-primary-fixed hover:text-on-primary hover:bg-primary-container/30 font-label-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
<span className="material-symbols-outlined text-lg" data-icon="phone_in_talk">phone_in_talk</span>
        {t.helpline}
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
    className="bg-surface-container-lowest rounded-2xl p-4 whisper-border ambient-shadow flex flex-col justify-between"
>
<div className="flex items-center justify-between">
<span className="text-on-surface-variant font-label-md text-xs">{t.avgResolution}</span>
<div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
<span className="material-symbols-outlined text-base">bolt</span>
</div>
</div>
<div className="flex items-baseline gap-1.5 mt-2">
<span className="text-2xl font-bold font-mono text-on-surface leading-none">3.8</span>
<span className="text-[11px] text-amber-700 font-semibold">{lang === 'HI' ? 'दिन (SLA)' : 'Days (SLA)'}</span>
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
<span className="material-symbols-outlined text-amber-500 text-base" data-icon="bolt">bolt</span>
              Smart Grids Operational
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-outline-variant/30 text-center">
        <div className="bg-surface-container-lowest/90 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-xs border border-outline-variant/20 hover:border-primary/40 transition-all group">
            <div className="w-full h-14 rounded-xl overflow-hidden mb-2 bg-surface-container">
                <img 
                    src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&auto=format&fit=crop&q=80" 
                    alt="Citizen Reporting" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />
            </div>
            <span className="block text-primary font-bold text-xs">1. Report</span>
            <span className="text-[10px] text-on-surface-variant font-medium">Citizen + GPS</span>
        </div>
        <div className="bg-surface-container-lowest/90 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-xs border border-outline-variant/20 hover:border-secondary/40 transition-all group">
            <div className="w-full h-14 rounded-xl overflow-hidden mb-2 bg-surface-container">
                <img 
                    src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&auto=format&fit=crop&q=80" 
                    alt="AI Triage & Scoring" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />
            </div>
            <span className="block text-secondary font-bold text-xs">2. Triage</span>
            <span className="text-[10px] text-on-surface-variant font-medium">AI Scoring</span>
        </div>
        <div className="bg-surface-container-lowest/90 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-xs border border-outline-variant/20 hover:border-amber-500/40 transition-all group">
            <div className="w-full h-14 rounded-xl overflow-hidden mb-2 bg-surface-container">
                <img 
                    src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300&auto=format&fit=crop&q=80" 
                    alt="Faculty & Student Solvers" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />
            </div>
            <span className="block text-amber-600 font-bold text-xs">3. Solve</span>
            <span className="text-[10px] text-on-surface-variant font-medium">Faculty + Team</span>
        </div>
        <div className="bg-surface-container-lowest/90 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-xs border border-outline-variant/20 hover:border-emerald-500/40 transition-all group">
            <div className="w-full h-14 rounded-xl overflow-hidden mb-2 bg-surface-container">
                <img 
                    src="https://images.unsplash.com/photo-1590402494587-44b71d7772f6?w=300&auto=format&fit=crop&q=80" 
                    alt="Govt Ground Impact" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />
            </div>
            <span className="block text-emerald-600 font-bold text-xs">4. Impact</span>
            <span className="text-[10px] text-on-surface-variant font-medium">Govt Rollout</span>
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
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Active Panchayat &amp; Ward Hotspots:</span>
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
        {["All", "Water", "Road", "Sanitation", "Electricity"].map(cat => (
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
    const evidenceImg = getReportEvidenceImage(report);
    const localityName = getReportLocationName(report);

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
            
            {/*  Issue Content & Evidence Thumbnail Row  */}
            <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0 space-y-1.5">
                    <h4 
                        onClick={() => setSelectedReport(report)} 
                        className="text-headline-sm font-headline-sm text-on-surface font-bold text-base sm:text-lg hover:text-primary cursor-pointer transition-colors leading-snug"
                    >
                        {displayTitle}
                    </h4>
                    <p className="text-body-md text-xs sm:text-sm text-on-surface-variant leading-relaxed line-clamp-3">
                        {report.description}
                    </p>
                </div>

                {/* Evidence Photo Thumbnail */}
                <div 
                    onClick={() => setSelectedReport(report)}
                    className="w-24 h-20 sm:w-28 sm:h-24 md:w-32 md:h-24 rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface-container-high relative shrink-0 cursor-pointer shadow-xs hover:ring-2 hover:ring-primary/40 transition-all group"
                    title="Click to view full photo & redressal progress"
                >
                    <img 
                        src={evidenceImg} 
                        alt="Civic evidence" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-1.5">
                        <span className="material-symbols-outlined text-white text-sm">zoom_in</span>
                    </div>
                </div>
            </div>

            {/*  Interactive Bottom Action Row  */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-outline-variant/30">
                <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium">
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm text-outline" data-icon="calendar_today">calendar_today</span>
                        {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                    
                    {/* Clean Location Tag (No raw GPS noise) */}
                    <button 
                        type="button"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (report.gps_lat && report.gps_lon) {
                                window.open(`https://www.google.com/maps/search/?api=1&query=${report.gps_lat},${report.gps_lon}`, '_blank');
                            } else {
                                showToast(`Locality: ${localityName}`, "info");
                            }
                        }}
                        className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs font-medium"
                        title={report.gps_lat ? `GPS: ${Number(report.gps_lat).toFixed(4)}°, ${Number(report.gps_lon).toFixed(4)}° • Click to view on Google Maps` : 'View locality'}
                    >
                        <span className="material-symbols-outlined text-[15px] text-primary" data-icon="location_on">location_on</span>
                        <span>{localityName}</span>
                        <span className="material-symbols-outlined text-[12px] opacity-60">open_in_new</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/*  Interactive Endorsement / Support Button or Resolved State  */}
                    {['resolved', 'implemented'].includes(report.status) ? (
                        <span 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                            title="Issue resolved on ground"
                        >
                            <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                            <span>{report.status === 'implemented' ? 'Implemented' : 'Resolved'}</span>
                            <span className="text-[11px] text-emerald-800 font-bold ml-0.5">• ▲ {currentUpvotes} Supports</span>
                        </span>
                    ) : (
                        <button 
                            type="button"
                            onClick={(e) => handleUpvote(reportId, e)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                                hasUpvoted 
                                    ? 'bg-primary text-on-primary shadow-xs' 
                                    : 'bg-surface-container hover:bg-primary/10 text-on-surface hover:text-primary'
                            }`}
                            title="Citizen Endorsement: Boost municipal priority score"
                        >
                            <span className="material-symbols-outlined text-base font-bold leading-none" data-icon="arrow_drop_up">arrow_drop_up</span>
                            <span>{currentUpvotes}</span>
                            <span className="text-[11px] font-medium opacity-90">
                                {lang === 'HI' ? (hasUpvoted ? 'समर्थित' : 'समर्थन') : (hasUpvoted ? 'Supported' : 'Supports')}
                            </span>
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
<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error"></span> High Activity</span>
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
<div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-7 h-7 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs font-mono shrink-0">BM</span>
        <div className="min-w-0">
            <p className="text-xs font-bold text-on-surface truncate">BIT Mesra • Team AquaTech</p>
            <p className="text-[10px] text-primary font-medium truncate">IoT Handpump Flow &amp; Telemetry</p>
        </div>
    </div>
    <img 
        src="https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=160&auto=format&fit=crop&q=80" 
        alt="Team AquaTech" 
        className="w-14 h-10 rounded-lg object-cover shadow-xs border border-outline-variant/30 shrink-0" 
        loading="lazy"
    />
</div>
<div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-on-surface-variant">
    <span>Ward 4 Adoption</span>
    <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Prototype Deployed</span>
</div>
</li>

<li className="p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-7 h-7 rounded-xl bg-surface-container-highest text-on-surface flex items-center justify-center font-bold text-xs font-mono shrink-0">RU</span>
        <div className="min-w-0">
            <p className="text-xs font-bold text-on-surface truncate">Ranchi Univ • GreenCity</p>
            <p className="text-[10px] text-primary font-medium truncate">Drainage Desiltation AI Route</p>
        </div>
    </div>
    <img 
        src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=160&auto=format&fit=crop&q=80" 
        alt="GreenCity Lab" 
        className="w-14 h-10 rounded-lg object-cover shadow-xs border border-outline-variant/30 shrink-0" 
        loading="lazy"
    />
</div>
<div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-on-surface-variant">
    <span>Ward 2 &amp; 3 Audits</span>
    <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">In Testing</span>
</div>
</li>

<li className="p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors">
<div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-7 h-7 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-xs font-mono shrink-0">IIM</span>
        <div className="min-w-0">
            <p className="text-xs font-bold text-on-surface truncate">IIM Ranchi • Civic Lab</p>
            <p className="text-[10px] text-primary font-medium truncate">Municipal SLA Bottleneck Audits</p>
        </div>
    </div>
    <img 
        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=160&auto=format&fit=crop&q=80" 
        alt="Civic Lab Team" 
        className="w-14 h-10 rounded-lg object-cover shadow-xs border border-outline-variant/30 shrink-0" 
        loading="lazy"
    />
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


{/*  Floating Action Button (FAB) for Reporting Civic Issues (Mobile Only)  */}
<aside className="lg:hidden fixed bottom-20 right-5 z-40">
<button onClick={() => navigate('/report')} aria-label="Report new civic issue" className="w-14 h-14 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center elevated-fab-shadow active:scale-90 transition-transform focus:outline-none focus:ring-4 focus:ring-secondary-container/40 cursor-pointer" type="button">
<span className="material-symbols-outlined text-[32px] select-none pointer-events-none" data-icon="add">add</span>
</button>
</aside>

{/*  BottomNavBar (Mobile Only)  */}
<nav aria-label="Primary Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2 bg-surface-container-low/95 backdrop-blur-md shadow-sm border-t border-outline-variant/30">
<button 
    onClick={() => { setActiveTab("All"); setSelectedWard(null); setSelectedCategory("All"); setSearchQuery(""); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
    aria-current={activeTab === "All" && !selectedWard ? "page" : undefined} 
    aria-label="Feed" 
    className={`flex flex-col items-center justify-center min-h-[44px] min-w-[54px] rounded-xl px-2 py-1 active:scale-90 transition-transform duration-150 cursor-pointer ${activeTab === 'All' && !selectedWard ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:text-primary'}`} 
    type="button"
>
    <span className="material-symbols-outlined text-[20px]" data-icon="feed">feed</span>
    <span className="text-[10px] mt-0.5">Feed</span>
</button>

<button 
    onClick={() => setShowStudentSolversModal(true)} 
    aria-label="Student Solvers" 
    className="flex flex-col items-center justify-center min-h-[44px] min-w-[54px] text-on-surface-variant px-2 py-1 hover:text-primary active:scale-90 transition-transform duration-150 cursor-pointer" 
    type="button"
>
    <span className="material-symbols-outlined text-[20px]" data-icon="diversity_3">diversity_3</span>
    <span className="text-[10px] mt-0.5">Solvers</span>
</button>

<button 
    onClick={() => setShowHelplineModal(true)} 
    aria-label="Helpline" 
    className="flex flex-col items-center justify-center min-h-[44px] min-w-[54px] text-on-surface-variant px-2 py-1 hover:text-primary active:scale-90 transition-transform duration-150 cursor-pointer" 
    type="button"
>
    <span className="material-symbols-outlined text-[20px]" data-icon="phone_in_talk">phone_in_talk</span>
    <span className="text-[10px] mt-0.5">{t.helpline}</span>
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
<li><button type="button" onClick={() => { setActiveTab('All'); setSearchQuery('Electricity'); showToast("Filtered by Clean Energy", "info"); }} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-left text-xs">Clean Energy &amp; Power Grid</button></li>
<li><button type="button" onClick={() => { setActiveTab('All'); setSearchQuery('Waste'); showToast("Filtered by Solid Waste & Drainage", "info"); }} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-left text-xs">Solid Waste &amp; Drainage Desiltation</button></li>
<li><button type="button" onClick={() => setShowHelplineModal(true)} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-left text-xs">Ward Grievance Escalation &amp; Helplines</button></li>
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

            {/* Evidence Photo Preview */}
            <div className="rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface-container-high relative max-h-56 shadow-xs">
                <img 
                    src={getReportEvidenceImage(selectedReport)} 
                    alt="Grievance Evidence" 
                    className="w-full h-48 sm:h-56 object-cover" 
                />
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
                <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/20">
                    <span className="text-on-surface-variant">Location:</span>
                    <div className="flex items-center gap-1.5">
                        <span className="font-medium text-on-surface flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                            {getReportLocationName(selectedReport)}
                        </span>
                        {selectedReport.gps_lat && selectedReport.gps_lon && (
                            <button
                                type="button"
                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedReport.gps_lat},${selectedReport.gps_lon}`, '_blank')}
                                className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer ml-1"
                                title={`GPS: ${selectedReport.gps_lat?.toFixed(4)}°, ${selectedReport.gps_lon?.toFixed(4)}° • Open in Google Maps`}
                            >
                                <span>View on Map</span>
                                <span className="material-symbols-outlined text-xs">open_in_new</span>
                            </button>
                        )}
                    </div>
                </div>
                {selectedReport.assigned_department && (
                    <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                        <span className="text-on-surface-variant">Allocated Department:</span>
                        <span className="text-primary font-semibold">{selectedReport.assigned_department}</span>
                    </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
                    <div className="flex items-center gap-1.5">
                        <span className="text-on-surface-variant">Operational Urgency:</span>
                        <button
                            type="button"
                            onClick={() => setShowAiScoreInfoModal(true)}
                            className="text-primary hover:text-primary-dark transition-colors inline-flex items-center cursor-pointer"
                            title="How is urgency calculated?"
                        >
                            <span className="material-symbols-outlined text-[16px]">info</span>
                        </button>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        (selectedReport.priority_score > 85 || selectedReport.urgency === "Urgent Attention")
                            ? "bg-error/15 text-error"
                            : (selectedReport.priority_score > 70 || selectedReport.urgency === "Standard Priority")
                            ? "bg-amber-500/15 text-amber-700"
                            : "bg-primary/15 text-primary"
                    }`}>
                        <span className="material-symbols-outlined text-[14px]">
                            {(selectedReport.priority_score > 85 || selectedReport.urgency === "Urgent Attention") ? "warning" : "schedule"}
                        </span>
                        {selectedReport.urgency || ((selectedReport.priority_score > 85) ? "Urgent Attention" : (selectedReport.priority_score > 70) ? "Standard Priority" : "Routine")}
                    </span>
                </div>
                {selectedReport.provider_deadline && (
                    <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                        <span className="text-on-surface-variant">Provider Target Deadline:</span>
                        <span className="font-semibold text-on-surface flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-primary">event</span>
                            {selectedReport.target_resolution_date || selectedReport.provider_deadline}
                            {selectedReport.provider_name && <span className="text-[11px] text-on-surface-variant font-normal">({selectedReport.provider_name})</span>}
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

{/*  STUDENT SOLVERS MODAL  */}
{showStudentSolversModal && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 whisper-border ambient-shadow space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-tertiary/15 flex items-center justify-center text-tertiary">
                        <span className="material-symbols-outlined text-2xl">school</span>
                    </div>
                    <div>
                        <h3 className="font-headline-sm text-base font-bold text-on-surface">Student Solvers</h3>
                        <p className="text-xs text-on-surface-variant">Collegiate teams building technical prototypes for Ranchi</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setShowStudentSolversModal(false)}
                    className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-on-surface">BIT Mesra AquaTech Node</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Field Pilot</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">IoT Sub-Surface Water Contamination Telemetry in Doranda (Ward 14).</p>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-on-surface-variant border-t border-outline-variant/20">
                        <span>Lead: <strong>Aravind Kumar</strong> (3rd Yr CSE)</span>
                        <span className="text-primary font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">biotech</span>
                            <span>Live Prototype</span>
                        </span>
                    </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-on-surface">BIT Mesra Transport Systems</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-[10px] font-bold">Model Validated</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">Computer Vision Pothole &amp; Pavement Roughness Scanner for Ratu Road corridor.</p>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-on-surface-variant border-t border-outline-variant/20">
                        <span>Lead: <strong>Priya Sharma</strong> (Civil Engg)</span>
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">smart_toy</span>
                            <span>Project Demo Ready</span>
                        </span>
                    </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-on-surface">NIT Jamshedpur CleanGrid</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-bold">CSR Funded</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">Decentralized Plastic Pyrolysis Micro-Unit with Tata Steel Foundation support.</p>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-on-surface-variant border-t border-outline-variant/20">
                        <span>Lead: <strong>Rahul Sen</strong> (Env Science)</span>
                        <span className="text-emerald-700 font-semibold font-mono">₹5,00,000 Grant</span>
                    </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-on-surface">Ranchi University Tribal Tech</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">Prototyping</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">Low-cost solar water disinfection &amp; filtration for rural Anganwadis.</p>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-on-surface-variant border-t border-outline-variant/20">
                        <span>Lead: <strong>Anita Toppo</strong> (Rural Dev)</span>
                        <span className="text-primary font-semibold">4 Credits Earned</span>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={() => { setShowStudentSolversModal(false); navigate('/login/student'); }}
                className="w-full py-2.5 rounded-xl bg-tertiary text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 transition-all cursor-pointer shadow-xs"
            >
                <span className="material-symbols-outlined text-sm">badge</span>
                <span>Are you a student? Access Innovation Hub</span>
            </button>
        </div>
    </div>
)}

{/*  24x7 HELPLINE MODAL  */}
{showHelplineModal && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 whisper-border ambient-shadow space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-secondary/15 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-2xl">support_agent</span>
                    </div>
                    <div>
                        <h3 className="font-headline-sm text-base font-bold text-on-surface">24x7 Civic Helplines</h3>
                        <p className="text-xs text-on-surface-variant">Direct toll-free numbers &amp; emergency escalation channels</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setShowHelplineModal(false)}
                    className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                    href="tel:1913"
                    className="p-3.5 rounded-2xl bg-primary/10 border border-primary/25 flex flex-col gap-1 hover:bg-primary/15 transition-all group"
                >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">call</span>
                        Ranchi Municipal Toll-Free
                    </span>
                    <span className="text-lg font-bold font-mono text-on-surface group-hover:text-primary">1913</span>
                    <span className="text-[10px] text-on-surface-variant">24x7 Grievance Desk</span>
                </a>

                <a
                    href="tel:112"
                    className="p-3.5 rounded-2xl bg-error/10 border border-error/25 flex flex-col gap-1 hover:bg-error/15 transition-all group"
                >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-error flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">emergency</span>
                        Emergency First Response
                    </span>
                    <span className="text-lg font-bold font-mono text-on-surface group-hover:text-error">112</span>
                    <span className="text-[10px] text-on-surface-variant">Police / Fire / Medical</span>
                </a>

                <a
                    href="tel:18003456524"
                    className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1 hover:bg-surface-container transition-all group"
                >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">water_drop</span>
                        PHED Water Supply
                    </span>
                    <span className="text-sm font-bold font-mono text-on-surface group-hover:text-primary">1800-345-6524</span>
                    <span className="text-[10px] text-on-surface-variant">Pipeline &amp; Contamination</span>
                </a>

                <a
                    href="tel:1912"
                    className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1 hover:bg-surface-container transition-all group"
                >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">bolt</span>
                        JBVNL Electricity Desk
                    </span>
                    <span className="text-lg font-bold font-mono text-on-surface group-hover:text-primary">1912</span>
                    <span className="text-[10px] text-on-surface-variant">Power Outage &amp; Live Wires</span>
                </a>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-emerald-600 text-2xl">chat</span>
                    <div>
                        <span className="text-xs font-bold text-emerald-900 block">SocioSolve WhatsApp Civic Bot</span>
                        <span className="text-[11px] text-emerald-700">Send photo + location for instant AI grievance logging</span>
                    </div>
                </div>
                <a
                    href="https://wa.me/919431101913?text=Johar%2C%20I%20want%20to%20report%20a%20civic%20issue"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1"
                >
                    <span>Chat</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
            </div>

            <div className="text-[11px] text-on-surface-variant text-center pt-1">
                Headquarters: Ranchi Municipal Corporation, Kutchery Chowk, Ranchi - 834001
            </div>
        </div>
    </div>
)}

{/*  HOW OPERATIONAL URGENCY IS CALCULATED MODAL  */}
{showAiScoreInfoModal && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 whisper-border ambient-shadow space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">psychology</span>
                    </div>
                    <div>
                        <h3 className="font-headline-sm text-base font-bold text-on-surface">Operational Urgency Logic</h3>
                        <p className="text-xs text-on-surface-variant">How SocioSolve calculates grievance priority</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setShowAiScoreInfoModal(false)}
                    className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
                Rather than an arbitrary number, urgency is determined by a transparent 4-pillar evaluation model designed to eliminate bureaucratic delay:
            </p>

            <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex gap-3">
                    <span className="material-symbols-outlined text-error text-xl shrink-0 mt-0.5">warning</span>
                    <div>
                        <h4 className="text-xs font-bold text-on-surface">1. Immediate Threat to Public Safety</h4>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                            Exposed 11kV wires, contaminated tap water, or active road subsidence are immediately classified as <strong>Urgent Attention</strong> for immediate dispatch.
                        </p>
                    </div>
                </div>

                <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex gap-3">
                    <span className="material-symbols-outlined text-blue-600 text-xl shrink-0 mt-0.5">domain</span>
                    <div>
                        <h4 className="text-xs font-bold text-on-surface">2. Domain Criticality</h4>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                            Potable water, sewage overflows, and vector breeding are weighted higher than aesthetic road paint or signboards.
                        </p>
                    </div>
                </div>

                <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex gap-3">
                    <span className="material-symbols-outlined text-secondary text-xl shrink-0 mt-0.5">groups</span>
                    <div>
                        <h4 className="text-xs font-bold text-on-surface">3. Population Density Impact</h4>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                            Incidents near healthcare centers, hospitals, primary schools, and dense transit corridors (e.g. Bariatu, Doranda) receive priority escalation.
                        </p>
                    </div>
                </div>

                <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex gap-3">
                    <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">thumb_up</span>
                    <div>
                        <h4 className="text-xs font-bold text-on-surface">4. Community Upvote Escalation</h4>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                            When multiple residents upvote an unresolved grievance, the system flags it directly onto the Municipal Commissioner's morning triage dashboard.
                        </p>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={() => setShowAiScoreInfoModal(false)}
                className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
            >
                <span>Understood</span>
            </button>
        </div>
    </div>
)}

        </motion.div>
    );
}
