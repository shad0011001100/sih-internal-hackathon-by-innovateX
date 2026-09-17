// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../context/ToastContext";
import { safeFetch } from "../../services/api";

export default function OtpScreen() {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(54);
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast, showComingSoon } = useToast();
    
    const authPhone = useAuthStore(state => state.phone);
    const setAuth = useAuthStore(state => state.setAuth);
    const setPhone = useAuthStore(state => state.setPhone);

    const rawPhone = location.state?.phone || authPhone || "+91 99XXXXXX34";
    const displayPhone = rawPhone;

    useEffect(() => {
        if (!location.state?.phone && !authPhone) {
            // keep fallback
        }
    }, [authPhone, location.state]);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    const formattedCountdown = `00:${countdown < 10 ? '0' + countdown : countdown}`;

    const handleBack = () => {
        navigate(-1);
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^[0-9]*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        
        // Auto focus next
        if (value !== "" && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleKeypadPress = (digit: string) => {
        const firstEmptyIndex = otp.findIndex(val => val === "");
        const targetIndex = firstEmptyIndex !== -1 ? firstEmptyIndex : 5;
        const newOtp = [...otp];
        newOtp[targetIndex] = digit;
        setOtp(newOtp);
        
        if (targetIndex < 5) {
            const nextInput = document.getElementById(`otp-${targetIndex + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeypadBackspace = () => {
        let lastFilledIndex = -1;
        for (let i = otp.length - 1; i >= 0; i--) {
            if (otp[i] !== "") {
                lastFilledIndex = i;
                break;
            }
        }
        if (lastFilledIndex !== -1) {
            const newOtp = [...otp];
            newOtp[lastFilledIndex] = "";
            setOtp(newOtp);
            const prevInput = document.getElementById(`otp-${lastFilledIndex}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleResendOtp = async () => {
        if (countdown > 0) {
            showToast(`Please wait ${countdown}s before requesting a new OTP`, "info");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const phoneParam = rawPhone.startsWith("+91") ? rawPhone : "+91" + rawPhone;
            await safeFetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone_number: phoneParam }),
            });
            setCountdown(60);
            showToast(`OTP resent successfully to ${displayPhone} (Demo Code: 123456)`, "success");
        } catch (err: any) {
            setError(err.message);
            showToast(err.message || "Failed to resend OTP", "error");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (e?: React.FormEvent) => {
        if (e && e.preventDefault) e.preventDefault();
        const code = otp.join("");
        if (code.length !== 6) {
            setError("Please enter all 6 digits");
            showToast("Please enter all 6 digits of the OTP", "error");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const phoneParam = rawPhone.startsWith("+91") ? rawPhone : "+91" + rawPhone;
            const data = await safeFetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone_number: phoneParam, otp: code }),
            });
            
            setAuth(data.role || "citizen", data.user_id || 1);
            setPhone(phoneParam);
            showToast("Verification successful! Welcome to SocioSolve.", "success");
            navigate("/dashboard?guide=true");
        } catch (err: any) {
            setError(err.message);
            showToast(err.message || "Invalid OTP", "error");
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

{/*  1. FULL-WIDTH TOP NAVIGATION BANNER (100% VIEWPORT WIDTH)  */}
<header className="w-full bg-[#3e644a] text-on-primary border-b border-[#31503b] shadow-sm sticky top-0 z-30">
<div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
{/*  Brand / Logo  */}
<div className="flex items-center gap-3">
<button onClick={handleBack} aria-label="Go back to previous screen" className="flex items-center justify-center min-w-[38px] min-h-[38px] w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white focus:outline-none cursor-pointer" type="button">
<span className="material-symbols-outlined text-[20px]" data-icon="arrow_back">arrow_back</span>
</button>
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-lg bg-[#c2edcb] flex items-center justify-center text-[#294e36] shadow-sm">
<span className="material-symbols-outlined text-[20px]" data-icon="eco">eco</span>
</div>
<div className="flex flex-col">
<span className="font-headline-sm text-[16px] font-bold tracking-tight text-white leading-none">SocioSolve</span>
<span className="font-label-sm text-[10px] text-[#c2edcb] tracking-wider uppercase">Jharkhand Grassroots Portal</span>
</div>
</div>
</div>
{/*  Right Header Utilities  */}
<div className="flex items-center gap-3">
<div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-label-md border border-white/15">
<span className="material-symbols-outlined text-[14px] text-[#fdb248]" data-icon="lock">lock</span>
<span>Secure 256-Bit SSL</span>
</div>
<button type="button" onClick={() => showComingSoon("Citizen Grievance Helpline")} className="inline-flex items-center gap-1 text-white/80 hover:text-white text-xs font-label-md px-2 py-1 cursor-pointer bg-transparent border-0">
<span className="material-symbols-outlined text-[16px]" data-icon="help">help</span>
<span className="hidden md:inline">Need Help?</span>
</button>
</div>
</div>
</header>
{/*  2. MAIN WORKSPACE WITH 12-COLUMN CONTAINER CAPPED AT 1200px  */}
<main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12 flex flex-col justify-center">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
{/*  DESKTOP CONTEXT / SECURITY BENEFITS COLUMN (col-span-6 / col-span-7)  */}
<div className="hidden lg:flex lg:col-span-6 flex-col justify-center pr-4">
<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3e644a]/10 border border-[#3e644a]/20 text-[#3e644a] w-fit mb-4">
<span className="material-symbols-outlined text-[16px]" data-icon="verified">verified</span>
<span className="font-label-md text-xs tracking-wide font-semibold">Verified Citizen Portal</span>
</div>
<h2 className="font-display-lg text-[36px] font-bold text-[#18181B] tracking-tight leading-[1.2] mb-4">
        Direct Governance for Panchayats &amp; Municipalities of Jharkhand
      </h2>
<p className="font-body-md text-[#424942] text-base leading-relaxed mb-8">
        Your verification authenticates access to grassroots public grievance tracking, social welfare schemes, and block-level updates.
      </p>
{/*  Trust Badges List  */}
<div className="space-y-4">
<div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/80 border border-[#3e644a]/15 shadow-[0_2px_8px_rgba(24,24,27,0.03)]">
<div className="w-10 h-10 rounded-xl bg-[#c2edcb]/60 flex items-center justify-center text-[#3e644a] flex-shrink-0">
<span className="material-symbols-outlined text-[22px]" data-icon="speed">speed</span>
</div>
<div>
<h4 className="font-headline-sm text-sm font-semibold text-[#18181B]">Instant verification</h4>
<p className="font-body-sm text-xs text-[#727972] mt-0.5">Automated SMS delivery backed by state grassroots communication towers.</p>
</div>
</div>
<div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/80 border border-[#3e644a]/15 shadow-[0_2px_8px_rgba(24,24,27,0.03)]">
<div className="w-10 h-10 rounded-xl bg-[#c2edcb]/60 flex items-center justify-center text-[#3e644a] flex-shrink-0">
<span className="material-symbols-outlined text-[22px]" data-icon="account_balance">account_balance</span>
</div>
<div>
<h4 className="font-headline-sm text-sm font-semibold text-[#18181B]">Panchayats &amp; Municipalities of Jharkhand</h4>
<p className="font-body-sm text-xs text-[#727972] mt-0.5">Direct integration with 24 districts across urban local bodies and gram sabhas.</p>
</div>
</div>
<div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/80 border border-[#3e644a]/15 shadow-[0_2px_8px_rgba(24,24,27,0.03)]">
<div className="w-10 h-10 rounded-xl bg-[#fdb248]/20 flex items-center justify-center text-[#845400] flex-shrink-0">
<span className="material-symbols-outlined text-[22px]" data-icon="security">security</span>
</div>
<div>
<h4 className="font-headline-sm text-sm font-semibold text-[#18181B]">256-bit SSL End-to-End Encryption</h4>
<p className="font-body-sm text-xs text-[#727972] mt-0.5">Strict privacy standards compliant with digital governance protection norms.</p>
</div>
</div>
</div>
</div>
{/*  VERIFICATION CARD (col-span-12 on mobile, col-span-6 on desktop)  */}
<div className="col-span-12 lg:col-span-6 w-full max-w-[440px] mx-auto">
<div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(24,24,27,0.08)] border border-[rgba(91,130,102,0.18)] overflow-hidden">
{/*  Top Forest Green Header  */}
<div className="bg-[#3e644a] p-6 sm:p-7 text-on-primary rounded-b-2xl shadow-sm relative overflow-hidden">
<div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-white/5 pointer-events-none blur-lg"></div>
<div className="absolute left-0 bottom-0 w-24 h-24 rounded-full bg-black/5 pointer-events-none blur-md"></div>
{/*  Mobile Header Navigation (visible on small screens)  */}
<div className="flex lg:hidden items-center justify-between relative z-10 mb-5">
<button onClick={handleBack} aria-label="Go back to previous screen" className="flex items-center justify-center min-w-[40px] min-h-[40px] w-10 h-10 rounded-full bg-white/10 text-on-primary hover:bg-white/20 active:scale-95 transition-all focus:outline-none cursor-pointer" type="button">
<span className="material-symbols-outlined text-[20px]" data-icon="arrow_back">arrow_back</span>
</button>
<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-on-primary text-xs font-label-md">
<span className="material-symbols-outlined text-[15px] text-[#c2edcb]" data-icon="eco">eco</span>
<span>SocioSolve</span>
</div>
<div className="w-10 h-10 flex items-center justify-center text-white/70">
<span className="material-symbols-outlined text-[18px]" data-icon="shield">shield</span>
</div>
</div>
<div className="relative z-10">
<h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
              Verification
            </h1>
<p className="font-body-md text-sm sm:text-base text-white/90 leading-relaxed">
              Enter the 6-digit OTP sent to <span className="font-semibold text-white tracking-wide">{displayPhone}</span>
<button onClick={handleBack} className="inline-flex items-center font-label-md text-xs sm:text-sm text-[#c2edcb] hover:text-white underline underline-offset-4 ml-1.5 focus:outline-none cursor-pointer" type="button">
                Edit number
              </button>
</p>
</div>
</div>
{/*  Card Body  */}
<div className="p-6 sm:p-7 space-y-6">

{error && (
    <div className="p-3 rounded-xl bg-red-100 text-red-700 text-xs font-semibold text-center border border-red-200">
        {error}
    </div>
)}

{/*  6-Digit Verification Code Inputs  */}
<div>
<label className="block text-center font-label-md text-xs font-semibold text-[#424942] uppercase tracking-wider mb-3">
              Enter 6-Digit Code
            </label>
<div aria-label="6-Digit Verification Code" className="flex items-center justify-between gap-1.5 sm:gap-2 max-w-[340px] mx-auto" role="group">
{otp.map((digit, index) => (
<input
    key={index}
    id={`otp-${index}`}
    type="text"
    inputMode="numeric"
    maxLength={1}
    value={digit}
    onChange={(e) => handleOtpChange(index, e.target.value)}
    onKeyDown={(e) => handleKeyDown(index, e)}
    className={`flex-1 aspect-square max-w-[48px] min-h-[46px] rounded-xl border text-center font-mono text-xl sm:text-2xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#fdb248] shadow-sm ${
        digit !== "" ? "bg-white border-[#3e644a]/30" : "bg-[#FAF9F5] border-[#3e644a]/20"
    }`}
/>
))}
</div>
</div>
{/*  Countdown Timer and Resend Actions  */}
<div className="flex flex-col items-center justify-center space-y-3 text-center">
{/*  Countdown timer with warm amber accent  */}
<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF9F5] border border-[#3e644a]/20 text-[#18181B]">
<span className="material-symbols-outlined text-[17px] text-[#fdb248]" data-icon="timer">timer</span>
<span className="font-body-sm text-xs text-[#727972]">Resend code in</span>
<span className="font-mono text-xs font-bold text-[#845400] bg-[#fdb248]/20 px-2 py-0.5 rounded tracking-wider" id="countdown">{formattedCountdown}</span>
</div>
{/*  Resend SMS Button  */}
<button onClick={handleResendOtp} disabled={loading} aria-label="Request SMS resend" className="min-h-[40px] inline-flex items-center px-3 font-label-md text-xs sm:text-sm text-[#3e644a] font-semibold hover:underline active:scale-95 transition-transform cursor-pointer disabled:opacity-50" type="button">
              Resend OTP via SMS
            </button>
{/*  'Didn't receive code? Try WhatsApp' Box  */}
<button onClick={() => showComingSoon("WhatsApp OTP Delivery")} className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FAF9F5] hover:bg-white border border-[#3e644a]/20 hover:border-[#3e644a]/40 hover:shadow-sm active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2 shadow-[0_1px_4px_rgba(24,24,27,0.03)] text-[#18181B] cursor-pointer" type="button">
<span className="material-symbols-outlined text-[18px] text-[#3e644a]" data-icon="chat_bubble">chat_bubble</span>
<span className="font-label-md text-xs sm:text-sm font-medium text-[#18181B]">Didn't receive code? Try WhatsApp</span>
</button>
</div>
{/*  Primary CTA Button with iOS active:scale-95 spring physics  */}
<button onClick={onSubmit} disabled={loading} className="w-full min-h-[50px] py-3.5 px-6 bg-[#3e644a] hover:bg-[#33533d] active:scale-95 text-white font-headline-sm text-base font-semibold rounded-xl shadow-[0_4px_16px_rgba(62,100,74,0.28)] flex items-center justify-center gap-2 transition-all duration-150 ease-out focus:outline-none focus:ring-4 focus:ring-[#3e644a]/25 cursor-pointer disabled:opacity-70" type="button">
<span>{loading ? "Verifying..." : "Verify & Proceed"}</span>
<span className="material-symbols-outlined text-[19px]" data-icon="arrow_forward">arrow_forward</span>
</button>
{/*  Grassroots Security Badge  */}
<div className="flex items-center justify-center gap-1.5 pt-1 text-[#727972]">
<span className="material-symbols-outlined text-[15px] text-[#3e644a]" data-icon="verified_user">verified_user</span>
<span className="font-label-sm text-xs">Secured by SocioSolve Grassroots Network</span>
</div>
{/*  Virtual Dialpad (Rendered primarily for mobile view / quick accessibility)  */}
<div className="lg:hidden pt-3 border-t border-[rgba(91,130,102,0.15)]">
<div aria-label="Virtual NumPad" className="grid grid-cols-3 gap-1.5 text-center">
<button onClick={() => handleKeypadPress("1")} className="min-h-[44px] py-1.5 rounded-xl bg-white hover:bg-surface-variant active:scale-90 border border-[rgba(91,130,102,0.15)] flex flex-col items-center justify-center text-xs font-bold cursor-pointer" type="button">
<span className="font-mono text-lg text-[#18181B]">1</span>
</button>
<button onClick={() => handleKeypadPress("2")} className="min-h-[44px] py-1.5 rounded-xl bg-white hover:bg-surface-variant active:scale-90 border border-[rgba(91,130,102,0.15)] flex flex-col items-center justify-center text-xs font-bold cursor-pointer" type="button">
<span className="font-mono text-lg text-[#18181B]">2</span>
</button>
<button onClick={() => handleKeypadPress("3")} className="min-h-[44px] py-1.5 rounded-xl bg-white hover:bg-surface-variant active:scale-90 border border-[rgba(91,130,102,0.15)] flex flex-col items-center justify-center text-xs font-bold cursor-pointer" type="button">
<span className="font-mono text-lg text-[#18181B]">3</span>
</button>
<button onClick={() => handleKeypadPress("4")} className="min-h-[44px] py-1.5 rounded-xl bg-white hover:bg-surface-variant active:scale-90 border border-[rgba(91,130,102,0.15)] flex flex-col items-center justify-center text-xs font-bold cursor-pointer" type="button">
<span className="font-mono text-lg text-[#18181B]">4</span>
</button>
<button onClick={() => handleKeypadPress("5")} className="min-h-[44px] py-1.5 rounded-xl bg-white hover:bg-surface-variant active:scale-90 border border-[rgba(91,130,102,0.15)] flex flex-col items-center justify-center text-xs font-bold cursor-pointer" type="button">
<span className="font-mono text-lg text-[#18181B]">5</span>
</button>
<button onClick={() => handleKeypadPress("6")} className="min-h-[44px] py-1.5 rounded-xl bg-white hover:bg-surface-variant active:scale-90 border border-[rgba(91,130,102,0.15)] flex flex-col items-center justify-center text-xs font-bold cursor-pointer" type="button">
<span className="font-mono text-lg text-[#18181B]">6</span>
</button>
<button onClick={() => handleKeypadPress("7")} className="min-h-[44px] py-1.5 rounded-xl bg-white hover:bg-surface-variant active:scale-90 border border-[rgba(91,130,102,0.15)] flex flex-col items-center justify-center text-xs font-bold cursor-pointer" type="button">
<span className="font-mono text-lg text-[#18181B]">7</span>
</button>
<button onClick={() => handleKeypadPress("8")} className="min-h-[44px] py-1.5 rounded-xl bg-white hover:bg-surface-variant active:scale-90 border border-[rgba(91,130,102,0.15)] flex flex-col items-center justify-center text-xs font-bold cursor-pointer" type="button">
<span className="font-mono text-lg text-[#18181B]">8</span>
</button>
<button onClick={() => handleKeypadPress("9")} className="min-h-[44px] py-1.5 rounded-xl bg-white hover:bg-surface-variant active:scale-90 border border-[rgba(91,130,102,0.15)] flex flex-col items-center justify-center text-xs font-bold cursor-pointer" type="button">
<span className="font-mono text-lg text-[#18181B]">9</span>
</button>
<div className="min-h-[44px]"></div>
<button onClick={() => handleKeypadPress("0")} className="min-h-[44px] py-1.5 rounded-xl bg-white hover:bg-surface-variant active:scale-90 border border-[rgba(91,130,102,0.15)] flex flex-col items-center justify-center text-xs font-bold cursor-pointer" type="button">
<span className="font-mono text-lg text-[#18181B]">0</span>
</button>
<button onClick={handleKeypadBackspace} aria-label="Backspace digit" className="min-h-[44px] py-1.5 rounded-xl bg-transparent hover:bg-white/50 active:scale-90 flex items-center justify-center text-[#18181B] cursor-pointer" type="button">
<span className="material-symbols-outlined text-[20px]" data-icon="backspace">backspace</span>
</button>
</div>
</div>
</div>
</div>
</div>
</div>
</main>
{/*  3. FULL-WIDTH TRUST FOOTER (100% VIEWPORT WIDTH)  */}
<footer className="w-full bg-[#eae7eb] border-t border-[rgba(91,130,102,0.15)] mt-auto text-[#424942]">
<div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-body-sm">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-[#3e644a]"></span>
<span className="font-medium text-[#18181B]">Government of Jharkhand Grievance &amp; Public Redressal Initiative</span>
</div>
<div className="flex items-center gap-5 text-[#727972]">
<button type="button" onClick={() => showComingSoon("Privacy Policy")} className="hover:text-[#3e644a] transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit">Privacy Policy</button>
<button type="button" onClick={() => showComingSoon("Citizen Charter")} className="hover:text-[#3e644a] transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit">Citizen Charter</button>
<button type="button" onClick={() => showComingSoon("District Helpline: 1800-345-XXXX")} className="hover:text-[#3e644a] transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit">District Helpline: 1800-XXX-XXXX</button>
</div>
</div>
</footer>


        </motion.div>
    );
}
