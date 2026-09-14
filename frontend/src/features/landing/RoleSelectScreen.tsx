// @ts-nocheck
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } },
};

function RoleCard({ icon, label, sublabel, credential, color, textOnColor, bordered, onClick }) {
    return (
        <motion.button
            variants={itemVariants}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${
                bordered
                    ? "bg-surface-container-lowest border border-outline-variant/60 shadow-sm"
                    : `${color} shadow-md`
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
                <p className={`text-xs mt-0.5 ${bordered ? "text-on-surface-variant" : "text-white/70"}`}>{sublabel}</p>
                <div className={`mt-1.5 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    bordered ? "bg-surface-container text-on-surface-variant" : "bg-white/20 text-white"
                }`}>
                    <span className="material-symbols-outlined text-[11px]">
                        {credential.icon}
                    </span>
                    <span>{credential.label}</span>
                </div>
            </div>
            <span className={`material-symbols-outlined ${bordered ? "text-on-surface-variant" : "text-white/80"}`}>chevron_right</span>
        </motion.button>
    );
}

export default function RoleSelectScreen() {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="min-h-screen flex flex-col bg-background"
        >
            {/* Header */}
            <div className="px-6 pt-12 pb-4">
                <button
                    onClick={() => navigate("/")}
                    className="mb-6 w-10 h-10 rounded-full bg-surface-container flex items-center justify-center active:scale-90 transition-transform"
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
                className="flex-1 px-6 pb-6 space-y-6"
            >
                {/* GROUP 1: Grassroots & Academic Innovators */}
                <motion.div variants={itemVariants} className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <div className="h-px flex-1 bg-outline-variant/50" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-outline px-2">
                            Grassroots & Academic Innovators
                        </span>
                        <div className="h-px flex-1 bg-outline-variant/50" />
                    </div>

                    <RoleCard
                        icon="person"
                        label="Citizen"
                        sublabel="Report civic issues, track progress & upvote"
                        credential={{ icon: "phone_android", label: "Mobile + OTP" }}
                        color="bg-primary"
                        textOnColor="text-white"
                        bordered={false}
                        onClick={() => navigate("/login/citizen")}
                    />
                    <RoleCard
                        icon="school"
                        label="Student Innovator"
                        sublabel="Adopt civic capstones & build technical prototypes"
                        credential={{ icon: "badge", label: "APAAR ID + Password" }}
                        color="bg-tertiary"
                        textOnColor="text-white"
                        bordered={false}
                        onClick={() => navigate("/login/student")}
                    />
                    <RoleCard
                        icon="account_balance"
                        label="University & Higher Education"
                        sublabel="Department mentoring, student tracking & rankings"
                        credential={{ icon: "mail", label: "Institutional Email / Gmail" }}
                        color="bg-[#526070]"
                        textOnColor="text-white"
                        bordered={false}
                        onClick={() => navigate("/login/university")}
                    />
                </motion.div>

                {/* GROUP 2: Governance & Impact Investment */}
                <motion.div variants={itemVariants} className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <div className="h-px flex-1 bg-outline-variant/50" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-outline px-2">
                            Governance & Impact Investment
                        </span>
                        <div className="h-px flex-1 bg-outline-variant/50" />
                    </div>

                    <RoleCard
                        icon="assured_workload"
                        label="Government Official"
                        sublabel="Verify complaints, assign departments & implement"
                        credential={{ icon: "key", label: "Gov Employee ID + Password" }}
                        color="bg-secondary"
                        textOnColor="text-white"
                        bordered={false}
                        onClick={() => navigate("/login/official")}
                    />
                    <RoleCard
                        icon="business"
                        label="Industry & CSR Partner"
                        sublabel="Pledge CSR funding & track project impact"
                        credential={{ icon: "corporate_fare", label: "Partner ID + Password" }}
                        color="bg-surface-container-lowest"
                        textOnColor="text-on-surface"
                        bordered={true}
                        onClick={() => navigate("/login/industry")}
                    />
                </motion.div>
            </motion.div>

            <div className="px-6 py-4 text-center">
                <p className="text-xs text-outline">Secured by SocioSolve Grassroots Network · Jharkhand</p>
            </div>
        </motion.div>
    );
}
