// src/features/schedule/components/RouteCard.tsx

import Link from 'next/link';
import { memo } from 'react';

import NextBusTime from './NextBusTime';
import { BusData } from '@schedule/models/bus';

interface RouteCardProps {
    routeId: string;
    routeName: string;
    description: string;
    busData?: BusData;
    basePath?: string;
}

function RouteCard({ routeId, routeName, description, busData, basePath = '' }: RouteCardProps) {
    return (
        <Link
            href={`${basePath}/${routeId}`}
            className="block p-5 bg-white dark:bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 hover:-translate-y-1 transition-all duration-200 group"
        >
            <div className="flex justify-between items-center">
                <div className="flex-1">
                    <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                        {routeName}
                    </span>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
                </div>
                <div className="flex items-center gap-3">
                    {busData && <NextBusTime data={busData} />}
                    <span className="text-2xl text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200">→</span>
                </div>
            </div>
        </Link>
    );
}

export default memo(RouteCard);

