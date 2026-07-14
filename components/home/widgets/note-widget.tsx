"use client";

import React, { useState, useEffect } from "react";
import { GlassInterface } from "@/components/common/glass-interface";
import { FileText, PenLine, Plus } from "lucide-react";
import { BASE_URL } from "@/lib/baseURL";

interface NoteWidgetProps {
    onClick?: () => void;
}



export function NoteWidget({ onClick }: NoteWidgetProps) {
    const [latestNote, setLatestNote] = useState<{ title: string; content: string } | null>(null);

    useEffect(() => {
        const fetchLatestNote = async () => {
            try {
                const res = await fetch(`${BASE_URL}/cockpit/notes`, { credentials: "include" });
                if (res.ok) {
                    const notes = await res.json();
                    if (notes.length > 0) {
                        setLatestNote({ title: notes[0].title, content: notes[0].content });
                    }
                }
            } catch (e) {
                console.error("Failed to fetch notes:", e);
            }
        };
        fetchLatestNote();
    }, []);

    // Strip HTML tags for preview
    const stripHtml = (html: string) => {
        if (typeof document === "undefined") return html;
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    const previewContent = latestNote?.content ? stripHtml(latestNote.content).slice(0, 80) : "Tap to create your first note...";
    const hasNote = Boolean(latestNote);

    return (
        <GlassInterface
            contentLayout="none"
            contentClassName="relative z-10 flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden overflow-y-visible p-0"
            className="!w-[210px] !h-[210px] !rounded-[2.5rem] !p-5 relative group cursor-pointer overflow-hidden active:scale-95 transition-transform"
            onClick={onClick}
        >
            <div className="pointer-events-none absolute top-5 right-5 z-20 text-white">
                <FileText className="h-5 w-5 shrink-0" />
            </div>

            <div
                className={
                    hasNote
                        ? "flex min-h-0 min-w-0 flex-1 flex-col"
                        : "flex min-h-0 min-w-0 flex-1 flex-col justify-between"
                }
            >
                <div className="min-w-0 shrink-0 pr-10">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">
                        Notepad
                    </span>
                    <h3 className="mt-1 line-clamp-2 break-words text-xl font-extrabold leading-tight tracking-tight text-white transition-colors group-hover:text-white">
                        {latestNote?.title || "No Notes"}
                    </h3>
                </div>

                <div
                    className={
                        hasNote
                            ? "mt-auto flex w-full min-w-0 shrink-0 flex-col gap-3 pt-2"
                            : "flex w-full min-w-0 shrink-0 flex-col gap-4"
                    }
                >
                    <p className="line-clamp-2 shrink-0 break-words text-[11px] leading-snug text-white/50">
                        {previewContent}
                    </p>

                    <div className="flex min-w-0 items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-white animate-pulse" />
                            <span className="truncate text-[9px] font-bold uppercase tracking-wider text-white/40">
                                Quick Note
                            </span>
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 shadow-lg transition-all hover:bg-white/20 active:scale-90">
                            {latestNote ? (
                                <PenLine className="h-3.5 w-3.5 text-white" />
                            ) : (
                                <Plus className="h-3.5 w-3.5 text-white" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </GlassInterface>
    );
}
