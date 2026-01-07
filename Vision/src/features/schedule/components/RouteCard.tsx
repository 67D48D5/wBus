// src/features/schedule/components/RouteCard.tsx

import Link from 'next/link';

import { memo } from 'react';
import { Bus } from 'lucide-react';

import NextBusTime from './NextBusTime';

import { BusData } from '@schedule/models/schedule';

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
            className="block p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 active:scale-[0.98] transition-all duration-200 group"
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                    <Bus className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {routeName}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {busData && <NextBusTime data={busData} />}
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors duration-200">
                        <span className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all duration-200">→</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default memo(RouteCard);

