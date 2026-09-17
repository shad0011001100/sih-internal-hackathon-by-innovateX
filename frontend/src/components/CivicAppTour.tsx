import React, { useState, useEffect, useCallback } from "react";

export interface TourStep {
    id: string;
    targetSelector: string;
    stepNumber: number;
    totalSteps: number;
    badge: string;
    title: string;
    description: string;
    icon: string;
    actionLabel: string;
}

const getVisibleElement = (selector: string): HTMLElement | null => {
    const elements = document.querySelectorAll<HTMLElement>(selector);
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && window.getComputedStyle(el).display !== "none" && window.getComputedStyle(el).visibility !== "hidden") {
            return el;
        }
    }
    return elements[0] || null;
};

const getTourSteps = (lang: "EN" | "HI"): TourStep[] => [
    {
        id: "report",
        targetSelector: '[data-tour="mobile-report-btn"], [data-tour="report-btn"]',
        stepNumber: 1,
        totalSteps: 3,
        badge: lang === "HI" ? "1. समस्या दर्ज करें" : "1. FILE A GRIEVANCE",
        title: lang === "HI" ? "कोई समस्या देखी? यहाँ रिपोर्ट करें" : "Spot a problem? Report it here",
        description: lang === "HI" 
            ? "सड़क के गड्ढे, कचरा या पानी लीकेज की फोटो लें। GPS स्वचालित रूप से आपका सटीक वार्ड जोड़ देगा।"
            : "Tap this button to snap a photo of potholes, water leaks, or garbage. GPS automatically tags your exact ward location.",
        icon: "add_a_photo",
        actionLabel: lang === "HI" ? "आगे: जनसमर्थन फ़ीड →" : "Next: Community Feed →"
    },
    {
        id: "endorse",
        targetSelector: '[data-tour="endorse-btn"]',
        stepNumber: 2,
        totalSteps: 3,
        badge: lang === "HI" ? "2. सामुदायिक समर्थन" : "2. COMMUNITY ACTION",
        title: lang === "HI" ? "त्वरित समाधान के लिए समर्थन दें" : "Upvote to speed up repairs",
        description: lang === "HI"
            ? "अपने वार्ड की शिकायतें देखें। 'समर्थन' दबाएं ताकि नगर निगम इसे प्राथमिकता सूची में सबसे ऊपर ले सके।"
            : "Browse neighbor reports in your ward. Tap 'Support' on any issue to push it higher on the municipal priority schedule.",
        icon: "thumb_up",
        actionLabel: lang === "HI" ? "आगे: शिकायत ट्रैक करें →" : "Next: Track Complaints →"
    },
    {
        id: "my-reports",
        targetSelector: '[data-tour="my-reports-tab"]',
        stepNumber: 3,
        totalSteps: 3,
        badge: lang === "HI" ? "3. निवारण ट्रैकिंग" : "3. RESOLUTION TRACKING",
        title: lang === "HI" ? "समाधान होने तक लाइव ट्रैक करें" : "Follow your issue live to completion",
        description: lang === "HI"
            ? "'मेरी शिकायतें' में देखें कि आपकी रिपोर्ट AI वर्गीकरण से लेकर कॉलेज प्रोटोटाइप और अंतिम सुधार तक कैसे पहुँचती है।"
            : "Switch to 'My Complaints' to watch your grievance move through 5 stages — from AI triage to university lab prototype to verified fix.",
        icon: "task_alt",
        actionLabel: lang === "HI" ? "🎉 समझ गए • शुरू करें" : "🎉 Got It • Start Exploring"
    }
];

interface CivicAppTourProps {
    isOpen: boolean;
    onClose: () => void;
    lang?: "EN" | "HI";
}

export const CivicAppTour: React.FC<CivicAppTourProps> = ({ isOpen, onClose, lang = "EN" }) => {
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const steps = getTourSteps(lang);
    const step = steps[currentStepIdx] || steps[0];

    const updateRect = useCallback(() => {
        if (!isOpen || !step) return;
        const el = getVisibleElement(step.targetSelector);
        if (el) {
            const r = el.getBoundingClientRect();
            setTargetRect(r);
        } else {
            setTargetRect(null);
        }
    }, [isOpen, step]);

    useEffect(() => {
        if (!isOpen) return;

        const el = getVisibleElement(step.targetSelector);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(updateRect, 300);
        } else {
            setTargetRect(null);
        }

        const handleResize = () => updateRect();
        const handleScroll = () => updateRect();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, currentStepIdx, step, updateRect]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStepIdx < steps.length - 1) {
            setCurrentStepIdx(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStepIdx > 0) {
            setCurrentStepIdx(prev => prev - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[9990] animate-fade-in" aria-modal="true" role="dialog">
            {/* SVG Mask for Dark Backdrop & Spotlight Cutout */}
            <svg 
                className="fixed inset-0 w-full h-full pointer-events-auto"
                onClick={onClose}
                style={{ width: "100vw", height: "100vh" }}
            >
                <defs>
                    <mask id="civic-spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {targetRect && (
                            <rect
                                x={targetRect.left - 6}
                                y={targetRect.top - 6}
                                width={targetRect.width + 12}
                                height={targetRect.height + 12}
                                rx="16"
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(10, 20, 14, 0.65)"
                    mask="url(#civic-spotlight-mask)"
                />
            </svg>

            {/* Glowing Ring Around Target Element */}
            {targetRect && (
                <div
                    style={{
                        position: "fixed",
                        top: targetRect.top - 6,
                        left: targetRect.left - 6,
                        width: targetRect.width + 12,
                        height: targetRect.height + 12,
                        borderRadius: "16px",
                        pointerEvents: "none",
                        zIndex: 9995
                    }}
                    className="ring-4 ring-primary ring-offset-2 ring-offset-transparent shadow-[0_0_30px_rgba(41,78,54,0.7)] animate-pulse transition-all duration-300"
                />
            )}

            {/* Mobile Bottom Sheet / Coachmark Card (Pinned to bottom for comfortable thumb reach) */}
            <div 
                className="fixed bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 max-w-sm sm:max-w-md w-full z-[9999] pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-2xl border border-primary/30 backdrop-blur-lg space-y-3.5">
                    {/* Header Row: Badge, Step Indicator, Close Button */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center text-xs shadow-xs">
                                <span className="material-symbols-outlined text-sm">{step.icon}</span>
                            </span>
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
                                {step.badge}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-on-surface-variant">
                                {step.stepNumber} of {step.totalSteps}
                            </span>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Skip tour"
                                className="w-6 h-6 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center cursor-pointer transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Step Title & 1-Sentence Description */}
                    <div>
                        <h4 className="font-bold text-base sm:text-lg text-on-surface leading-snug">
                            {step.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                            {step.description}
                        </p>
                    </div>

                    {/* Progress Indicator Dots */}
                    <div className="flex items-center gap-1.5 pt-1">
                        {steps.map((s, idx) => (
                            <div
                                key={s.id}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    idx === currentStepIdx 
                                        ? "w-6 bg-primary" 
                                        : idx < currentStepIdx 
                                        ? "w-2 bg-primary/40" 
                                        : "w-2 bg-surface-container-highest"
                                }`}
                            />
                        ))}
                    </div>

                    {/* Action Navigation Buttons */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-outline-variant/30">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-xs text-on-surface-variant hover:text-on-surface font-semibold px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                            {lang === "HI" ? "छोड़ें (Skip)" : "Skip Tour"}
                        </button>

                        <div className="flex items-center gap-2">
                            {currentStepIdx > 0 && (
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors cursor-pointer"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md shadow-primary/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                            >
                                <span>{step.actionLabel}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
