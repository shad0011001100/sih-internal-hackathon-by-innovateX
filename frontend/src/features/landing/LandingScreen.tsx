// @ts-nocheck
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function LandingScreen() {
    const [lang, setLang] = useState<"en" | "hi">("en");
    const navigate = useNavigate();

    const text = {
        en: {
            tagline: "Solutions for Jharkhand",
            whatLabel: "WHAT DO WE DO?",
            what: "We solve societal challenges faced by Jharkhand people — where a student works on it to find solutions under a university or industry.",
            chooseLang: "CHOOSE LANGUAGE",
            english: "English",
            hindi: "हिन्दी",
            cta: "Get Started",
            sub: "Building a better Jharkhand together",
        },
        hi: {
            tagline: "झारखंड के समाधान",
            whatLabel: "हम क्या करते हैं?",
            what: "हम झारखंड के लोगों की सामाजिक चुनौतियों को हल करते हैं — जहाँ एक छात्र विश्वविद्यालय या उद्योग के तहत समाधान खोजने पर काम करता है।",
            chooseLang: "भाषा चुनें",
            english: "English",
            hindi: "हिन्दी",
            cta: "शुरू करें",
            sub: "मिलकर एक बेहतर झारखंड बनाएं",
        },
    };

    const t = text[lang];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="min-h-screen flex flex-col"
            style={{
                background: "linear-gradient(160deg, #4a7a57 0%, #3e644a 40%, #2d4f38 100%)"
            }}
        >
            {/* Main Content */}
            <div className="flex-1 flex flex-col px-6 pt-14 pb-6">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 260 }}
                    className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-6"
                >
                    <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                </motion.div>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 260 }}
                >
                    <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">SocioSolve</h1>
                    <p className="text-white/70 mt-1 text-base font-medium">{t.tagline}</p>
                </motion.div>

                {/* What we do card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, type: "spring", stiffness: 260 }}
                    className="mt-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-5"
                >
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">{t.whatLabel}</p>
                    <p className="text-white text-sm leading-relaxed">{t.what}</p>
                </motion.div>

                {/* Language Chooser */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, type: "spring", stiffness: 260 }}
                    className="mt-8"
                >
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-3">{t.chooseLang}</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setLang("en")}
                            className={`flex items-center justify-center space-x-2 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
                                lang === "en"
                                    ? "bg-secondary text-white shadow-lg shadow-secondary/30"
                                    : "bg-white/10 text-white border border-white/20"
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">language</span>
                            <span>{t.english}</span>
                        </button>
                        <button
                            onClick={() => setLang("hi")}
                            className={`flex items-center justify-center space-x-2 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
                                lang === "hi"
                                    ? "bg-secondary text-white shadow-lg shadow-secondary/30"
                                    : "bg-white/10 text-white border border-white/20"
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">language</span>
                            <span>{t.hindi}</span>
                        </button>
                    </div>
                </motion.div>

                <div className="flex-1" />

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, type: "spring", stiffness: 260 }}
                    className="mt-6 space-y-3"
                >
                    <button
                        onClick={() => navigate("/select-role")}
                        className="w-full py-4 rounded-2xl bg-secondary text-white text-base font-bold flex items-center justify-center space-x-2 shadow-xl shadow-secondary/30 active:scale-95 transition-transform"
                    >
                        <span>{t.cta}</span>
                        <span className="material-symbols-outlined text-xl">chevron_right</span>
                    </button>
                    <p className="text-center text-white/40 text-xs">{t.sub}</p>
                </motion.div>
            </div>
        </motion.div>
    );
}
