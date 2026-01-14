// src/features/live/components/BusListItem.tsx

import React from "react";

import { UI_TEXT, SCHEDULE_MESSAGES } from "@core/config/locale";

import { getDirectionIcon } from "@live/utils/directionIcons";

type BusListItemProps = {
    bus: any; // @TODO: Replace with proper BusItem type
    routeName: string;
    getDirection: (nodeId: string, nodeOrd: number, routeId: string) => any;
    onClick: (lat: number, lng: number) => void;
};

export const BusListItem = React.memo(({ bus, routeName, getDirection, onClick }: BusListItemProps) => {
    const direction = bus.nodeid && bus.nodeord !== undefined
        ? getDirection(bus.nodeid, bus.nodeord, bus.routeid)
        : null;

    const DirectionIcon = getDirectionIcon(direction);
    const stopName = bus.nodenm || UI_TEXT.NO_BUSES_SYMBOL;

    return (
        <li>
            <button
                type="button"
                className="flex w-full justify-between items-center py-2 px-2 sm:py-3 sm:px-3 cursor-pointer bg-gradient-to-r from-gray-50 to-blue-50/50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 rounded-lg sm:rounded-xl group border border-transparent hover:border-blue-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] text-left"
                onClick={() => onClick(bus.gpslati, bus.gpslong)}
                aria-label={`${bus.vehicleno} ${UI_TEXT.CURRENT_LOCATION} ${stopName}`}
            >
                {/* Left: Vehicle number and route information */}
                <div className="flex flex-col gap-0.5 sm:gap-1">
                    <span className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-blue-700 transition-colors">
                        {bus.vehicleno}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 inline-block w-fit shadow-sm">
                        {routeName}{SCHEDULE_MESSAGES.ROUTE_SUFFIX}
                    </span>
                </div>

                {/* Right: Stop name and direction icon */}
                <div className="flex items-center gap-1 text-gray-600 group-hover:text-gray-900 text-[10px] sm:text-xs text-right max-w-[100px] sm:max-w-[130px] font-medium transition-colors">
                    <span className="truncate" title={stopName}>
                        {stopName}
                    </span>
                    <DirectionIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" aria-hidden="true" />
                </div>
            </button>
        </li>
    );
});

BusListItem.displayName = 'BusListItem';
