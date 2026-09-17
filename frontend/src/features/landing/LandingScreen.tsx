// @ts-nocheck
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function LandingScreen() {
    const [lang, setLang] = useState<"en" | "hi">("en");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    const setPhone = useAuthStore((s) => s.setPhone);

    const t = {
        en: {
            brand: "SocioSolve Jharkhand",
            tagline: "Govt of Jharkhand • Citizen Grievance Redressal",
            heroTitle: "See a civic problem?",
            heroHighlight: "Report it in seconds.",
            heroDesc: "Potholes, broken water pumps, garbage, streetlights — reported by citizens, solved by engineering teams and municipal bodies.",
            ctaReport: "Report an Issue Now",
            ctaReportSub: "Snap photo • Auto GPS • Track live",
            ctaFeed: "Explore Community Feed",
            ctaFeedSub: "See issues resolved near you",
            portalLinks: "Student, Official, or University?",
            choosePortal: "Switch Portal →",
            stats: [
                { label: "Resolved Cases", val: "74%" },
                { label: "Avg Resolution", val: "3.8 Days" },
                { label: "Active Districts", val: "24" }
            ]
        },
        hi: {
            brand: "सोशियोसॉल्व झारखंड",
            tagline: "झारखंड सरकार • नागरिक शिकायत निवारण पोर्टल",
            heroTitle: "शहर में समस्या देखी?",
            heroHighlight: "कुछ ही पलों में रिपोर्ट करें।",
            heroDesc: "सड़क के गड्ढे, टूटे हैंडपंप, कचरा, स्ट्रीटलाइट — नागरिक रिपोर्ट करें, छात्र और नगर निगम समाधान करेंगे।",
            ctaReport: "शिकायत दर्ज करें",
            ctaReportSub: "फोटो लें • जीपीएस लोकेशन • लाइव ट्रैक",
            ctaFeed: "समुदाय फ़ीड देखें",
            ctaFeedSub: "आस-पास सुलझाई गई समस्याएं देखें",
            portalLinks: "छात्र, अधिकारी या विश्वविद्यालय?",
            choosePortal: "पोर्टल चुनें →",
            stats: [
                { label: "समाधान दर", val: "74%" },
                { label: "औसत समय", val: "3.8 दिन" },
                { label: "सक्रिय जिले", val: "24" }
            ]
        }
    }[lang];

    // 1-Click Guest Exploration into Citizen Feed
    const handleExploreFeed = () => {
        try {
            setLoading(true);
            setAuth("citizen", 1);
            setPhone("+919876543210");
            navigate("/dashboard");
        } catch (e) {
            navigate("/login/citizen");
        } finally {
            setLoading(false);
        }
    };

    // 1-Click to Report Issue
    const handleReportDirect = () => {
        try {
            setLoading(true);
            setAuth("citizen", 1);
            setPhone("+919876543210");
            navigate("/report");
        } catch (e) {
            navigate("/login/citizen");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#244530] via-[#1e3b28] to-[#14291c] text-white p-5 sm:p-8"
        >
            {/* Top Navigation & Language Switch */}
            <header className="flex items-center justify-between max-w-md mx-auto w-full pt-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-white text-2xl">eco</span>
                    </div>
                    <div>
                        <span className="font-bold text-base tracking-tight block leading-tight">SocioSolve</span>
                        <span className="text-[10px] text-white/70 uppercase tracking-widest font-mono">Jharkhand</span>
                    </div>
                </div>

                {/* Compact Language Switch */}
                <div className="flex items-center bg-black/25 border border-white/15 rounded-full p-0.5 text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setLang("en")}
                        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                            lang === "en" ? "bg-white text-[#1e3b28] font-bold shadow-xs" : "text-white/80 hover:text-white"
                        }`}
                    >
                        EN
                    </button>
                    <button
                        type="button"
                        onClick={() => setLang("hi")}
                        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                            lang === "hi" ? "bg-white text-[#1e3b28] font-bold shadow-xs" : "text-white/80 hover:text-white"
                        }`}
                    >
                        हिन्दी
                    </button>
                </div>
            </header>

            {/* Central Hero Section */}
            <main className="max-w-md mx-auto w-full py-8 space-y-6">
                <div className="space-y-2 text-center sm:text-left">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 border border-white/15 text-xs font-semibold">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        <span>{t.tagline}</span>
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight pt-2">
                        {t.heroTitle} <br />
                        <span className="text-emerald-300">{t.heroHighlight}</span>
                    </h1>
                    <p className="text-sm text-white/80 leading-relaxed pt-1">
                        {t.heroDesc}
                    </p>
                </div>

                {/* Quick Impact Stats Strip */}
                <div className="grid grid-cols-3 gap-2 bg-black/20 backdrop-blur-md rounded-2xl p-3 border border-white/10 text-center">
                    {t.stats.map((s, idx) => (
                        <div key={idx} className="space-y-0.5">
                            <span className="font-mono font-bold text-lg text-emerald-300 block leading-tight">{s.val}</span>
                            <span className="text-[10px] text-white/70 font-medium block">{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Primary Action Buttons (Thumb-friendly & Clear) */}
                <div className="space-y-3 pt-2">
                    {/* Primary Button: Report Issue */}
                    <button
                        type="button"
                        disabled={loading}
                        onClick={handleReportDirect}
                        className="w-full py-4 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base flex items-center justify-between shadow-lg shadow-emerald-500/25 active:scale-98 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-3 text-left">
                            <div className="w-10 h-10 rounded-xl bg-slate-950/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl text-slate-950">add_a_photo</span>
                            </div>
                            <div>
                                <span className="block text-base font-extrabold leading-tight text-slate-950">{t.ctaReport}</span>
                                <span className="block text-[11px] text-slate-900/80 font-medium">{t.ctaReportSub}</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-2xl text-slate-950 group-hover:translate-x-1 transition-transform">
                            arrow_forward
                        </span>
                    </button>

                    {/* Secondary Button: Explore Feed */}
                    <button
                        type="button"
                        disabled={loading}
                        onClick={handleExploreFeed}
                        className="w-full py-3.5 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm flex items-center justify-between active:scale-98 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-3 text-left">
                            <span className="material-symbols-outlined text-xl text-emerald-300">feed</span>
                            <div>
                                <span className="block font-bold text-sm leading-tight">{t.ctaFeed}</span>
                                <span className="block text-[11px] text-white/65">{t.ctaFeedSub}</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-lg text-white/70 group-hover:translate-x-1 transition-transform">
                            chevron_right
                        </span>
                    </button>
                </div>
            </main>

            {/* Bottom Roles Selector Link */}
            <footer className="max-w-md mx-auto w-full pt-4 pb-2 border-t border-white/10 text-center">
                <div className="flex items-center justify-between text-xs text-white/75">
                    <span>{t.portalLinks}</span>
                    <button
                        type="button"
                        onClick={() => navigate("/select-role")}
                        className="font-bold text-emerald-300 hover:text-white underline underline-offset-4 cursor-pointer transition-colors"
                    >
                        {t.choosePortal}
                    </button>
                </div>
            </footer>
        </motion.div>
    );
}
