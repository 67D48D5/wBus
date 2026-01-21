// src/shared/ui/MarqueeText.tsx

import React from "react";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface MarqueeProps {
    /** The text content to display */
    text: string;
    /** The maximum length of text before triggering the marquee effect. Defaults to 12. */
    maxLength?: number;
    /** Optional custom classes for the text styling */
    className?: string;
    /** Animation duration in seconds. Defaults to 6s. */
    duration?: number;
}

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------

const PopupMarquee = ({
    text,
    maxLength = 12,
    className = "",
    duration = 6
}: MarqueeProps) => {
    const shouldMarquee = text.length > maxLength;

    // 1. Static State: Render simple text if it fits within the limit
    if (!shouldMarquee) {
        return (
            <span className={`whitespace-nowrap block ${className}`}>
                {text}
            </span>
        );
    }

    // 2. Marquee State: Render the scrolling animation
    return (
        <div className="popup-marquee-container overflow-hidden w-full relative">
            {/* Injected styles for the animation keyframes.
              Note: In a larger project, this should be moved to tailwind.config.js 
              or a global CSS file.
            */}
            <style jsx>{`
                @keyframes infinite-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-infinite-scroll {
                    animation: infinite-scroll ${duration}s linear infinite;
                    display: flex;
                    width: max-content;
                }
                /* Optional: Pause animation on hover for better readability */
                .popup-marquee-container:hover .animate-infinite-scroll {
                    animation-play-state: paused;
                }
            `}</style>

            <div className="animate-infinite-scroll flex-nowrap">
                {/* Primary Text */}
                <span className={`pr-6 whitespace-nowrap shrink-0 ${className}`}>
                    {text}
                </span>

                {/* Duplicate Text for seamless looping (Hidden from screen readers) */}
                <span
                    aria-hidden="true"
                    className={`pr-6 whitespace-nowrap shrink-0 ${className}`}
                >
                    {text}
                </span>
            </div>
        </div>
    );
};

export default PopupMarquee;
