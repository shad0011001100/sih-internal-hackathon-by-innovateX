// @ts-nocheck
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../context/ToastContext";
import { safeFetch } from "../../services/api";

// Per-role configuration
const roleConfig = {
    citizen: {
        icon: "person",
        label: "Citizen Portal",
        sublabel: "Report civic issues anonymously",
        color: "bg-primary",
        loginType: "phone_otp",
        fields: [
            {
                id: "phone",
                label: "Mobile Number",
                prefix: "+91",
                placeholder: "10-digit mobile number",
                inputMode: "numeric",
                maxLength: 10,
                icon: "phone_android",
            }
        ],
        hint: "A 6-digit OTP will be sent to verify your identity.",
        ctaLabel: "Send OTP",
    },
    student: {
        icon: "school",
        label: "Student Innovator Portal",
        sublabel: "Login with APAAR Student ID",
        color: "bg-tertiary",
        loginType: "apaar_id",
        fields: [
            {
                id: "apaar_id",
                label: "APAAR Student ID",
                placeholder: "Enter your APAAR Student ID (e.g. APAAR-12345)",
                type: "text",
                icon: "badge",
            },
            {
                id: "student_password",
                label: "Student Password",
                placeholder: "Enter your secure password",
                type: "password",
                icon: "lock",
            }
        ],
        hint: "Enter your APAAR Student ID and password to access the Innovation Hub.",
        ctaLabel: "Login with APAAR ID",
    },
    official: {
        icon: "account_balance",
        label: "Government Official Portal",
        sublabel: "Secure Government Access",
        color: "bg-secondary",
        loginType: "gov_id",
        fields: [
            {
                id: "gov_id",
                label: "Government Employee ID",
                prefix: "GOV-",
                placeholder: "Your unique employee ID",
                inputMode: "text",
                maxLength: 20,
                icon: "badge",
            },
            {
                id: "password",
                label: "Access Password",
                prefix: null,
                placeholder: "Secure portal password",
                inputMode: "text",
                maxLength: 64,
                icon: "lock",
                type: "password",
            }
        ],
        hint: "Use your government-issued employee ID and password.",
        ctaLabel: "Access Portal",
    },
    industry: {
        icon: "business",
        label: "Industry Partner Portal",
        sublabel: "Corporate & Industry Access",
        color: "bg-on-surface",
        loginType: "partner_id",
        fields: [
            {
                id: "partner_id",
                label: "Partner Organisation ID",
                prefix: "IND-",
                placeholder: "Your unique partner code",
                inputMode: "text",
                maxLength: 20,
                icon: "corporate_fare",
            },
            {
                id: "password",
                label: "Access Password",
                prefix: null,
                placeholder: "Secure portal password",
                inputMode: "text",
                maxLength: 64,
                icon: "lock",
                type: "password",
            }
        ],
        hint: "Use your SocioSolve-issued Industry Partner ID and password.",
        ctaLabel: "Access Partner Portal",
    },
    university: {
        icon: "account_balance",
        label: "University & Academia Portal",
        sublabel: "Academic Innovation & Mentorship",
        color: "bg-[#526070]",
        loginType: "university_direct",
        fields: [
            {
                id: "uni_email",
                label: "Institutional Email / Gmail",
                prefix: null,
                placeholder: "admin@bitmesra.ac.in",
                inputMode: "email",
                maxLength: 100,
                icon: "mail",
            },
            {
                id: "uni_password",
                label: "Access Password",
                prefix: null,
                placeholder: "Portal password (sanjha@2025)",
                inputMode: "text",
                maxLength: 64,
                icon: "lock",
                type: "password",
            }
        ],
        hint: "Use your verified institutional email to access department telemetry.",
        ctaLabel: "Access University Portal",
    },
};

// Role → dashboard redirect mapping
const ROLE_DASHBOARD = {
    citizen: "/dashboard",
    student: "/student-dashboard",
    university: "/university-dashboard",
    official: "/official-dashboard",
    verifier: "/official-dashboard",
    industry: "/industry-dashboard",
    admin: "/official-dashboard",
};

