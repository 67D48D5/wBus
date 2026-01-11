// src/app/[id]/page.tsx

import { UI_TEXT, FOOTER } from '@core/config/locale';

import TimetableView from '@schedule/components/TimetableView';
import { getAllRouteIds, getRouteData } from '@schedule/api/getScheduleData';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bus, ArrowLeft } from 'lucide-react';

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
        description: `${data.routeName} ${UI_TEXT.TIMETABLE_SUFFIX} - ${data.description}`,
    };
}

export default async function RoutePage({ params }: Props) {
    const { id } = await params;
    const data = await getRouteData(id);

    if (!data) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <div className="max-w-lg mx-auto flex flex-col min-h-screen">
                {/* Header */}
                <header className="sticky top-0 z-10 bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
                    <div className="px-5 py-4">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group mb-3"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            <span>{UI_TEXT.BACK_TO_HOME}</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                                <Bus className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                    {data.routeName}
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{data.description}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-grow px-4 py-5 animate-fade-in">
                    <TimetableView data={data} />
                </main>

                {/* Footer */}
                <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="px-5 py-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{FOOTER.COPYRIGHT}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{FOOTER.DESCRIPTION}</p>
                            <div className="flex items-center gap-4">
                                {FOOTER.LINKS.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.href}
                                        className="text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs">{FOOTER.DISCLAIMER}</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}