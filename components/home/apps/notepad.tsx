"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useDragControls, useMotionValue } from "framer-motion";
import {
    X,
    Maximize2,
    FileText,
    Save,
    Trash2,
    Plus,
    Type,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Bold,
    Italic,
    Underline,
    Loader2
} from "lucide-react";
import { WINDOW_CONSTANTS } from "../window-constants";
import { AppHorizontalAdRibbon } from "@/components/ads";
import { BASE_URL } from "@/lib/baseURL";

interface NotepadProps {
    isOpen: boolean;
    onClose: () => void;
    onMinimize?: () => void;
}

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

function normalizeNoteTitle(title: string): string {
    return title.trim();
}

/** True when the rich-text body has no visible text (empty, only BRs, &nbsp;, etc.) */
function isNoteContentEmpty(html: string): boolean {
    const raw = html.replace(/&nbsp;/gi, " ").trim();
    if (!raw) return true;
    if (typeof document === "undefined") return false;
    const el = document.createElement("div");
    el.innerHTML = html;
    const text = (el.textContent || "").replace(/\u00a0/g, " ").trim();
    return text.length === 0;
}

export function Notepad({ isOpen, onClose, onMinimize }: NotepadProps) {
    const [size, setSize] = useState({ width: 800, height: 600 });
    const [isMaximized, setIsMaximized] = useState(false);
    const [preMaximizeState, setPreMaximizeState] = useState<{
        size: { width: number; height: number };
        pos: { x: number; y: number };
    } | null>(null);

    const dragControls = useDragControls();
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const [isResizing, setIsResizing] = useState(false);

    // Notes state
    const [notes, setNotes] = useState<Note[]>([]);
    const [activeNote, setActiveNote] = useState<Note | null>(null);
    const [content, setContent] = useState("");
    const [fileName, setFileName] = useState("Untitled.txt");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Rich text state
    const editorRef = useRef<HTMLDivElement>(null);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');

    // Format commands
    const formatBold = () => {
        document.execCommand('bold', false);
        updateFormatState();
    };

    const formatItalic = () => {
        document.execCommand('italic', false);
        updateFormatState();
    };

    const formatUnderline = () => {
        document.execCommand('underline', false);
        updateFormatState();
    };

    const formatAlign = (align: 'left' | 'center' | 'right') => {
        document.execCommand('justify' + align.charAt(0).toUpperCase() + align.slice(1), false);
        setAlignment(align);
    };

    const updateFormatState = () => {
        setIsBold(document.queryCommandState('bold'));
        setIsItalic(document.queryCommandState('italic'));
        setIsUnderline(document.queryCommandState('underline'));
    };

    // Fetch notes
    const fetchNotes = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/cockpit/notes`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setNotes(data);
            }
        } catch (e) {
            console.error("Failed to fetch notes:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Create new note
    const createNote = async () => {
        try {
            const res = await fetch(`${BASE_URL}/cockpit/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ title: "Untitled.txt", content: "" }),
            });
            if (res.ok) {
                const newNote = await res.json();
                setNotes(prev => [newNote, ...prev]);
                setActiveNote(newNote);
                setContent("");
                setFileName(newNote.title);
                setHasUnsavedChanges(false);
            }
        } catch (e) {
            console.error("Failed to create note:", e);
        }
    };

    const saveNote = useCallback(async () => {
        if (!activeNote) return;
        const nextTitle = normalizeNoteTitle(fileName);
        if (!nextTitle || isNoteContentEmpty(content)) return;

        setIsSaving(true);
        try {
            const res = await fetch(`${BASE_URL}/cockpit/notes/${activeNote.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ title: nextTitle, content }),
            });
            if (res.ok) {
                const updated = await res.json();
                setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
                setActiveNote(updated);
                setFileName(updated.title);
                setHasUnsavedChanges(false);
            }
        } catch (e) {
            console.error("Failed to save note:", e);
        } finally {
            setIsSaving(false);
        }
    }, [activeNote, content, fileName]);

    const titleOk = normalizeNoteTitle(fileName).length > 0;
    const contentOk = !isNoteContentEmpty(content);
    const canSave = Boolean(activeNote && titleOk && contentOk);

    // Delete note
    const deleteNote = async (noteId: string) => {
        try {
            const res = await fetch(`${BASE_URL}/cockpit/notes/${noteId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (res.ok) {
                setNotes(prev => prev.filter(n => n.id !== noteId));
                if (activeNote?.id === noteId) {
                    setActiveNote(null);
                    setContent("");
                    setFileName("Untitled.txt");
                }
            }
        } catch (e) {
            console.error("Failed to delete note:", e);
        }
    };

    // Select note
    const selectNote = (note: Note) => {
        setActiveNote(note);
        setContent(note.content);
        setFileName(note.title);
        setHasUnsavedChanges(false);
    };

    // Track content changes
    const handleContentChange = () => {
        if (editorRef.current) {
            setContent(editorRef.current.innerHTML);
            setHasUnsavedChanges(true);
        }
    };

    // Update editor content when note changes
    useEffect(() => {
        if (editorRef.current && activeNote) {
            editorRef.current.innerHTML = activeNote.content;
        }
    }, [activeNote?.id]);

    // Reset when opened
    useEffect(() => {
        if (!isOpen) return;
        setIsMaximized(false);
        setSize({ width: 800, height: 600 });
        x.set(0);
        y.set(-15);
        fetchNotes();
    }, [isOpen, x, y, fetchNotes]);

    // Auto-save with debounce (only when title and body are valid)
    useEffect(() => {
        if (!hasUnsavedChanges || !activeNote) return;
        if (!normalizeNoteTitle(fileName) || isNoteContentEmpty(content)) return;
        const timeout = setTimeout(() => {
            void saveNote();
        }, 2000);
        return () => clearTimeout(timeout);
    }, [content, fileName, hasUnsavedChanges, activeNote, saveNote]);

    const toggleMaximize = () => {
        const springConfig = { type: "spring" as const, stiffness: 400, damping: 30 };

        if (isMaximized) {
            if (preMaximizeState) {
                setSize(preMaximizeState.size);
                import("framer-motion").then(({ animate }) => {
                    animate(x, preMaximizeState.pos.x, springConfig);
                    animate(y, preMaximizeState.pos.y, springConfig);
                });
            } else {
                setSize({ width: 800, height: 600 });
                import("framer-motion").then(({ animate }) => {
                    animate(x, 0, springConfig);
                    animate(y, -15, springConfig);
                });
            }
            setIsMaximized(false);
            return;
        }

        setPreMaximizeState({ size, pos: { x: x.get(), y: y.get() } });
        const { MENU_HEIGHT, DOCK_HEIGHT, HORIZONTAL_PADDING } = WINDOW_CONSTANTS;

        const availableW = window.innerWidth - HORIZONTAL_PADDING * 2;
        const availableH = window.innerHeight - MENU_HEIGHT - DOCK_HEIGHT;

        setSize({ width: availableW, height: availableH });

        const targetY = MENU_HEIGHT - window.innerHeight / 2 + availableH / 2;

        import("framer-motion").then(({ animate }) => {
            animate(x, 0, springConfig);
            animate(y, targetY, springConfig);
        });
        setIsMaximized(true);
    };

    const handleDragEnd = () => {
        if (isMaximized) return;
        const currentY = y.get();
        const windowTop = (window.innerHeight - size.height) / 2 + currentY;
        if (windowTop < 40) toggleMaximize();
    };

    const handleResizeStart = (dir: ResizeDir) => (e: React.PointerEvent) => {
        if (isMaximized) return;
        e.preventDefault();
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);
        setIsResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startW = size.width;
        const startH = size.height;
        const startMX = x.get();
        const startMY = y.get();

        const applyAction = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            let w = startW;
            let h = startH;
            let mx = startMX;
            let my = startMY;

            if (dir.includes("e")) w = startW + dx;
            if (dir.includes("s")) h = startH + dy;
            if (dir.includes("w")) { w = startW - dx; mx = startMX + dx; }
            if (dir.includes("n")) { h = startH - dy; my = startMY + dy; }

            setSize({ width: Math.max(700, w), height: Math.max(500, h) });
            x.set(mx);
            y.set(my);
        };

        const onMove = (ev: PointerEvent) => applyAction(ev);
        const onUp = (ev: PointerEvent) => {
            try { target.releasePointerCapture(ev.pointerId); } catch { }
            setIsResizing(false);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <style>{`
                        [contenteditable][data-placeholder]:empty::before {
                            content: attr(data-placeholder);
                            color: rgba(255, 255, 255, 0.3);
                            pointer-events: none;
                        }
                    `}</style>
                    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
                        <motion.div
                            drag={!isResizing && !isMaximized}
                            dragMomentum={false}
                            dragListener={false}
                            dragControls={dragControls}
                            onDragEnd={handleDragEnd}
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 50 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            style={{ x, y, width: size.width, height: size.height }}
                            className={[
                                "pointer-events-auto bg-zinc-950 border border-white/5 flex flex-col overflow-hidden relative backdrop-blur-3xl text-white shadow-3xl",
                                isMaximized ? "rounded-none" : "rounded-2xl",
                                isResizing ? "select-none" : "",
                            ].join(" ")}
                        >
                            {/* Header Area */}
                            <div
                                className="shrink-0 h-12 border-b border-white/5 flex items-center px-4 select-none bg-zinc-900/40"
                                onPointerDown={(e) => dragControls.start(e)}
                                onDoubleClick={toggleMaximize}
                            >
                                {/* Window Controls */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={onClose} className="w-3 h-3 rounded-full bg-[#FF5F57] group/btn flex items-center justify-center transition-transform hover:scale-110">
                                        <X className="w-2 h-2 opacity-0 group-hover/btn:opacity-100 text-black/60" />
                                    </button>
                                    <button onClick={onMinimize} className="w-3 h-3 rounded-full bg-[#FEBC2E] group/btn flex items-center justify-center transition-transform hover:scale-110">
                                        <div className="w-1.5 h-[1.5px] bg-black/60 opacity-0 group-hover/btn:opacity-100" />
                                    </button>
                                    <button onClick={toggleMaximize} className="w-3 h-3 rounded-full bg-[#28C840] group/btn flex items-center justify-center transition-transform hover:scale-110">
                                        <Maximize2 className="w-1.5 h-1.5 opacity-0 group-hover/btn:opacity-100 text-black/60" />
                                    </button>
                                </div>

                                {/* Title - Centered */}
                                <div className="flex-1 flex justify-center items-center">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-zinc-400" />
                                        <input
                                            value={fileName}
                                            onChange={(e) => { setFileName(e.target.value); setHasUnsavedChanges(true); }}
                                            className="text-[13px] font-medium text-white bg-transparent border-none outline-none text-center w-[180px]"
                                        />
                                        {hasUnsavedChanges && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="flex items-center shrink-0">
                                    <button
                                        type="button"
                                        title={
                                            !activeNote
                                                ? "Open a note to save"
                                                : !titleOk
                                                  ? "Add a title to save"
                                                  : !contentOk
                                                    ? "Add note content to save"
                                                    : "Save"
                                        }
                                        onClick={() => void saveNote()}
                                        disabled={isSaving || !canSave}
                                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Formatting Toolbar */}
                            <div className="shrink-0 h-10 border-b border-white/5 flex items-center px-4 gap-4 bg-zinc-900/20">
                                <div className="flex bg-black/40 p-0.5 rounded-none border border-white/5">
                                    <button
                                        onClick={formatBold}
                                        className={`px-2.5 py-1 text-[11px] font-medium ${isBold ? 'bg-zinc-700 shadow-sm text-white' : 'text-zinc-500 hover:text-white'} rounded-none transition-all flex items-center gap-1`}
                                    >
                                        <Bold className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={formatItalic}
                                        className={`px-2.5 py-1 text-[11px] font-medium ${isItalic ? 'bg-zinc-700 shadow-sm text-white' : 'text-zinc-500 hover:text-white'} rounded-none transition-all flex items-center gap-1`}
                                    >
                                        <Italic className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={formatUnderline}
                                        className={`px-2.5 py-1 text-[11px] font-medium ${isUnderline ? 'bg-zinc-700 shadow-sm text-white' : 'text-zinc-500 hover:text-white'} rounded-none transition-all flex items-center gap-1`}
                                    >
                                        <Underline className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="w-px h-5 bg-white/10" />

                                <div className="flex bg-black/40 p-0.5 rounded-none border border-white/5">
                                    <button
                                        onClick={() => formatAlign('left')}
                                        className={`px-2.5 py-1 ${alignment === 'left' ? 'bg-zinc-700 shadow-sm text-white' : 'text-zinc-500 hover:text-white'} rounded-none transition-all`}
                                    >
                                        <AlignLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => formatAlign('center')}
                                        className={`px-2.5 py-1 ${alignment === 'center' ? 'bg-zinc-700 shadow-sm text-white' : 'text-zinc-500 hover:text-white'} rounded-none transition-all`}
                                    >
                                        <AlignCenter className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => formatAlign('right')}
                                        className={`px-2.5 py-1 ${alignment === 'right' ? 'bg-zinc-700 shadow-sm text-white' : 'text-zinc-500 hover:text-white'} rounded-none transition-all`}
                                    >
                                        <AlignRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="flex-1" />

                                <span className="text-[10px] text-zinc-600 font-medium flex items-center gap-1">
                                    <Type className="w-3 h-3" />
                                    Notepad
                                </span>
                            </div>


                            {/* Main Body */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* Sidebar */}
                                <div className="w-64 border-r border-white/5 flex flex-col py-6 px-4 bg-black/20 shrink-0">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex items-center gap-2 text-zinc-500 text-[11px] font-bold uppercase tracking-wider">
                                                <FileText className="w-3 h-3" />
                                                Notes
                                            </div>
                                            <button
                                                onClick={createNote}
                                                className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-white transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-1 max-h-[300px] overflow-auto no-scrollbar">
                                            {isLoading ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                                                </div>
                                            ) : notes.length > 0 ? (
                                                notes.map((note) => (
                                                    <div
                                                        key={note.id}
                                                        onClick={() => selectNote(note)}
                                                        className={`flex items-center gap-3 px-3 py-1.5 rounded-lg ${activeNote?.id === note.id ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-zinc-400'} text-[13px] transition-colors cursor-pointer group`}
                                                    >
                                                        <FileText className="w-4 h-4 shrink-0" />
                                                        <span className="truncate flex-1">{note.title}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-red-400 transition-all"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-zinc-600 text-[12px] text-center py-4">
                                                    No notes yet. Click + to create one.
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 px-2 text-zinc-500 text-[11px] font-bold uppercase tracking-wider pt-4">
                                            <Save className="w-3 h-3" />
                                            Quick Actions
                                        </div>
                                        <div className="space-y-3">
                                            <button
                                                onClick={handleDownload}
                                                disabled={!activeNote}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-zinc-400 text-[13px] transition-colors disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4" />
                                                Export as .txt
                                            </button>
                                        </div>
                                    </div>
                                </div>


                                {/* Text Editor */}
                                <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
                                    <div className="shrink-0 border-b border-white/5 bg-black/25 px-4 py-2">
                                        <AppHorizontalAdRibbon />
                                    </div>
                                    {/* <div className="p-2 border-b border-white/10 bg-black/10 flex gap-1">
                                    <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md text-[11px] transition-colors">
                                        File
                                    </button>
                                    <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md text-[11px] transition-colors">
                                        Edit
                                    </button>
                                    <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md text-[11px] transition-colors">
                                        View
                                    </button>
                                    <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md text-[11px] transition-colors">
                                        Insert
                                    </button>
                                </div> */}
                                    <div className="flex-1 overflow-auto no-scrollbar">
                                        {activeNote ? (
                                            <div
                                                ref={editorRef}
                                                contentEditable
                                                onInput={handleContentChange}
                                                onKeyUp={updateFormatState}
                                                onMouseUp={updateFormatState}
                                                className="w-full h-full p-6 bg-transparent text-white resize-none outline-none font-sans text-sm leading-relaxed"
                                                style={{ minHeight: '100%' }}
                                                suppressContentEditableWarning
                                                data-placeholder="Start typing your notes here..."
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                                                <FileText className="w-16 h-16 mb-4 opacity-30" />
                                                <p className="text-sm">Select a note or create a new one</p>
                                                <button
                                                    onClick={createNote}
                                                    className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                                                >
                                                    <Plus className="w-4 h-4 inline mr-2" />
                                                    New Note
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Status Bar */}
                            <div className="shrink-0 h-6 border-t border-white/5 flex items-center px-3 text-[10px] text-zinc-500 bg-black/30">
                                <div className="flex items-center gap-3">
                                    <span>Ln {content.split('\n').length}, Col {content.length > 0 ? content.split('\n').pop()?.length || 0 : 0}</span>
                                    <span>100%</span>
                                    <span>UTF-8</span>
                                    {isSaving && <span className="text-white">Saving...</span>}
                                    {hasUnsavedChanges && !isSaving && <span className="text-white">Unsaved</span>}
                                </div>
                            </div>

                            {/* Resize handles */}
                            {!isMaximized && (
                                <>
                                    <div onPointerDown={handleResizeStart("n")} className="absolute top-0 left-2 right-2 h-1.5 cursor-n-resize" />
                                    <div onPointerDown={handleResizeStart("s")} className="absolute bottom-0 left-2 right-2 h-1.5 cursor-s-resize" />
                                    <div onPointerDown={handleResizeStart("w")} className="absolute left-0 top-2 bottom-2 w-1.5 cursor-w-resize" />
                                    <div onPointerDown={handleResizeStart("e")} className="absolute right-0 top-2 bottom-2 w-1.5 cursor-e-resize" />
                                </>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
