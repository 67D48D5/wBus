// src/features/live/components/BusListToggle.tsx

"use client";

import { List, X } from "lucide-react";

import { UI_TEXT } from "@core/constants/locale";

type BusListToggleProps = {
    isVisible: boolean;
    onToggle: () => void;
};

/**
 * Toggle button to show/hide the BusList component.
 * Positioned above the MyLocation button.
 */
export default function BusListToggle({ isVisible, onToggle }: BusListToggleProps) {
    return (
        <button
            onClick={onToggle}
            className="fixed bottom-24 right-6 z-30 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:via-blue-600 hover:to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:shadow-blue-400/60 transition-all duration-300 hover:scale-125 active:scale-95 border-2 border-white/30 backdrop-blur-sm drop-shadow-lg"
            title={isVisible ? UI_TEXT.HIDE_BUS_LIST : UI_TEXT.SHOW_BUS_LIST}
            aria-label={isVisible ? UI_TEXT.HIDE_BUS_LIST : UI_TEXT.SHOW_BUS_LIST}
        >
            {isVisible ? (
                <X className="w-6 h-6" />
            ) : (
                <List className="w-6 h-6" />
            )}
        </button>
    );
}