export default function RoleLoginScreen() {
    const navigate = useNavigate();
    const { role } = useParams();
    const cfg = roleConfig[role] || roleConfig.citizen;
    const setAuth = useAuthStore((s) => s.setAuth);
    const setPhone = useAuthStore((s) => s.setPhone);
    const { showToast } = useToast();

    const [values, setValues] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);


    const handleOtpChange = (index, value) => {
        if (!/^[0-9]*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value !== "" && index < 5) {
            document.getElementById(`otp-box-${index + 1}`)?.focus();
        }
    };
    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            document.getElementById(`otp-box-${index - 1}`)?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            if (cfg.loginType === "phone_otp") {
                const phone = values["phone"] || "";
                if (phone.length !== 10) throw new Error("Please enter a valid 10-digit number");

                if (!otpSent) {
                    try {
                        setLoading(true);
                        const data = await safeFetch("/api/auth/send-otp", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ phone_number: "+91" + phone }),
                        });
                        setPhone("+91" + phone);
                        setOtpSent(true);
                        showToast("OTP sent to +91 " + phone + " (Demo: 123456)", "info");
                    } catch (err) {
                        setError(err.message);
                        showToast(err.message, "error");
                    } finally {
                        setLoading(false);
                    }
                } else {
                    try {
                        setLoading(true);
                        const code = otp.join("");
                        if (code.length !== 6) throw new Error("Please enter all 6 digits");
                        const data = await safeFetch("/api/auth/verify-otp", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ phone_number: "+91" + phone, otp: code }),
                        });
                        setAuth(data.role || "citizen", data.user_id || 1);
                        setPhone("+91" + phone);
                        showToast("Verification successful! Redirecting...", "success");
                        navigate(ROLE_DASHBOARD[data.role] || "/dashboard");
                    } catch (err) {
                        setError(err.message);
                        showToast(err.message, "error");
                    } finally {
                        setLoading(false);
                    }
                }

            } else if (cfg.loginType === "apaar_id") {
                // Student login with APAAR ID & Password
                try {
                    setLoading(true);
                    const apaarId = values["apaar_id"]?.trim();
                    const password = values["student_password"]?.trim();
                    if (!apaarId) throw new Error("Please enter your APAAR ID");
                    if (!password) throw new Error("Please enter your portal password");
                    const data = await safeFetch("/api/auth/student/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ apaar_id: apaarId, password: password }),
                    });
                    setAuth(data.role || "student", data.user_id || 2);
                    showToast("Student login successful!", "success");
                    navigate(ROLE_DASHBOARD[data.role] || "/student-dashboard");
                } catch (err: any) {
                    setError(err.message);
                    showToast(err.message, "error");
                } finally {
                    setLoading(false);
                }

            } else if (cfg.loginType === "gov_id") {
                try {
                    setLoading(true);
                    const data = await safeFetch("/api/auth/official/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ employee_id: values["gov_id"], password: values["password"] }),
                    });
                    setAuth(data.role || "official", data.user_id || 4);
                    showToast("Official access granted.", "success");
                    navigate(ROLE_DASHBOARD[data.role] || "/official-dashboard");
                } catch (err) {
                    setError(err.message);
                    showToast(err.message, "error");
                } finally {
                    setLoading(false);
                }

            } else if (cfg.loginType === "partner_id") {
                try {
                    setLoading(true);
                    const data = await safeFetch("/api/auth/industry/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ partner_id: values["partner_id"], password: values["password"] }),
                    });
                    setAuth(data.role || "industry", data.user_id || 5);
                    showToast("Partner portal access granted.", "success");
                    navigate(ROLE_DASHBOARD[data.role] || "/industry-dashboard");
                } catch (err) {
                    setError(err.message);
                    showToast(err.message, "error");
                } finally {
                    setLoading(false);
                }
            } else if (cfg.loginType === "university_direct") {
                try {
                    setLoading(true);
                    const email = (values["uni_email"] || "").trim();
                    const password = values["uni_password"] || "";
                    if (!email) throw new Error("Please enter your institutional email");
                    if (!password) throw new Error("Please enter a password");
                    const data = await safeFetch("/api/auth/university/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, password }),
                    });
                    setAuth(data.role || "university", data.user_id || 3);
                    showToast("Institutional login successful!", "success");
                    navigate(ROLE_DASHBOARD[data.role] || "/university-dashboard");
                } catch (err) {
                    setError(err.message);
                    showToast(err.message, "error");
                } finally {
                    setLoading(false);
                }
            }
        } catch (err) {
            setError(err.message);
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickDemo = async () => {
        setError(null);
        setLoading(true);
        try {
            if (role === "citizen") {
                setValues({ phone: "9876543210" });
                const data = await safeFetch("/api/auth/verify-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phone_number: "+919876543210", otp: "123456" }),
                });
                setAuth(data.role || "citizen", data.user_id || 1);
                setPhone("+919876543210");
                showToast("Demo Citizen verified! Entering dashboard...", "success");
                navigate("/dashboard");
            } else if (role === "student") {
                setValues({ apaar_id: "APAAR-12345", student_password: "mypassword123" });
                const data = await safeFetch("/api/auth/student/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ apaar_id: "APAAR-12345", password: "mypassword123" }),
                });
                setAuth(data.role || "student", data.user_id || 2);
                showToast("Demo Student logged in! Entering Innovation Hub...", "success");
                navigate("/student-dashboard");
            } else if (role === "university") {
                setValues({ uni_email: "admin@bitmesra.ac.in", uni_password: "sanjha@2025" });
                const data = await safeFetch("/api/auth/university/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: "admin@bitmesra.ac.in", password: "sanjha@2025" }),
                });
                setAuth(data.role || "university", data.user_id || 3);
                showToast("Demo University (BIT Mesra) logged in! Entering Academic Portal...", "success");
                navigate("/university-dashboard");
            } else if (role === "official") {
                setValues({ gov_id: "GOV-001", password: "sanjha@2025" });
                const data = await safeFetch("/api/auth/official/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ employee_id: "GOV-001", password: "sanjha@2025" }),
                });
                setAuth(data.role || "official", data.user_id || 4);
                showToast("Demo Official (IAS Municipal Commissioner) logged in! Entering Portal...", "success");
                navigate("/official-dashboard");
            } else if (role === "industry") {
                setValues({ partner_id: "IND-001", password: "sanjha@2025" });
                const data = await safeFetch("/api/auth/industry/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ partner_id: "IND-001", password: "sanjha@2025" }),
                });
                setAuth(data.role || "industry", data.user_id || 5);
                showToast("Demo Partner (Tata Steel Foundation) logged in! Entering Portal...", "success");
                navigate("/industry-dashboard");
            }
        } catch (err: any) {
            setError(err.message || "Quick demo login failed");
            showToast(err.message || "Quick demo login failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const displayFields = cfg.fields;
    const ctaLabel = cfg.ctaLabel;

    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="min-h-screen flex flex-col bg-background"
        >
            {/* Colored Hero Header */}
            <div className={`${cfg.color} px-6 pt-12 pb-10 relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }}
                />
                <button
                    type="button"
                    onClick={() => navigate("/select-role")}
                    className="mb-8 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center active:scale-90 transition-transform relative"
                >
                    <span className="material-symbols-outlined text-white">arrow_back</span>
                </button>
                <div className="flex items-center space-x-3 relative">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {cfg.icon}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">{cfg.label}</h1>
                        <p className="text-white/70 text-sm">{cfg.sublabel}</p>
                    </div>
                </div>
            </div>

            {/* Login Card */}
            <div className="flex-1 px-6 -mt-4 relative z-10 pb-8">
                <form onSubmit={handleSubmit}>
                    <div className="bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant/40 p-6 space-y-5">

                        {/* 1-Click Instant Demo Access */}
                        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[15px]">bolt</span>
                                    Instant 1-Click Demo Login
                                </span>
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-mono font-bold px-2 py-0.5 rounded-full">
                                    No Typing Needed
                                </span>
                            </div>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={handleQuickDemo}
                                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-base">login</span>
                                <span>
                                    {role === "citizen" && "Instant Demo Citizen Login (+91 9876543210)"}
                                    {role === "student" && "Instant Demo Student Login (APAAR-12345)"}
                                    {role === "university" && "Instant Demo University Login (BIT Mesra)"}
                                    {role === "official" && "Instant Demo Official Login (GOV-001)"}
                                    {role === "industry" && "Instant Demo Industry Login (IND-001)"}
                                </span>
                            </button>
                        </div>

                        <div>
                            <h2 className="text-sm font-bold text-on-surface">
                                {otpSent ? "Enter 6-Digit Verification Code" : "Or enter your credentials manually"}
                            </h2>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                                {cfg.hint}
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-start space-x-2">
                                <span className="material-symbols-outlined text-base shrink-0">error</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Credential fields */}
                        {!otpSent && displayFields.map((field) => (
                            <motion.div
                                key={field.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                                    <span className="material-symbols-outlined text-sm align-middle mr-1">{field.icon}</span>
                                    {field.label}
                                </label>
                                <div className="flex items-center bg-surface-container-low rounded-xl border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all h-14 px-4">
                                    {field.prefix && (
                                        <span className="text-sm font-bold text-on-surface-variant pr-3 border-r border-outline-variant mr-3 whitespace-nowrap">
                                            {field.prefix}
                                        </span>
                                    )}
                                    <input
                                        type={field.type || "text"}
                                        inputMode={field.inputMode}
                                        maxLength={field.maxLength}
                                        placeholder={field.placeholder}
                                        value={values[field.id] || ""}
                                        onChange={(e) => setValues(v => ({ ...v, [field.id]: e.target.value }))}
                                        className="flex-1 bg-transparent text-base font-semibold text-on-surface placeholder-outline outline-none border-0 focus:ring-0 tracking-wide"
                                    />
                                </div>
                            </motion.div>
                        ))}

                        {/* OTP boxes (only for citizen phone flow) */}
                        {otpSent && cfg.loginType === "phone_otp" && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                                    6-Digit OTP sent to +91 {values["phone"]}
                                </label>
                                <div className="grid grid-cols-6 gap-2">
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            id={`otp-box-${i}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            className="aspect-square text-center text-xl font-bold font-mono-code bg-surface-container-low rounded-xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        />
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setOtpSent(false); setOtp(["","","","","",""]); }}
                                    className="mt-3 text-xs text-primary font-semibold underline underline-offset-2"
                                >
                                    ← Change number
                                </button>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full h-14 rounded-2xl ${cfg.color} text-white font-bold text-base flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-transform disabled:opacity-70`}
                        >
                            {loading ? (
                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                            ) : (
                                <>
                                    <span>{otpSent ? "Verify & Login" : ctaLabel}</span>
                                    <span className="material-symbols-outlined">arrow_circle_right</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-4 flex items-center justify-center space-x-2">
                    <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                    <p className="text-xs text-outline">256-bit SSL Secured · SocioSolve Jharkhand</p>
                </div>
            </div>
        </motion.div>
    );
}
