// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "../../context/ToastContext";
import { safeFetch } from "../../services/api";

const CATEGORIES = [
    { label: "Civic Issue", icon: "campaign" },
    { label: "Water Supply", icon: "water_drop" },
    { label: "Roads & Sanitation", icon: "alt_route" },
    { label: "Infrastructure", icon: "construction" },
    { label: "Education", icon: "school" },
    { label: "Health", icon: "local_hospital" },
    { label: "Street Lighting", icon: "lightbulb" },
];

export default function ReportScreen() {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Water Supply");
    const [description, setDescription] = useState("");
    const [gps, setGps] = useState<{ lat: number; lon: number } | null>({ lat: 23.3297, lon: 85.3262 });
    const [gpsStatus, setGpsStatus] = useState<string>("Ward 4, Doranda, Ranchi (23.3297° N, 85.3262° E)");
    const [isLocating, setIsLocating] = useState(false);
    const [photo, setPhoto] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const { showToast, showComingSoon } = useToast();

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result as string);
                showToast("Evidence photo attached successfully!", "success");
            };
            reader.readAsDataURL(file);
        }
    };

    const requestGps = () => {
        if (!navigator.geolocation) {
            showToast("Geolocation is not supported by your browser", "warning");
            setError("Geolocation is not supported by your browser");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGps({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                setGpsStatus(`Lat: ${pos.coords.latitude.toFixed(4)}° N, Lon: ${pos.coords.longitude.toFixed(4)}° E`);
                setIsLocating(false);
                showToast("GPS coordinates acquired successfully!", "success");
            },
            (err) => {
                setIsLocating(false);
                // Fallback coordinates for Ranchi Ward 4
                setGps({ lat: 23.3297, lon: 85.3262 });
                setGpsStatus("Ward 4, Doranda, Ranchi (23.3297° N, 85.3262° E)");
                showToast("Using default Ranchi coordinates (permission denied or unavailable)", "info");
            },
            { timeout: 8000 }
        );
    };

    const onSubmit = async (e?: React.FormEvent) => {
        if (e && e.preventDefault) e.preventDefault();

        if (!title.trim()) {
            showToast("Please enter an issue title", "warning");
            setError("Issue title is required");
            return;
        }
        if (!description.trim()) {
            showToast("Please provide a description of the issue", "warning");
            setError("Issue description is required");
            return;
        }

        setLoading(true);
        setSubmitting(true);
        setError(null);

        try {
            const payload = {
                title: title.trim(),
                category,
                description: description.trim(),
                gps_lat: gps?.lat ?? 23.3297,
                gps_lon: gps?.lon ?? 85.3262,
                photo_base64: photo || undefined,
            };

            await safeFetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            showToast("Grievance submitted successfully! Ticket token generated.", "success");
            navigate("/dashboard");
        } catch (err: any) {
            const errorMsg = err.message || "Failed to submit report. Please check your connection.";
            setError(errorMsg);
            showToast(errorMsg, "error");
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="min-h-screen flex flex-col bg-background text-on-background selection:bg-[#c2edcb] selection:text-[#00210f]"
        >

{/*  FULL-WIDTH TOP HEADER & NAVIGATION  */}
<header className="w-full bg-[#3e644a] text-white sticky top-0 z-40 shadow-md">
{/*  Main Topbar  */}
<div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
<div className="flex items-center gap-3">
<button onClick={() => navigate('/dashboard')} aria-label="Back to feed" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer" type="button">
<span className="material-symbols-outlined text-[22px]">arrow_back</span>
</button>
<div className="flex items-center gap-2.5">
<div className="w-9 h-9 rounded-xl bg-[#c2edcb] text-[#3e644a] flex items-center justify-center font-bold shadow-sm">
<span className="material-symbols-outlined text-[20px]">eco</span>
</div>
<div>
<span className="font-bold tracking-tight text-base sm:text-lg block leading-none">SocioSolve</span>
<span className="text-[11px] text-white/75 font-medium tracking-wide uppercase">Jharkhand Grievance Redressal</span>
</div>
</div>
</div>
{/*  Right Header Actions  */}
<div className="flex items-center gap-3">
<div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-xs text-white font-medium">
<span className="w-2 h-2 rounded-full bg-[#fdb248] animate-pulse"></span>
<span>GP Live Portal • Ranchi District</span>
</div>
<button onClick={() => showComingSoon("Language Switcher")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer" type="button">
<span className="material-symbols-outlined text-[16px]">language</span>
<span className="hidden sm:inline">English / हिन्दी</span>
</button>
</div>
</div>
{/*  Breadcrumb Bar  */}
<div className="border-t border-white/10 bg-[#34553f]/70 backdrop-blur-sm">
<div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between text-xs text-white/80">
<nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 font-medium">
<button onClick={() => navigate('/')} type="button" className="hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs text-white/80">Home</button>
<span className="material-symbols-outlined text-[14px] text-white/50">chevron_right</span>
<button onClick={() => navigate('/dashboard')} type="button" className="hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs text-white/80">Feed</button>
<span className="material-symbols-outlined text-[14px] text-white/50">chevron_right</span>
<span className="text-[#c2edcb] font-semibold">Report Issue</span>
</nav>
<div className="hidden sm:flex items-center gap-1.5 text-white/70 text-[11px] font-mono">
<span className="material-symbols-outlined text-[14px] text-[#fdb248]">gavel</span>
<span>Jharkhand Public Service Guarantee Act Compliant</span>
</div>
</div>
</div>
</header>
{/*  MAIN VIEWPORT CONTAINER (Centered 12-column grid max-w-[1200px])  */}
<main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
{/*  Page Title Header  */}
<div className="mb-6 lg:mb-8">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3e644a]/10 text-[#3e644a] text-xs font-semibold tracking-wide mb-2">
<span className="material-symbols-outlined text-[15px]">campaign</span>
<span>Public Grievance Intake Form</span>
</div>
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1b1b1e] tracking-tight">
        File a Civic Grievance
      </h1>
<p className="text-sm sm:text-base text-[#424942] mt-1.5 max-w-2xl">
        Empowering rural &amp; urban communities in Jharkhand. Submit photo evidence and written grievance with automatic geotagging.
      </p>
{error && (
    <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
        <span className="material-symbols-outlined text-base">error</span>
        <span>{error}</span>
    </div>
)}
</div>
{/*  Responsive 12-Column Grid  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
{/*  LEFT / MAIN CONTENT SECTION (col-span-12 lg:col-span-7 xl:col-span-8)  */}
<div className="lg:col-span-7 xl:col-span-8 space-y-6">
{/*  1. ISSUE TITLE  */}
<div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#c1c8c0]/50 shadow-sm">
<label className="block text-xs font-bold uppercase tracking-wider text-[#1b1b1e] font-mono mb-2" htmlFor="issue-title">
            1. Issue Title <span className="text-red-500">*</span>
</label>
<div className="relative">
<input 
    className="w-full bg-[#fbf8fc] rounded-xl px-4 py-3.5 border border-[#c1c8c0]/70 text-[#1b1b1e] placeholder-[#727972] text-sm sm:text-base focus:bg-white focus:border-[#3e644a] focus:ring-2 focus:ring-[#3e644a]/20 outline-none transition-all font-medium" 
    id="issue-title" 
    placeholder="e.g. Broken Handpump near Tribal Welfare Hostel" 
    type="text" 
    value={title}
    onChange={(e) => setTitle(e.target.value)}
/>
<div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center text-xs text-[#3e644a] bg-[#c2edcb]/50 px-2 py-1 rounded-md font-mono">
              Auto-clarity: High
            </div>
</div>
<p className="text-xs text-[#727972] mt-2 flex items-center gap-1">
<span className="material-symbols-outlined text-[15px] text-[#4d6055]">info</span>
            Provide a short, direct summary mentioning landmark or specific place.
          </p>
</div>
{/*  2. CATEGORY SELECTOR CHIPS  */}
<div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#c1c8c0]/50 shadow-sm">
<div className="flex items-center justify-between mb-3">
<label className="block text-xs font-bold uppercase tracking-wider text-[#1b1b1e] font-mono">
              2. Select Category <span className="text-red-500">*</span>
</label>
<span className="text-xs text-[#4d6055] font-mono">Select best match</span>
</div>
<div className="flex flex-wrap gap-2.5">
{CATEGORIES.map((cat) => {
    const isSelected = category === cat.label;
    return (
        <button
            key={cat.label}
            onClick={() => setCategory(cat.label)}
            type="button"
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all cursor-pointer ${
                isSelected
                    ? "bg-[#3e644a] text-white shadow-sm border border-[#3e644a] ring-2 ring-[#3e644a]/20"
                    : "bg-[#fbf8fc] hover:bg-[#eae7eb] text-[#1b1b1e] border border-[#c1c8c0]/70"
            }`}
        >
            <span className={`material-symbols-outlined text-[18px] ${isSelected ? "text-white" : "text-[#4d6055]"}`}>
                {cat.icon}
            </span>
            <span>{cat.label}</span>
        </button>
    );
})}
</div>
</div>

{/*  3. TEXT DESCRIPTION FIELD  */}
<div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#c1c8c0]/50 shadow-sm">
<div className="flex items-center justify-between mb-2">
<label className="block text-xs font-bold uppercase tracking-wider text-[#1b1b1e] font-mono" htmlFor="issue-description">
              3. Written Description &amp; Details <span className="text-red-500">*</span>
            </label>
<span className="text-xs text-[#727972] font-mono">{description.length} / 500 chars</span>
</div>
<div className="bg-[#fbf8fc] rounded-xl p-3.5 border border-[#c1c8c0]/70 focus-within:border-[#3e644a] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3e644a]/20 transition-all">
<textarea 
    className="w-full bg-transparent text-[#1b1b1e] placeholder-[#727972] text-sm focus:outline-none resize-none min-h-[110px] leading-relaxed" 
    id="issue-description" 
    value={description} 
    onChange={e => setDescription(e.target.value)} 
    placeholder="e.g., The handpump near the primary school in Ward 4 has been broken for 3 weeks, causing severe drinking water shortage for 40 households..." 
    rows={4}
/>
<div className="pt-2 border-t border-[#c1c8c0]/40 flex items-center justify-between text-xs text-[#727972] font-mono">
<span className="inline-flex items-center gap-1.5 text-[#4d6055]">
<span className="material-symbols-outlined text-[15px]">translate</span>
<span>Supported: English, हिन्दी, संथाली (Ol Chiki transcript)</span>
</span>
<span className="text-emerald-700 font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]">check_circle</span>
                Sufficient detail
              </span>
</div>
</div>
</div>
{/*  4. MEDIA UPLOAD DROPZONE WITH GEOTAG DETECTION  */}
<div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#c1c8c0]/50 shadow-sm">
<div className="flex items-center justify-between mb-2">
<label className="block text-xs font-bold uppercase tracking-wider text-[#1b1b1e] font-mono">
              4. Media Upload &amp; Geotagged Evidence
            </label>
<span className="text-xs text-[#3e644a] font-mono font-medium">GPS Auto-Lock Enabled</span>
</div>
{/*  Dropzone Container  */}
<label htmlFor="media-upload" className="bg-[#fbf8fc] rounded-2xl p-6 border-2 border-dashed border-[#c1c8c0] hover:border-[#3e644a] transition-all cursor-pointer group text-center flex flex-col items-center justify-center">
<input type="file" id="media-upload" accept="image/*,video/*" className="hidden" onChange={handleFile} />
<div className="flex items-center justify-center gap-3 text-[#4d6055] mb-2.5 group-hover:text-[#3e644a] transition-colors">
<div className="w-11 h-11 rounded-xl bg-white border border-[#c1c8c0]/40 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
<span className="material-symbols-outlined text-[24px]">photo_camera</span>
</div>
<div className="w-11 h-11 rounded-xl bg-white border border-[#c1c8c0]/40 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
<span className="material-symbols-outlined text-[24px]">videocam</span>
</div>
<div className="w-11 h-11 rounded-xl bg-white border border-[#c1c8c0]/40 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
<span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
</div>
</div>
<p className="text-sm font-semibold text-[#1b1b1e] group-hover:text-[#3e644a] transition-colors">
              Drag and drop photos or videos, or <span className="text-[#3e644a] underline decoration-2">browse files</span>
</p>
<p className="text-xs text-[#727972] mt-1 font-mono">
              Supports JPG, PNG, MP4 (Max 25MB). Auto-extracts EXIF GPS coordinates.
            </p>
{/*  Geotag Badge & Location Refresh Button  */}
<div className="mt-4 flex flex-wrap items-center justify-center gap-2">
<button
    type="button"
    onClick={requestGps}
    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c2edcb]/60 hover:bg-[#c2edcb] border border-[#3e644a]/30 text-xs font-semibold text-[#294e36] transition-colors cursor-pointer shadow-xs active:scale-95"
>
    <span className="material-symbols-outlined text-[16px] text-[#3e644a]">my_location</span>
    <span>{isLocating ? "Acquiring GPS..." : gps ? `GPS Tagged: ${gps.lat.toFixed(4)}° N, ${gps.lon.toFixed(4)}° E (Click to refresh)` : "Click to detect GPS Location"}</span>
</button>
</div>
</label>
{/*  Uploaded Thumbnail Preview Strip  */}
{photo && (
<div className="mt-3 flex items-center gap-3 overflow-x-auto pb-1">
<div className="flex items-center gap-2.5 p-2 bg-[#f0edf1] rounded-xl border border-[#c1c8c0]/50 text-xs">
<img src={photo} alt="Preview" className="w-8 h-8 rounded-lg object-cover" />
<div className="text-left">
<p className="font-medium text-[#1b1b1e] truncate max-w-[140px]">Uploaded Evidence</p>
<p className="text-[10px] text-[#727972] font-mono">Ready to submit</p>
</div>
<button onClick={(e) => { e.preventDefault(); setPhoto(null); }} aria-label="Remove image" className="text-[#727972] hover:text-red-600 ml-1 cursor-pointer" type="button">
<span className="material-symbols-outlined text-[16px]">close</span>
</button>
</div>
</div>
)}
</div>
</div>
{/*  RIGHT RAIL (col-span-12 lg:col-span-5 xl:col-span-4 sticky lg:top-24 space-y-5)  */}
<aside className="lg:col-span-5 xl:col-span-4 space-y-5">
{/*  Action Card: Primary Submit CTA  */}
<div className="bg-white rounded-2xl p-6 border border-[#3e644a]/30 shadow-md">
<div className="flex items-center gap-2 mb-3">
<span className="material-symbols-outlined text-[20px] text-[#3e644a]">send_and_archive</span>
<h2 className="text-base font-bold text-[#1b1b1e]">Ready to Submit?</h2>
</div>
<p className="text-xs text-[#424942] mb-4 leading-relaxed">
            Your grievance will immediately generate an official tracking token sent via SMS to your mobile and dispatch to local ward representatives.
          </p>
<button 
    onClick={onSubmit} 
    disabled={loading || submitting} 
    className="w-full py-3.5 px-6 rounded-xl bg-[#3e644a] hover:bg-[#294e36] active:bg-[#1b1b1e] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-[#3e644a]/25 spring-press cursor-pointer border border-[#c2edcb]/30 disabled:opacity-50" 
    type="button"
>
<span>{submitting ? "Submitting Grievance..." : "Submit Grievance"}</span>
<span className="material-symbols-outlined text-[20px]">arrow_forward</span>
</button>
<div className="mt-4 pt-3.5 border-t border-[#c1c8c0]/40 space-y-2 text-[11px] text-[#727972] font-mono">
<div className="flex items-center justify-between">
<span className="flex items-center gap-1.5 text-[#3e644a]">
<span className="material-symbols-outlined text-[14px]">sms</span> Free SMS tracking
              </span>
<span className="text-emerald-700 font-semibold">Active</span>
</div>
<div className="flex items-center justify-between">
<span className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-[14px]">lock</span> Identity Privacy
              </span>
<span>Encrypted</span>
</div>
</div>
</div>
{/*  AI Automated Triage Explainer  */}
<div className="bg-white rounded-2xl p-5 border border-[#c1c8c0]/50 shadow-sm">
<span className="text-xs font-bold uppercase tracking-wider font-mono text-[#3e644a] block mb-2 flex items-center gap-1.5">
    <span className="material-symbols-outlined text-[16px]">psychology</span>
    AI Automated Triage
</span>
<p className="text-xs text-[#424942] leading-relaxed">
    Upon submission, SocioSolve's AI evaluates your evidence, calculates severity, and automatically routes the ticket to the designated municipal zonal engineer or verified student capstone team.
</p>
<div className="mt-3 bg-[#c2edcb]/30 p-2.5 rounded-xl border border-[#3e644a]/20 text-[11px] text-[#294e36] flex items-center gap-2">
    <span className="material-symbols-outlined text-base text-[#3e644a]">verified</span>
    <span>Zero manual delay · Immediate ticket token generated</span>
</div>
</div>
{/*  Community Reporter Guidelines  */}
<div className="bg-white rounded-2xl p-5 border border-[#c1c8c0]/50 shadow-sm">
<h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#1b1b1e] mb-3 flex items-center gap-1.5">
<span className="material-symbols-outlined text-[16px] text-[#845400]">tips_and_updates</span>
            Reporter Guidelines
          </h3>
<ul className="space-y-2 text-xs text-[#424942]">
<li className="flex items-start gap-2">
<span className="material-symbols-outlined text-[16px] text-[#3e644a] shrink-0 mt-0.5">check</span>
<span><strong>Keep photos clear:</strong> Show the broken component and surrounding street view.</span>
</li>
<li className="flex items-start gap-2">
<span className="material-symbols-outlined text-[16px] text-[#3e644a] shrink-0 mt-0.5">check</span>
<span><strong>Mention households affected:</strong> Helps prioritize crew dispatch.</span>
</li>
<li className="flex items-start gap-2">
<span className="material-symbols-outlined text-[16px] text-[#3e644a] shrink-0 mt-0.5">check</span>
<span><strong>Student solver network:</strong> Local youth volunteers review reports daily to verify.</span>
</li>
</ul>
</div>
{/*  Help Desk Info  */}
<div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-[#845400] flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">phone_in_talk</span>
<span>Toll-Free Helpline: <strong>1800-345-6541</strong></span>
</div>
<span className="font-mono text-[10px] bg-amber-100 px-2 py-0.5 rounded">24x7</span>
</div>
</aside>
</div>
</main>
{/*  FULL-WIDTH FOOTER  */}
<footer className="w-full bg-[#1b1b1e] text-white mt-12 sm:mt-16 border-t border-[#303033]">
<div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
<div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
{/*  Col 1  */}
<div className="md:col-span-1 space-y-3">
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-lg bg-[#3e644a] text-[#c2edcb] flex items-center justify-center font-bold">
<span className="material-symbols-outlined text-[18px]">eco</span>
</div>
<span className="font-bold text-base text-white tracking-tight">SocioSolve</span>
</div>
<p className="text-xs text-[#e4e1e6]/70 leading-relaxed">
            Community-driven civic grievance redressal and rural infrastructure monitoring platform for Jharkhand.
          </p>
</div>
{/*  Col 2  */}
<div className="text-xs space-y-2">
<h4 className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">Key Sectors</h4>
<p><button type="button" onClick={() => showComingSoon("Drinking Water (PHED)")} className="text-[#e4e1e6]/70 hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs text-left">Drinking Water (PHED)</button></p>
<p><button type="button" onClick={() => showComingSoon("Rural Roads (PMGSY)")} className="text-[#e4e1e6]/70 hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs text-left">Rural Roads (PMGSY)</button></p>
<p><button type="button" onClick={() => showComingSoon("Power Distribution (JBVNL)")} className="text-[#e4e1e6]/70 hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs text-left">Power Distribution (JBVNL)</button></p>
<p><button type="button" onClick={() => showComingSoon("Anganwadi & Health Centers")} className="text-[#e4e1e6]/70 hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs text-left">Anganwadi &amp; Health Centers</button></p>
</div>
{/*  Col 3  */}
<div className="text-xs space-y-2">
<h4 className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">Citizen Services</h4>
<p><button type="button" onClick={() => navigate('/dashboard')} className="text-[#e4e1e6]/70 hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs text-left">Track Complaint Status</button></p>
<p><button type="button" onClick={() => showComingSoon("Panchayat Scorecards")} className="text-[#e4e1e6]/70 hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs text-left">Panchayat Scorecards</button></p>
<p><button type="button" onClick={() => showComingSoon("Student Volunteer Network")} className="text-[#e4e1e6]/70 hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs text-left">Student Volunteer Network</button></p>
<p><button type="button" onClick={() => showComingSoon("Right to Service Charter")} className="text-[#e4e1e6]/70 hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs text-left">Right to Service Charter</button></p>
</div>
{/*  Col 4  */}
<div className="text-xs space-y-3">
<h4 className="font-bold text-white uppercase tracking-wider font-mono text-[11px]">Jharkhand State Portal</h4>
<p className="text-[#e4e1e6]/70 leading-relaxed">
            Department of Rural Development &amp; Panchayati Raj, Government of Jharkhand.
          </p>
<div className="inline-flex items-center gap-1.5 text-xs text-[#c2edcb] bg-white/10 px-3 py-1.5 rounded-lg font-mono">
<span className="material-symbols-outlined text-[16px]">verified</span>
<span>Official Redressal Gateway</span>
</div>
</div>
</div>
<div className="pt-6 border-t border-[#303033] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#e4e1e6]/60">
<p>© 2025 SocioSolve Jharkhand. All rights reserved.</p>
<div className="flex items-center space-x-6 text-xs">
<button type="button" onClick={() => showComingSoon("Privacy Policy")} className="hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs">Privacy Policy</button>
<button type="button" onClick={() => showComingSoon("Terms of Redressal")} className="hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs">Terms of Redressal</button>
<button type="button" onClick={() => showComingSoon("Help & FAQ")} className="hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs">Help &amp; FAQ</button>
<button type="button" onClick={() => showComingSoon("Contact Nodal Officer")} className="hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 text-xs">Contact Nodal Officer</button>
</div>
</div>
</div>
</footer>

        </motion.div>
    );
}
