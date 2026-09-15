// @ts-nocheck
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } },
};

function RoleCard({ icon, label, credential, color, textOnColor, bordered, onClick }) {
    return (
        <motion.button
            variants={itemVariants}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all cursor-pointer ${
                bordered
                    ? "bg-surface-container-lowest border border-outline-variant/60 shadow-sm hover:border-primary/40"
                    : `${color} shadow-md hover:brightness-105`
            }`}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                bordered ? "bg-surface-container" : "bg-white/20"
            }`}>
                <span
                    className={`material-symbols-outlined text-2xl ${bordered ? "text-on-surface" : textOnColor}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                >
                    {icon}
                </span>
            </div>
            <div className="flex-1 text-left">
                <p className={`font-bold text-base leading-tight ${bordered ? "text-on-surface" : textOnColor}`}>{label}</p>
                {credential && (
                    <div className={`mt-1 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        bordered ? "bg-surface-container text-on-surface-variant" : "bg-white/20 text-white"
                    }`}>
                        <span className="material-symbols-outlined text-[11px]">
                            {credential.icon}
                        </span>
                        <span>{credential.label}</span>
                    </div>
                )}
            </div>
            <span className={`material-symbols-outlined ${bordered ? "text-on-surface-variant" : "text-white/80"}`}>chevron_right</span>
        </motion.button>
    );
}

export default function RoleSelectScreen() {
    const navigate = useNavigate();
    const [showMore, setShowMore] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="min-h-screen flex flex-col bg-background max-w-lg mx-auto"
        >
            {/* Header */}
            <div className="px-6 pt-12 pb-4">
                <button
                    onClick={() => navigate("/")}
                    className="mb-6 w-10 h-10 rounded-full bg-surface-container flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                >
                    <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
                </button>
                <h1 className="text-2xl font-bold text-on-surface tracking-tight">Who are you?</h1>
                <p className="text-sm text-on-surface-variant mt-1">Choose your portal to continue</p>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex-1 px-6 pb-6 space-y-4"
            >
                {/* Primary Portals */}
                <RoleCard
                    icon="person"
                    label="Citizen"
                    credential={{ icon: "phone_android", label: "Mobile + OTP" }}
                    color="bg-primary"
                    textOnColor="text-white"
                    bordered={false}
                    onClick={() => navigate("/login/citizen")}
                />
                <RoleCard
                    icon="school"
                    label="Student Innovator"
                    credential={{ icon: "badge", label: "APAAR ID + Password" }}
                    color="bg-tertiary"
                    textOnColor="text-white"
                    bordered={false}
                    onClick={() => navigate("/login/student")}
                />

                {/* Expandable Dropdown for Institutional & Official Portals */}
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={() => setShowMore(!showMore)}
                        className="w-full flex items-center justify-between py-3 px-4 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-2 text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm">tune</span>
                            <span>See More Options (Institutional Portals)</span>
                        </div>
                        <span className={`material-symbols-outlined text-base transition-transform duration-200 ${showMore ? "rotate-180" : ""}`}>
                            expand_more
                        </span>
                    </button>

                    <AnimatePresence>
                        {showMore && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-3 overflow-hidden"
                            >
                                <RoleCard
                                    icon="assured_workload"
                                    label="Government Official"
                                    credential={{ icon: "key", label: "Gov Employee ID + Password" }}
                                    color="bg-secondary"
                                    textOnColor="text-white"
                                    bordered={false}
                                    onClick={() => navigate("/login/official")}
                                />
                                <RoleCard
                                    icon="account_balance"
                                    label="University & Higher Education"
                                    credential={{ icon: "mail", label: "Institutional Email" }}
                                    color="bg-[#526070]"
                                    textOnColor="text-white"
                                    bordered={false}
                                    onClick={() => navigate("/login/university")}
                                />
                                <RoleCard
                                    icon="business"
                                    label="Industry & CSR Partner"
                                    credential={{ icon: "corporate_fare", label: "Partner ID + Password" }}
                                    color="bg-surface-container-lowest"
                                    textOnColor="text-on-surface"
                                    bordered={true}
                                    onClick={() => navigate("/login/industry")}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <div className="px-6 py-4 text-center">
                <p className="text-xs text-outline">Secured by SocioSolve Grassroots Network · Jharkhand</p>
            </div>
        </motion.div>
    );
}
