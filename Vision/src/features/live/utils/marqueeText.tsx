// src/features/live/utils/marqueeText.ts

import React from "react";

// Marquee Component
const PopupMarquee = ({ text, maxLength = 12 }: { text: string; maxLength?: number }) => {
    const shouldMarquee = text.length > maxLength;

    if (!shouldMarquee) {
        return <span className="whitespace-nowrap"> {text} </span>;
    }

    return (
        <div className="popup-marquee-container overflow-hidden w-full relative" >
            <div className="popup-marquee-wrapper w-max" >
                <span className="pr-4"> {text} </span>
            </div>
        </div>
    );
};

export default PopupMarquee;
