// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../context/ToastContext";
import { safeFetch } from "../../services/api";

export default function LoginScreen() {
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { showToast, showComingSoon } = useToast();
    const setStorePhone = useAuthStore((state) => state.setPhone);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedPhone = phone.trim();
        if (trimmedPhone.length !== 10 || !/^\d{10}$/.test(trimmedPhone)) {
            setError("Please enter a valid 10-digit mobile number");
            showToast("Please enter a valid 10-digit mobile number", "error");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const phoneParam = "+91" + trimmedPhone;
            const data = await safeFetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone_number: phoneParam }),
            });
            setStorePhone(phoneParam);
            showToast("OTP sent to your mobile number (Demo Code: 123456)", "info");
            navigate("/otp", { state: { phone: phoneParam } });
        } catch (err: any) {
            setError(err.message);
            showToast(err.message || "Failed to send OTP", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="min-h-screen flex flex-col bg-background text-on-background selection:bg-[#c2edcb] selection:text-[#00210f]"
        >

{/*  Top Navigation Header  */}
<header className="w-full bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/60 sticky top-0 z-50">
<div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
<div className="flex items-center space-x-3">
<div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm ring-2 ring-primary/20">
<span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
</div>
<div>
<div className="flex items-center space-x-2">
<span className="text-base sm:text-lg font-bold text-on-surface tracking-tight leading-none">SocioSolve</span>
<span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-tertiary-fixed text-primary tracking-wide uppercase">Jharkhand</span>
</div>
<p className="text-[11px] text-outline font-medium tracking-wide">Government &amp; Civic Technology Initiative</p>
</div>
</div>
<div className="hidden md:flex items-center space-x-6 text-sm font-medium text-on-surface-variant">
<button type="button" onClick={() => showComingSoon("Districts Map")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit font-medium text-sm">Districts Map</button>
<button type="button" onClick={() => showComingSoon("University Cohorts")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit font-medium text-sm">University Cohorts</button>
<button type="button" onClick={() => showComingSoon("Open Data Portal")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit font-medium text-sm">Open Data</button>
<div className="h-4 w-[1px] bg-outline-variant"></div>
<div className="flex items-center space-x-1.5 text-xs text-primary font-semibold bg-primary/10 px-3 py-1.5 rounded-full">
<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
<span>Verified Citizen Portal</span>
</div>
</div>
<div className="flex items-center space-x-2">
<button type="button" onClick={() => showComingSoon("Language Switcher")} className="text-xs font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer">
<span className="material-symbols-outlined text-base">translate</span>
<span className="hidden sm:inline">हिन्दी / English</span>
</button>
</div>
</div>
</header>
{/*  Main Content Container (12-Column Responsive Layout)  */}
<main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14 flex items-center">
<div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
{/*  Left Column: Grassroots Mission & Civic Context (Desktop Focused, hidden/condensed on mobile)  */}
<section className="lg:col-span-7 flex flex-col justify-center space-y-6 sm:space-y-8 pr-0 lg:pr-4">
<div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-tertiary-fixed/60 border border-primary/20 text-primary w-fit">
<span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
<span className="text-xs font-bold tracking-wide uppercase">Connecting 24 Districts of Jharkhand</span>
</div>
<div className="space-y-3">
<h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-[1.15]">
            Grassroots Citizen Problem Solving. <span className="text-primary">Solved Locally.</span>
</h1>
<p className="text-base sm:text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Directly connect civic challenges with district administrative officers, public policy researchers, and engineering student cohorts across Jharkhand.
          </p>
</div>
{/*  Metric highlights  */}
<div className="grid grid-cols-3 gap-3 sm:gap-4 py-2">
<div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/60">
<div className="text-xl sm:text-2xl font-bold text-primary font-mono-code">24 / 24</div>
<div className="text-xs text-on-surface-variant font-medium mt-0.5">Districts Active</div>
</div>
<div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/60">
<div className="text-xl sm:text-2xl font-bold text-primary font-mono-code">4,200+</div>
<div className="text-xs text-on-surface-variant font-medium mt-0.5">Civic Solvers</div>
</div>
<div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/60">
<div className="text-xl sm:text-2xl font-bold text-[#845400] font-mono-code">94.8%</div>
<div className="text-xs text-on-surface-variant font-medium mt-0.5">Resolution Rate</div>
</div>
</div>
{/*  Partner Banner / Features list  */}
<div className="space-y-3 pt-1">
<div className="flex items-start space-x-3.5 text-sm text-on-surface">
<div className="w-6 h-6 rounded-full bg-[#c2edcb] text-[#00210f] flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-sm font-bold">check</span>
</div>
<div>
<span className="font-semibold text-on-surface">BIT Mesra, NIT Jamshedpur &amp; University Capstone Solvers</span>
<p className="text-xs text-outline mt-0.5">Student innovator teams paired with local panchayats to build practical civic interventions.</p>
</div>
</div>
<div className="flex items-start space-x-3.5 text-sm text-on-surface">
<div className="w-6 h-6 rounded-full bg-[#c2edcb] text-[#00210f] flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-sm font-bold">check</span>
</div>
<div>
<span className="font-semibold text-on-surface">Tamper-Proof Citizen Governance</span>
<p className="text-xs text-outline mt-0.5">End-to-end audit trails with instant SMS status dispatch directly to registered Jharkhand mobile numbers.</p>
</div>
</div>
</div>
{/*  Institutional Quote Badge  */}
<div className="hidden sm:flex items-center space-x-3 p-3.5 bg-surface-container rounded-xl border border-outline-variant/50">
<span className="material-symbols-outlined text-primary text-2xl">account_balance</span>
<div className="text-xs text-on-surface-variant">
            Supported by Jharkhand Department of Higher and Technical Education &amp; Rural Development Cell.
          </div>
</div>
</section>
{/*  Right Column: Elevated Login Card (Mobile Original Flow + Desktop Polish)  */}
<section className="lg:col-span-5 w-full max-w-[480px] mx-auto lg:max-w-none">
<div className="relative w-full rounded-2xl overflow-hidden custom-shadow bg-surface-container-lowest border border-outline-variant/60 flex flex-col">
{/*  Card Header Banner  */}
<header className="relative w-full h-40 sm:h-44 overflow-hidden bg-primary-container">
<div className="absolute inset-0 bg-cover bg-center mix-blend-multiply opacity-55" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDz2VzkDmymWMza0l2kCSTT9eSjQeHXY7hRnrQ0t5Yj6KSPuNRvRRhOvHX8fGRKs7dUOOkUbbjW9-RnSjjhRcLAKM3eskxt-a7WFfv8lnjLsFSxtzmR9y69eGOMHR3Qh0T0NaezcmBfXG_Nx98usBUHKtZVYbJGYCNTDmByX_3MVaCkrpbI62_0uMc1tTOMm0D0ZoeBvd55_EQC7d945bsGadPT8RdOKbvxDvEcOIFtcO0jAcdfYLGAYw')" }} ></div>
<div className="absolute inset-0 bg-gradient-to-t from-on-background/80 via-primary/45 to-transparent"></div>
<div className="relative h-full flex flex-col justify-between p-5 sm:p-6 text-white">
<div className="flex items-center justify-between">
<div className="flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
<span className="material-symbols-outlined text-secondary-fixed text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
<span className="text-xs font-semibold tracking-wider uppercase text-white">SocioSolve Jharkhand</span>
</div>
<span className="flex items-center space-x-1 text-xs bg-primary/90 text-white px-2.5 py-1 rounded-full border border-white/25">
<span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
<span>Civic Portal</span>
</span>
</div>
<div>
<span className="text-xs text-secondary-fixed uppercase tracking-widest font-semibold block mb-0.5">Grassroots Access</span>
<h2 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight">Welcome back</h2>
</div>
</div>
</header>
{/*  Login Form Content  */}
<div className="p-5 sm:p-7 flex flex-col space-y-5 sm:space-y-6">
<div className="space-y-1">
<p className="text-sm sm:text-base font-semibold text-on-surface">Login with your mobile number</p>
<p className="text-xs text-outline">We will verify your citizen profile via a standard 6-digit SMS OTP</p>
</div>
<form className="flex flex-col space-y-4" onSubmit={onSubmit}>

{error && (
    <div className="p-3 mb-4 rounded-xl bg-error/10 text-error text-xs font-semibold">
        {error}
    </div>
)}

<div className="space-y-1.5">
<label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant" htmlFor="mobile-number">Mobile Number</label>
<div className="flex items-center bg-surface-container-low rounded-xl border border-outline-variant focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all min-h-[50px] px-3.5">
<div className="flex items-center space-x-1 pr-3 border-r border-outline-variant py-2 text-on-surface-variant select-none">
<span className="text-base font-semibold font-mono-code">+91</span>
<span className="material-symbols-outlined text-outline text-lg">expand_more</span>
</div>
<input autoComplete="tel" className="w-full bg-transparent pl-3.5 pr-2 py-3 text-base font-semibold text-on-surface placeholder-outline outline-none tracking-wide font-mono-code border-0 focus:ring-0" id="mobile-number" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" maxLength={10} placeholder="Enter 10-digit number" type="tel"/>
</div>
</div>
{/*  Civic Verification Prompt  */}
<div className="flex items-start space-x-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/60">
<div className="w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
</div>
<div className="text-xs leading-relaxed text-on-surface">
<span className="font-bold text-primary block">Instant Civic Verification</span>
                  A 6-digit OTP will be sent to your mobile number for secure authentication.
                </div>
</div>
{/*  University or Industry Partner Portal Shortcut  */}
<div onClick={() => navigate("/select-role")} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate("/select-role"); }} className="rounded-xl bg-surface-container-low p-3 flex items-center justify-between transition-colors hover:bg-surface-container-high border border-outline-variant/50 cursor-pointer">
<div className="flex items-center space-x-3">
<div className="w-8 h-8 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary shrink-0">
<span className="material-symbols-outlined text-lg">domain</span>
</div>
<div className="text-left">
<p className="text-xs font-semibold text-on-surface">University or Industry Partner?</p>
<p className="text-[11px] text-outline">Access specialized portals with institutional ID</p>
</div>
</div>
<span className="material-symbols-outlined text-outline text-xl">arrow_forward</span>
</div>
{/*  Action Submit Button with iOS spring active state  */}
<button className="active-spring w-full h-12 rounded-xl bg-primary hover:bg-primary-container text-white font-semibold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2" type="submit">
<span>{loading ? "Sending..." : "Send OTP"}</span>
<span className="material-symbols-outlined text-xl">arrow_circle_right</span>
</button>
{/*  Alternative Verification Methods  */}
<div className="pt-2">
<div className="relative flex py-1 items-center">
<div className="flex-grow border-t border-outline-variant/60"></div>
<span className="flex-shrink mx-3 text-[11px] font-semibold text-outline uppercase tracking-wider">Or continue with</span>
<div className="flex-grow border-t border-outline-variant/60"></div>
</div>
<div className="grid grid-cols-2 gap-2.5 mt-2.5">
<button onClick={() => showComingSoon("WhatsApp OTP Delivery")} className="active-spring flex items-center justify-center space-x-2 py-2 px-3 border border-outline-variant rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-colors text-xs font-semibold text-on-surface cursor-pointer" type="button">
<span className="material-symbols-outlined text-emerald-600 text-base">chat</span>
<span>WhatsApp OTP</span>
</button>
<button onClick={() => showComingSoon("Aadhaar e-KYC Verification")} className="active-spring flex items-center justify-center space-x-2 py-2 px-3 border border-outline-variant rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-colors text-xs font-semibold text-on-surface cursor-pointer" type="button">
<span className="material-symbols-outlined text-primary text-base">badge</span>
<span>Aadhaar e-KYC</span>
</button>
</div>
</div>
</form>
<div className="pt-1 flex flex-col items-center justify-center space-y-2 text-center">
<div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-surface-container text-tertiary">
<span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
<span className="text-xs font-semibold">Secured by SocioSolve Grassroots Network</span>
</div>
<p className="text-[11px] text-outline max-w-xs leading-relaxed">
    By continuing, you agree to our <button type="button" onClick={() => showComingSoon("Terms of Service")} className="text-primary underline underline-offset-2 font-medium hover:text-primary-container cursor-pointer bg-transparent border-0 p-0 inline">terms of service</button> and <button type="button" onClick={() => showComingSoon("Privacy Policy")} className="text-primary underline underline-offset-2 font-medium hover:text-primary-container cursor-pointer bg-transparent border-0 p-0 inline">privacy policy</button>.
</p>
</div>
</div>
{/*  Bottom Card Trust Bar  */}
<div className="bg-surface-container p-3.5 flex items-center justify-around text-center border-t border-outline-variant/40">
<div className="flex items-center space-x-1.5 text-on-surface-variant">
<span className="material-symbols-outlined text-base text-primary">gavel</span>
<span className="text-xs font-medium">Civic Trust</span>
</div>
<div className="w-1 h-1 rounded-full bg-outline-variant"></div>
<div className="flex items-center space-x-1.5 text-on-surface-variant">
<span className="material-symbols-outlined text-base text-primary">groups</span>
<span className="text-xs font-medium">Citizen Led</span>
</div>
<div className="w-1 h-1 rounded-full bg-outline-variant"></div>
<div className="flex items-center space-x-1.5 text-on-surface-variant">
<span className="material-symbols-outlined text-base text-primary">lock</span>
<span className="text-xs font-medium">256-Bit SSL</span>
</div>
</div>
</div>
</section>
</div>
</main>
{/*  Full-Width Footer spanning 100% of the screen  */}
<footer className="w-full bg-surface-container-high border-t border-outline-variant/60 mt-auto">
<div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8 pb-8 border-b border-outline-variant/40">
<div className="space-y-2.5 md:col-span-1">
<div className="flex items-center space-x-2">
<div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white">
<span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
</div>
<span className="font-bold text-on-surface text-base">SocioSolve</span>
</div>
<p className="text-xs text-on-surface-variant leading-relaxed">
            Decentralized public problem resolution platform bridging Jharkhand's citizens, administration, and universities.
          </p>
</div>
<div>
<h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3">Districts &amp; Hubs</h3>
<ul className="space-y-1.5 text-xs text-on-surface-variant">
<li><button type="button" onClick={() => showComingSoon("Ranchi Central Division Hub")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit text-left">Ranchi Central Division</button></li>
<li><button type="button" onClick={() => showComingSoon("Jamshedpur & East Singhbhum Hub")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit text-left">Jamshedpur &amp; East Singhbhum</button></li>
<li><button type="button" onClick={() => showComingSoon("Dhanbad Industrial Hub")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit text-left">Dhanbad Industrial Hub</button></li>
<li><button type="button" onClick={() => showComingSoon("Hazaribagh & Santhal Pargana Hub")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit text-left">Hazaribagh &amp; Santhal Pargana</button></li>
</ul>
</div>
<div>
<h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3">Institutional Links</h3>
<ul className="space-y-1.5 text-xs text-on-surface-variant">
<li><button type="button" onClick={() => showComingSoon("BIT Mesra Innovation Cell")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit text-left">BIT Mesra Innovation Cell</button></li>
<li><button type="button" onClick={() => showComingSoon("Panchayat Grievance API Documentation")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit text-left">Panchayat Grievance API</button></li>
<li><button type="button" onClick={() => showComingSoon("Volunteer Solver Onboarding")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit text-left">Volunteer Solver Onboarding</button></li>
<li><button type="button" onClick={() => showComingSoon("Jharkhand Open Data Portal")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit text-left">Jharkhand Open Data Portal</button></li>
</ul>
</div>
<div className="space-y-2">
<h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3">Civic Helpline</h3>
<button type="button" onClick={() => showComingSoon("Toll-Free Helpline 1800-345-XXXX")} className="w-full flex items-center space-x-2 text-xs text-on-surface font-semibold bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/60 hover:bg-surface-container-low transition-colors cursor-pointer text-left">
<span className="material-symbols-outlined text-primary text-lg">call</span>
<span>Toll-Free: 1800-345-XXXX</span>
</button>
<p className="text-[11px] text-outline">Available Monday to Saturday, 9:00 AM – 6:00 PM IST</p>
</div>
</div>
{/*  Bottom Credits & Compliance  */}
<div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-outline space-y-3 sm:space-y-0">
<div>© 2025 SocioSolve Jharkhand. Designed for citizen transparency.</div>
<div className="flex items-center space-x-5">
<button type="button" onClick={() => showComingSoon("Privacy Policy")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit">Privacy Policy</button>
<button type="button" onClick={() => showComingSoon("Terms of Service")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit">Terms of Service</button>
<button type="button" onClick={() => showComingSoon("Accessibility Statement")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit">Accessibility</button>
<button type="button" onClick={() => showComingSoon("RTI Portal")} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit">RTI Portal</button>
</div>
</div>
</div>
</footer>

        </motion.div>
    );
}
