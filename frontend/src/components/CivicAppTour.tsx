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
    if (!selector) return null;
    const selectors = selector.split(",").map(s => s.trim());
    for (const sel of selectors) {
        const elements = document.querySelectorAll<HTMLElement>(sel);
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0 && window.getComputedStyle(el).display !== "none" && window.getComputedStyle(el).visibility !== "hidden") {
                return el;
            }
        }
    }
    return null;
};

const getTourSteps = (lang: "EN" | "HI"): TourStep[] => [
    {
        id: "intro",
        targetSelector: "",
        stepNumber: 1,
        totalSteps: 8,
        badge: lang === "HI" ? "शुरुआत करें • आसान गाइड" : "GET STARTED • QUICK GUIDE",
        title: lang === "HI" ? "समझ नहीं आ रहा क्या करें? यहाँ से शुरू करें!" : "Don't know what to do? Start here!",
        description: lang === "HI"
            ? "सोशियोसॉल्व आपके वार्ड की समस्याओं (सड़क के गड्ढे, कचरा, पानी लीकेज) को सीधे नगर निगम और कॉलेज इंजीनियरिंग टीमों से ठीक करवाता है।"
            : "SocioSolve connects your neighborhood problems (potholes, garbage, water leaks) directly to municipal teams and college engineering solvers.",
        icon: "waving_hand",
        actionLabel: lang === "HI" ? "आगे: प्रक्रिया देखें →" : "Show Me How It Works →"
    },
    {
        id: "innovation-loop",
        targetSelector: '[data-tour="innovation-loop"]',
        stepNumber: 2,
        totalSteps: 8,
        badge: lang === "HI" ? "समाधान प्रक्रिया" : "PROBLEM RESOLUTION",
        title: lang === "HI" ? "ऐसे हल होगी आपकी समस्या" : "This is how your problem will be resolved",
        description: lang === "HI"
            ? "1. फोटो लें → 2. AI प्राथमिकता तय करेगा → 3. कॉलेज छात्र इंजीनियरिंग समाधान बनाएंगे → 4. नगर निगम ज़मीन पर काम पूरा करेगा।"
            : "1. Snap a photo with GPS → 2. AI checks urgency → 3. Student solvers design the fix → 4. Municipal workers resolve it on the ground.",
        icon: "verified",
        actionLabel: lang === "HI" ? "आगे: वार्ड की उपलब्धियां →" : "Next: Civic Highlights →"
    },
    {
        id: "civic-highlights",
        targetSelector: '[data-tour="civic-highlights"]',
        stepNumber: 3,
        totalSteps: 8,
        badge: lang === "HI" ? "वार्ड की उपलब्धियां" : "CIVIC HIGHLIGHTS",
        title: lang === "HI" ? "देखें आपके इलाके में क्या ठीक हुआ" : "See what got fixed in your ward",
        description: lang === "HI"
            ? "हर दिन ठीक हुए गड्ढों, साफ़ पानी की लाइनों और चालू स्ट्रीटलाइट्स की लाइव स्टोरीज़ देखें। नागरिकों ने इन्हें सराहा है!"
            : "Tap these highlight circles to see daily milestones in your area — like repaved roads in Harmu or restored clean water in Doranda.",
        icon: "auto_awesome",
        actionLabel: lang === "HI" ? "आगे: समस्या रिपोर्ट करें →" : "Next: Report a Problem →"
    },
    {
        id: "report",
        targetSelector: '[data-tour="mobile-report-btn"], [data-tour="report-btn"]',
        stepNumber: 4,
        totalSteps: 8,
        badge: lang === "HI" ? "1. समस्या दर्ज करें" : "1. FILE A COMPLAINT",
        title: lang === "HI" ? "समस्या देखी? यहाँ रिपोर्ट करें" : "Spot a problem? Click here to report",
        description: lang === "HI" 
            ? "सड़क के गड्ढे, कचरे या पानी लीकेज की फोटो लेने के लिए इस '+' बटन को दबाएं। GPS अपने आप आपका सटीक वार्ड जोड़ देगा।"
            : "Whenever you spot an issue, tap this '+' button to take a photo. GPS automatically tags your exact ward location.",
        icon: "add_a_photo",
        actionLabel: lang === "HI" ? "आगे: वार्ड अनुसार खोजें →" : "Next: Search & Filters →"
    },
    {
        id: "search-and-filters",
        targetSelector: '[data-tour="search-and-filters"]',
        stepNumber: 5,
        totalSteps: 8,
        badge: lang === "HI" ? "2. खोज और फ़िल्टर" : "2. SEARCH & FILTERS",
        title: lang === "HI" ? "अपने वार्ड की शिकायतें खोजें" : "Search & filter complaints in your ward",
        description: lang === "HI"
            ? "अपनी कॉलोनी का नाम टाइप करें, या सड़क, पानी, कचरा और बिजली जैसी श्रेणियों के अनुसार फ़िल्टर करके देखें।"
            : "Search by locality or handpump, or filter by categories like Roads, Water, Sanitation, and Electricity.",
        icon: "tune",
        actionLabel: lang === "HI" ? "आगे: जनसमर्थन दें →" : "Next: Upvote & Support →"
    },
    {
        id: "endorse",
        targetSelector: '[data-tour="endorse-btn"], [data-tour="community-feed-tab"]',
        stepNumber: 6,
        totalSteps: 8,
        badge: lang === "HI" ? "3. सामुदायिक समर्थन" : "3. COMMUNITY SUPPORT",
        title: lang === "HI" ? "समस्या को जल्दी सुलझाने के लिए समर्थन दें" : "Upvote to speed up repairs",
        description: lang === "HI"
            ? "अपने पड़ोसियों की शिकायतों पर 'समर्थन' (Upvote) दबाएं। जितने अधिक नागरिक समर्थन देंगे, नगर निगम उसे उतनी ही तेजी से हल करेगा।"
            : "Tap 'Supports' on neighbor complaints. Issues with higher community votes get pushed to the top of the municipal priority queue!",
        icon: "thumb_up",
        actionLabel: lang === "HI" ? "आगे: लाइव स्टेटस ट्रैक करें →" : "Next: Track Complaints →"
    },
    {
        id: "my-reports",
        targetSelector: '[data-tour="my-reports-tab"]',
        stepNumber: 7,
        totalSteps: 8,
        badge: lang === "HI" ? "4. लाइव ट्रैकिंग" : "4. LIVE TRACKING",
        title: lang === "HI" ? "समाधान होने तक लाइव ट्रैक करें" : "Follow your complaint live to resolution",
        description: lang === "HI"
            ? "'मेरी शिकायतें' टैब में देखें कि आपकी रिपोर्ट AI वर्गीकरण से लेकर कॉलेज प्रोटोटाइप और अंतिम सुधार तक कैसे पहुँचती है।"
            : "Switch to 'My Complaints' to watch your grievance move through 5 stages — from AI triage to university lab prototype to verified on-ground fix.",
        icon: "task_alt",
        actionLabel: lang === "HI" ? "आगे: फोन हेल्पलाइन →" : "Next: Phone Hotline →"
    },
    {
        id: "voice-hotline",
        targetSelector: '[data-tour="voice-hotline"], [data-tour="mobile-helpline-tab"]',
        stepNumber: 8,
        totalSteps: 8,
        badge: lang === "HI" ? "5. फोन हेल्पलाइन" : "5. PHONE HOTLINE",
        title: lang === "HI" ? "लिख नहीं सकते? 5 भाषाओं में कॉल करें" : "Can't type? Report via phone in 5 languages",
        description: lang === "HI"
            ? "1800-JH-VOICE पर मुफ्त कॉल करें। संताली, हो, कुडुख, मुंडारी या हिन्दी में अपनी समस्या बताएं और ऑपरेटर आपकी शिकायत दर्ज करेगा।"
            : "Call 1800-JH-VOICE toll-free to report in Hindi, Santali, Ho, Kurukh, or Mundari. An official operator will register it for you.",
        icon: "record_voice_over",
        actionLabel: lang === "HI" ? "🎉 समझ गए • ऐप शुरू करें" : "🎉 Got It • Start Exploring"
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
        if (!isOpen || !step || !step.targetSelector) {
            setTargetRect(null);
            return;
        }
        const el = getVisibleElement(step.targetSelector);
        if (el) {
            const r = el.getBoundingClientRect();
            setTargetRect(r);
        } else {
            setTargetRect(null);
        }
    }, [isOpen, step]);

    const scrollToTarget = useCallback((el: HTMLElement) => {
        const computedStyle = window.getComputedStyle(el);
        const isFixed = computedStyle.position === "fixed";
        
        if (!isFixed) {
            const rect = el.getBoundingClientRect();
            const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
            // Center the target element in the viewport comfortably
            const targetScrollY = currentScrollY + rect.top - (window.innerHeight * 0.35);
            
            window.scrollTo({
                top: Math.max(0, targetScrollY),
                behavior: "smooth"
            });
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        let rafId: number;
        const startTime = performance.now();

        // Continuously update the spotlight mask coordinates at 60fps during smooth scroll
        const followSmoothScroll = () => {
            updateRect();
            if (performance.now() - startTime < 850) {
                rafId = requestAnimationFrame(followSmoothScroll);
            }
        };

        if (step.targetSelector) {
            const el = getVisibleElement(step.targetSelector);
            if (el) {
                scrollToTarget(el);
                rafId = requestAnimationFrame(followSmoothScroll);
            } else {
                setTargetRect(null);
            }
        } else {
            setTargetRect(null);
        }

        const handleResize = () => updateRect();
        const handleScroll = () => updateRect();
        const handleTouchMove = () => updateRect();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("touchmove", handleTouchMove, { passive: true });
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, currentStepIdx, step, updateRect, scrollToTarget]);

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

    // Calculate smart positioning to prevent overlapping the spotlighted element
    const isTargetInLowerHalf = targetRect ? (targetRect.top + targetRect.height / 2 > window.innerHeight / 2) : false;
    const hasTarget = !!targetRect;

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
                                x={targetRect.left - 8}
                                y={targetRect.top - 8}
                                width={targetRect.width + 16}
                                height={targetRect.height + 16}
                                rx="18"
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
                    fill={targetRect ? "rgba(10, 20, 14, 0.70)" : "rgba(10, 20, 14, 0.82)"}
                    mask={targetRect ? "url(#civic-spotlight-mask)" : undefined}
                />
            </svg>

            {/* Glowing Ring Around Target Element */}
            {targetRect && (
                <div
                    style={{
                        position: "fixed",
                        top: targetRect.top - 8,
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        borderRadius: "18px",
                        pointerEvents: "none",
                        zIndex: 9995
                    }}
                    className="ring-4 ring-amber-400 ring-offset-2 ring-offset-transparent shadow-[0_0_35px_rgba(251,191,36,0.8)] animate-pulse transition-all duration-300"
                />
            )}

            {/* Smart Positioned Coachmark Card:
                - Center when no target (Intro welcome)
                - Top when target is in lower half (e.g. mobile FAB)
                - Bottom when target is in upper half (e.g. tabs/header)
            */}
            <div 
                className={`fixed inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 max-w-sm sm:max-w-md w-full z-[9999] pointer-events-auto transition-all duration-300 ${
                    !hasTarget 
                        ? "top-1/2 -translate-y-1/2" 
                        : isTargetInLowerHalf 
                        ? "top-4 sm:top-6" 
                        : "bottom-4 sm:bottom-6"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-amber-400/40 backdrop-blur-xl space-y-3.5">
                    {/* Directional Hint Pill when targeting */}
                    {hasTarget && (
                        <div className="flex justify-center -mt-2">
                            <span className="px-3 py-1 rounded-full bg-amber-400 text-stone-950 font-bold text-[10px] tracking-wide uppercase flex items-center gap-1 shadow-xs animate-bounce">
                                <span className="material-symbols-outlined text-xs">
                                    {isTargetInLowerHalf ? "arrow_downward" : "arrow_upward"}
                                </span>
                                <span>{isTargetInLowerHalf ? (lang === "HI" ? "नीचे हाइलाइट किया गया बटन देखें ↓" : "Look at the highlighted section below ↓") : (lang === "HI" ? "ऊपर हाइलाइट किया गया हिस्सा देखें ↑" : "Look at the highlighted section above ↑")}</span>
                            </span>
                        </div>
                    )}

                    {/* Header Row: Badge, Step Indicator, Close Button */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center text-xs font-bold shadow-xs">
                                <span className="material-symbols-outlined text-sm">{step.icon}</span>
                            </span>
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
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
                                aria-label="Close guide"
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
                        <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
                            {step.description}
                        </p>
                    </div>

                    {/* Progress Indicator Dots */}
                    <div className="flex items-center gap-1 pt-1 overflow-x-auto no-scrollbar">
                        {steps.map((s, idx) => (
                            <div
                                key={s.id}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    idx === currentStepIdx 
                                        ? "w-5 bg-amber-500" 
                                        : idx < currentStepIdx 
                                        ? "w-2 bg-amber-500/40" 
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
                            {lang === "HI" ? "समझ गया • बंद करें" : "Got It • Close"}
                        </button>

                        <div className="flex items-center gap-2">
                            {currentStepIdx > 0 && (
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors cursor-pointer"
                                >
                                    {lang === "HI" ? "पीछे" : "Back"}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold shadow-md shadow-amber-400/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
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

export const HowToUseGuide = CivicAppTour;
