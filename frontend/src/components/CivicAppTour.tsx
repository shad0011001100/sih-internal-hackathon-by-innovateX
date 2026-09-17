import React, { useState, useEffect, useCallback } from "react";

export interface TourStep {
    id: string;
    targetSelector: string;
    stepNumber: number;
    totalSteps: number;
    title: string;
    description: string;
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
        id: "report",
        targetSelector: '[data-tour="mobile-report-btn"], [data-tour="report-btn"]',
        stepNumber: 1,
        totalSteps: 4,
        title: lang === "HI" ? "1. समस्या दर्ज करें" : "1. Snap & Report",
        description: lang === "HI" 
            ? "सड़क, पानी या कचरे की फोटो लेने के लिए '+' दबाएं। GPS आपका वार्ड जोड़ देगा।"
            : "Tap '+' anytime to take a photo of potholes or trash. GPS tags your ward automatically.",
        actionLabel: lang === "HI" ? "आगे →" : "Next →"
    },
    {
        id: "innovation-loop",
        targetSelector: '[data-tour="innovation-loop"]',
        stepNumber: 2,
        totalSteps: 4,
        title: lang === "HI" ? "2. समाधान प्रक्रिया" : "2. How It Gets Fixed",
        description: lang === "HI"
            ? "AI प्राथमिकता तय करता है और कॉलेज छात्र इंजीनियर ज़मीन पर समाधान करवाते हैं।"
            : "AI checks urgency and college student engineering teams resolve it on the ground.",
        actionLabel: lang === "HI" ? "आगे →" : "Next →"
    },
    {
        id: "endorse",
        targetSelector: '[data-tour="endorse-btn"], [data-tour="community-feed-tab"]',
        stepNumber: 3,
        totalSteps: 4,
        title: lang === "HI" ? "3. समर्थन (Upvote)" : "3. Community Upvotes",
        description: lang === "HI"
            ? "पड़ोसियों की रिपोर्ट को समर्थन दें ताकि नगर निगम इसे प्राथमिकता में ऊपर ले।"
            : "Tap 'Supports' on neighbor complaints to push them higher on the municipal priority list.",
        actionLabel: lang === "HI" ? "आगे →" : "Next →"
    },
    {
        id: "my-reports",
        targetSelector: '[data-tour="my-reports-tab"]',
        stepNumber: 4,
        totalSteps: 4,
        title: lang === "HI" ? "4. लाइव ट्रैकिंग" : "4. Live Progress Tracking",
        description: lang === "HI"
            ? "'मेरी शिकायतें' में अपनी रिपोर्ट को समाधान होने तक 5 चरणों में ट्रैक करें।"
            : "Switch to 'My Complaints' to track your report from AI triage to verified completion.",
        actionLabel: lang === "HI" ? "शुरू करें ✓" : "Got It ✓"
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

        const trackPosition = () => {
            updateRect();
            if (performance.now() - startTime < 850) {
                rafId = requestAnimationFrame(trackPosition);
            }
        };

        if (step.targetSelector) {
            const el = getVisibleElement(step.targetSelector);
            if (el) {
                scrollToTarget(el);
                rafId = requestAnimationFrame(trackPosition);
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

    // Calculate smart positioning
    const isTargetInLowerHalf = targetRect ? (targetRect.top + targetRect.height / 2 > window.innerHeight / 2) : false;

    // Strictly clamp ring dimensions to prevent horizontal overflow on mobile
    const ringLeft = targetRect ? Math.max(4, targetRect.left - 4) : 0;
    const ringTop = targetRect ? Math.max(4, targetRect.top - 4) : 0;
    const ringWidth = targetRect ? Math.min(window.innerWidth - ringLeft - 8, targetRect.width + 8) : 0;
    const ringHeight = targetRect ? targetRect.height + 8 : 0;

    return (
        <div className="fixed inset-0 z-[9990] overflow-hidden select-none" aria-modal="true" role="dialog">
            {/* SVG Mask for Minimalist Backdrop */}
            <svg 
                className="fixed inset-0 w-full h-full pointer-events-auto"
                onClick={onClose}
            >
                <defs>
                    <mask id="civic-spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {targetRect && (
                            <rect
                                x={ringLeft}
                                y={ringTop}
                                width={ringWidth}
                                height={ringHeight}
                                rx="14"
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
                    fill="rgba(0, 0, 0, 0.55)"
                    mask={targetRect ? "url(#civic-spotlight-mask)" : undefined}
                />
            </svg>

            {/* Clean Focus Ring with Clamped Dimensions */}
            {targetRect && (
                <div
                    style={{
                        position: "fixed",
                        top: ringTop,
                        left: ringLeft,
                        width: ringWidth,
                        height: ringHeight,
                        borderRadius: "14px",
                        pointerEvents: "none",
                        zIndex: 9995
                    }}
                    className="ring-2 ring-primary ring-offset-2 ring-offset-transparent shadow-sm transition-all duration-300"
                />
            )}

            {/* Minimalist Floating Card */}
            <div 
                className={`fixed inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 max-w-[340px] sm:max-w-sm w-full z-[9999] pointer-events-auto transition-all duration-300 ${
                    !targetRect 
                        ? "top-1/2 -translate-y-1/2" 
                        : isTargetInLowerHalf 
                        ? "top-4 sm:top-6" 
                        : "bottom-4 sm:bottom-6"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-surface-container-lowest/95 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-outline-variant/30 space-y-2.5">
                    {/* Header Row: Step Pill + Title + Close Button */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold font-mono shrink-0">
                                {step.stepNumber} / {step.totalSteps}
                            </span>
                            <h4 className="font-bold text-xs sm:text-sm text-on-surface truncate">
                                {step.title}
                            </h4>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close guide"
                            className="w-6 h-6 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    {/* 1 Short, Crisp Sentence */}
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                        {step.description}
                    </p>

                    {/* Bottom Row: Progress Dots + Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20">
                        <div className="flex items-center gap-1">
                            {steps.map((s, idx) => (
                                <div
                                    key={s.id}
                                    className={`h-1.5 rounded-full transition-all ${
                                        idx === currentStepIdx 
                                            ? "w-4 bg-primary" 
                                            : "w-1.5 bg-outline-variant/40"
                                    }`}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                            {currentStepIdx > 0 && (
                                <button
                                    type="button"
                                    onClick={handlePrev}
                                    className="px-2.5 py-1 rounded-lg text-xs text-on-surface-variant hover:text-on-surface font-medium cursor-pointer"
                                >
                                    {lang === "HI" ? "पीछे" : "Back"}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
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
