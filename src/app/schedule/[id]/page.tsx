// src/app/route/[id]/page.tsx

import TimetableView from '@schedule/components/TimetableView';
import { getAllRouteIds, getRouteData } from '@schedule/utils/data';
import { UI_TEXT } from '@core/constants/env';

import { notFound } from 'next/navigation';
import Link from 'next/link';

import type { Metadata } from 'next';

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
    return (await getAllRouteIds()).map(id => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const data = await getRouteData(id);

    if (!data) {
        return { title: UI_TEXT.ROUTE_NOT_FOUND };
    }

    return {
        title: `${data.routeName} - ${data.description}`,
        description: `${data.routeName} ${UI_TEXT.BUS_TIMETABLE_SUFFIX} - ${data.description}`,
    };
}

export default async function RoutePage({ params }: Props) {
    const { id } = await params;
    const data = await getRouteData(id);

    if (!data) {
        return notFound();
    }

    return (
        <div className="pb-10 animate-fade-in">
            <Link
                href="/schedule"
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white/50 dark:bg-slate-800/50 backdrop-blur rounded-full border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200 group"
            >
                <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
                <span>{UI_TEXT.BACK_TO_HOME}</span>
            </Link>

            <div className="mb-8 text-center">
                <h1 className="text-3xl font-black mb-2 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {data.routeName}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{data.description}</p>
            </div>

            <TimetableView data={data} />
        </div>
    );
}