'use client';

import React, { useState, useRef } from 'react';
import {
    Search,
    Inbox,
    Send,
    FileText,
    Clock,
    LayoutTemplate,
    PenSquare,
    Paperclip,
    Image as ImageIcon,
    MoreVertical,
    Users,
    Trash2,
    ChevronLeft,
    RotateCcw,
    Archive,
    CheckCircle2,
    X
} from 'lucide-react';

const USERS_DATA = [
    { name: 'James Wilson', email: 'j.wilson@cockpitos.com' },
    { name: 'Sarah Connor', email: 's.connor@cockpitos.com' },
    { name: 'Michael Brown', email: 'm.brown@cockpitos.com' },
    { name: 'Emma Davis', email: 'e.davis@cockpitos.com' },
    { name: 'Bob Johnson', email: 'b.johnson@cockpitos.com' },
    { name: 'Alice Smith', email: 'a.smith@cockpitos.com' },
];

const INITIAL_MAILS = [
    { id: 1, to: 'System Admins', from: 'admin@cockpitos.com', subject: 'Urgent: Cluster B Maintenance', date: '10:42 AM', preview: 'Please be aware that Cluster B will undergo scheduled maintenance...', body: '<p>Hi Team,</p><p>Please be aware that <b>Cluster B</b> will undergo scheduled maintenance starting at 11:00 PM tonight. Expected downtime is 2 hours.</p><p>Best,<br/>Admin</p>', unread: true, folder: 'inbox' },
    { id: 2, to: 'All Active Users', from: 'noreply@cockpitos.com', subject: 'Welcome to CockpitOS v2', date: 'Yesterday', preview: 'We are thrilled to announce the rollout of the new CockpitOS...', body: '<h3>Welcome to CockpitOS v2</h3><p>We are thrilled to announce the rollout of the new CockpitOS interface. It features enhanced performance and a completely redesigned dashboard.</p>', unread: false, folder: 'inbox' },
    { id: 3, to: 'Sarah Connor', from: 'security@cockpitos.com', subject: 'Security Audit Results', date: 'Mar 04', preview: 'The latest security audit results are in. We need to discuss...', body: '<p>Sarah,</p><p>The latest security audit results are in. We have a few items that need <i>immediate attention</i> regarding node access controls.</p>', unread: false, folder: 'inbox' },
    { id: 4, to: 'DevOps Team', from: 'system@cockpitos.com', subject: 'Deployment failure on Edge Node', date: 'Mar 02', preview: 'The automated deployment to the Frankfurt edge node failed...', body: '<p>Alert: The automated deployment to the <u>Frankfurt edge node</u> failed at 03:00 UTC. Rollback initiated.</p>', unread: false, folder: 'inbox' },
];

export default function MailService() {
    const [activeTab, setActiveTab] = useState('inbox');
    const [mails, setMails] = useState(INITIAL_MAILS);
    const [selectedMailId, setSelectedMailId] = useState<number | null>(null);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showToast, setShowToast] = useState(false);

    // Editor State
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const editorRef = useRef<HTMLDivElement>(null);

    const execCommand = (command: string, value: string = '') => {
        document.execCommand(command, false, value);
    };

    const handleSend = () => {
        if (!recipient || !subject) return;

        const newMail = {
            id: Date.now(),
            to: recipient,
            from: 'admin@cockpitos.com',
            subject: subject,
            date: 'Just now',
            preview: editorRef.current?.innerText.substring(0, 60) + '...',
            body: editorRef.current?.innerHTML || '',
            unread: false,
            folder: 'sent'
        };

        setMails([newMail, ...mails]);
        setIsComposeOpen(false);
        setRecipient('');
        setSubject('');
        if (editorRef.current) editorRef.current.innerHTML = '';
        setActiveTab('sent');

        // Show Toast
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const filteredMails = mails
        .filter(m => m.folder === activeTab)
        .filter(m =>
            m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.preview.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const selectedMail = mails.find(m => m.id === selectedMailId);

    return (
        <div className="flex-1 flex bg-[#000] overflow-hidden relative">
            {/* Toast Notification */}
            {showToast && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] bg-neutral-100 text-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    <CheckCircle2 className="w-5 h-5 text-neutral-600" />
                    <span className="font-medium">Message sent successfully!</span>
                    <button onClick={() => setShowToast(false)} className="ml-2 hover:text-white/70 transition-colors"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Mail Sidebar */}
            <div className="w-64 border-r border-[#1a1a1a] flex flex-col pt-6 px-4 shrink-0 bg-black">
                <button
                    onClick={() => {
                        setIsComposeOpen(true);
                        setSelectedMailId(null);
                        setRecipient('');
                        setSubject('');
                    }}
                    className="flex items-center justify-center gap-2 bg-neutral-100 hover:bg-white text-black px-4 py-3 rounded-xl font-medium transition-colors mb-8"
                >
                    <PenSquare className="w-4 h-4" />
                    <span>Compose</span>
                </button>

                <div className="flex flex-col gap-1">
                    <button
                        onClick={() => { setActiveTab('inbox'); setIsComposeOpen(false); }}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'inbox' && !isComposeOpen ? 'bg-[#0a0a0a] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#0a0a0a]/50'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Inbox className="w-4 h-4" />
                            <span className="text-sm font-medium">Inbox</span>
                        </div>
                        <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {mails.filter(m => m.folder === 'inbox' && m.unread).length}
                        </span>
                    </button>

                    <button
                        onClick={() => { setActiveTab('sent'); setIsComposeOpen(false); }}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${activeTab === 'sent' && !isComposeOpen ? 'bg-[#0a0a0a] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#0a0a0a]/50'}`}
                    >
                        <Send className="w-4 h-4" />
                        <span className="text-sm font-medium">Sent</span>
                    </button>

                    <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#0a0a0a]/50 transition-colors">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">Scheduled</span>
                    </button>

                    <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#0a0a0a]/50 transition-colors">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">Drafts</span>
                    </button>

                    <div className="h-px bg-[#141414] my-4 mx-2"></div>

                    <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#0a0a0a]/50 transition-colors">
                        <LayoutTemplate className="w-4 h-4" />
                        <span className="text-sm font-medium">Templates</span>
                    </button>
                </div>
            </div>

            {/* List View */}
            <div className="w-80 border-r border-[#1a1a1a] flex flex-col bg-black shrink-0">
                <div className="p-4 border-b border-[#1a1a1a]">
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search mail..."
                            className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-neutral-600 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#141414] [&::-webkit-scrollbar-thumb]:rounded-full text-gray-200">
                    {filteredMails.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">No messages found.</div>
                    ) : (
                        filteredMails.map((mail) => (
                            <div
                                key={mail.id}
                                onClick={() => {
                                    setSelectedMailId(mail.id);
                                    setIsComposeOpen(false);
                                    setMails(prev => prev.map(m => m.id === mail.id ? { ...m, unread: false } : m));
                                }}
                                className={`p-4 border-b border-[#1a1a1a]/50 cursor-pointer transition-colors ${selectedMailId === mail.id ? 'bg-[#0a0a0a]' : 'hover:bg-[#0a0a0a]/50'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-sm truncate pr-2 ${mail.unread ? 'text-white font-bold underline decoration-neutral-500 underline-offset-4' : 'text-gray-300 font-medium'}`}>{mail.to}</span>
                                    <span className={`text-xs whitespace-nowrap ${mail.unread ? 'text-neutral-300 font-medium' : 'text-gray-500'}`}>{mail.date}</span>
                                </div>
                                <div className={`text-xs truncate mb-1 ${mail.unread ? 'text-gray-100 font-semibold' : 'text-gray-400'}`}>
                                    {mail.subject}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate">
                                    {mail.preview}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Action Area */}
            <div className="flex-1 flex flex-col bg-black relative overflow-hidden">
                {isComposeOpen ? (
                    <div className="flex-1 flex flex-col p-8 max-w-4xl mx-auto w-full overflow-y-auto">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h2 className="text-2xl font-semibold text-white tracking-tight">New Message</h2>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-[#0a0a0a] transition-colors">
                                    <LayoutTemplate className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setIsComposeOpen(false)}
                                    className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl flex-1 flex flex-col shadow-2xl overflow-hidden relative min-h-[600px] mb-8">
                            {/* Recipients */}
                            <div className="flex flex-col border-b border-[#1a1a1a] group focus-within:bg-[#0a0a0a]/50 transition-all duration-300">
                                <div className="flex items-center px-6">
                                    <span className="text-gray-500 text-sm font-medium w-16">To:</span>
                                    <input
                                        type="text"
                                        value={recipient}
                                        onChange={(e) => setRecipient(e.target.value)}
                                        placeholder="Enter recipient email or group..."
                                        className="flex-1 bg-transparent py-4 text-sm text-white focus:outline-none ml-2 font-medium"
                                    />
                                    <button className="text-[10px] text-gray-500 hover:text-white font-bold tracking-widest uppercase ml-4 border border-[#2a2938] px-2 py-1 rounded hover:bg-[#141414]">Cc/Bcc</button>
                                </div>
                                {/* Quick Selection Users */}
                                <div className="px-20 pb-3 flex flex-wrap gap-2 items-center">
                                    <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mr-2">Quick:</span>
                                    {USERS_DATA.slice(0, 4).map(user => (
                                        <button
                                            key={user.email}
                                            onClick={() => setRecipient(user.email)}
                                            className="text-[10px] bg-[#141414] hover:bg-neutral-700 hover:text-white text-gray-400 px-3 py-1 rounded-full border border-[#262626] hover:border-neutral-500 transition-all font-semibold"
                                        >
                                            {user.name}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setRecipient('All Active Users')}
                                        className="text-[10px] bg-green-500/5 hover:bg-green-500/10 hover:text-white text-green-400/80 px-3 py-1 rounded-full border border-green-500/20 transition-all font-semibold uppercase tracking-tighter"
                                    >
                                        + ALL SYSTEMS
                                    </button>
                                </div>
                            </div>

                            {/* Subject */}
                            <div className="flex items-center px-6 border-b border-[#1a1a1a] group focus-within:bg-[#0a0a0a]/50 transition-all duration-300">
                                <span className="text-gray-500 text-sm font-medium w-16">Subject:</span>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Enter subject here..."
                                    className="flex-1 bg-transparent py-5 text-sm text-white focus:outline-none font-bold ml-2"
                                />
                            </div>

                            {/* Formatting Toolbar */}
                            <div className="flex items-center px-6 py-2 border-b border-[#1a1a1a] bg-[#0a0a0a]/30 text-gray-400 gap-1 overflow-x-auto select-none">
                                <select
                                    onChange={(e) => execCommand('formatBlock', e.target.value)}
                                    className="bg-[#141414] border border-[#2a2938] rounded text-[11px] p-1.5 hover:text-white cursor-pointer mr-2 text-gray-300 outline-none font-bold"
                                >
                                    <option value="p">Body Text</option>
                                    <option value="h1">Heading 1</option>
                                    <option value="h2">Heading 2</option>
                                    <option value="h3">Heading 3</option>
                                </select>

                                <select
                                    onChange={(e) => execCommand('fontName', e.target.value)}
                                    className="bg-[#141414] border border-[#2a2938] rounded text-[11px] p-1.5 hover:text-white cursor-pointer mr-2 text-gray-300 outline-none font-mono"
                                >
                                    <option value="Inter, sans-serif">Sans Serif</option>
                                    <option value="Georgia, serif">Serif</option>
                                    <option value="IBM Plex Mono, monospace">Monospace</option>
                                </select>

                                <div className="w-px h-10 bg-[#262626] mx-2 shrink-0"></div>
                                <button onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }} className="p-2 hover:bg-neutral-800 hover:text-white rounded-lg transition-all font-black w-10 h-10 text-center text-sm">B</button>
                                <button onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }} className="p-2 hover:bg-neutral-800 hover:text-white rounded-lg transition-all italic w-10 h-10 text-center text-sm font-serif">I</button>
                                <button onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }} className="p-2 hover:bg-neutral-800 hover:text-white rounded-lg transition-all underline w-10 h-10 text-center text-sm font-bold">U</button>
                                <div className="w-px h-10 bg-[#262626] mx-2 shrink-0"></div>
                                <button onMouseDown={(e) => { e.preventDefault(); execCommand('insertUnorderedList'); }} className="px-3 py-2 hover:bg-neutral-800 hover:text-white rounded-lg transition-all text-sm font-bold h-10 flex items-center gap-2">
                                    <LayoutTemplate className="w-4 h-4" />
                                </button>
                                <div className="w-px h-10 bg-[#262626] mx-2 shrink-0"></div>
                                <button className="p-2 hover:bg-[#0a0a0a] hover:text-white rounded-lg transition-all h-10 w-10 flex items-center justify-center border border-transparent hover:border-[#2a2938]"><Paperclip className="w-5 h-5" /></button>
                                <button className="p-2 hover:bg-[#0a0a0a] hover:text-white rounded-lg transition-all h-10 w-10 flex items-center justify-center border border-transparent hover:border-[#2a2938]"><ImageIcon className="w-5 h-5" /></button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 p-8 overflow-y-auto bg-black">
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    className="w-full h-full text-gray-200 text-base focus:outline-none resize-none leading-relaxed min-h-[450px] outline-none prose prose-invert max-w-none selection:bg-white/20 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-600 empty:before:pointer-events-none"
                                    data-placeholder="Write your system notification or user message here..."
                                ></div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-5 border-t border-[#1a1a1a] bg-[#0a0a0a] flex items-center justify-between shadow-2xl shrink-0">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleSend}
                                        className="bg-neutral-100 hover:bg-white text-black px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3"
                                    >
                                        Send Email
                                        <Send className="w-4 h-4" />
                                    </button>

                                </div>

                            </div>
                        </div>
                    </div>
                ) : selectedMailId && selectedMail ? (
                    <div className="flex-1 flex flex-col p-8 overflow-y-auto bg-black animate-in fade-in slide-in-from-right-2 duration-300">
                        {/* Header Actions */}
                        <div className="flex items-center justify-between mb-8 shrink-0">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedMailId(null)}
                                    className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-bold text-white tracking-tight">{selectedMail.subject}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        {/* <span className="bg-[#6357ff]/10 text-[#6357ff] px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border border-[#6357ff]/20">Workspace</span> */}
                                        <span className="bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border border-green-500/20">Direct</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] transition-all"><RotateCcw className="w-4 h-4" /></button>
                                <button className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] transition-all"><Archive className="w-4 h-4" /></button>
                                <button className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg border border-[#1a1a1a] transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        {/* Sender Info */}
                        <div className="flex items-center justify-between mb-6 px-4 py-3 bg-[#0a0a0a]/50 rounded-xl border border-[#1a1a1a]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#262626] border border-[#1a1a1a] text-white flex items-center justify-center font-bold text-lg">
                                    {selectedMail.from[0].toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-200 text-sm">{selectedMail.from}</span>
                                        {/* <span className="text-[10px] text-[#6357ff] font-bold bg-[#6357ff]/5 px-1.5 py-0.5 rounded border border-[#6357ff]/10">SECURE-NODE-01</span> */}
                                    </div>
                                    <span className="text-xs text-gray-500">to <span className="text-gray-400">{selectedMail.to}</span></span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-xs text-gray-300 font-bold">{selectedMail.date}</span>
                                {/* <span className="text-[10px] text-gray-500 italic">via CockpitOS Relay</span> */}
                            </div>
                        </div>

                        {/* Mail Body */}
                        <div className="bg-[#0a0a0a]/30 border border-[#1a1a1a] rounded-xl p-8 text-gray-300 leading-relaxed min-h-[300px] relative overflow-hidden">
                            <div
                                className="prose prose-invert max-w-none text-sm font-medium selection:bg-white/20"
                                dangerouslySetInnerHTML={{ __html: selectedMail.body }}
                            />
                        </div>

                        {/* Actions */}
                        <div className="mt-8 flex gap-3 pb-12 shrink-0">
                            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-[#141414] transition-all">
                                <RotateCcw className="w-3.5 h-3.5" /> Reply to System
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-[#141414] transition-all">
                                <Send className="w-3.5 h-3.5 rotate-45" /> Forward Message
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center flex-col text-gray-500 p-8 text-center animate-in fade-in zoom-in duration-700">
                        <div className="relative mb-12">
                            <div className="relative z-10 w-32 h-32 bg-[#0a0a0a] rounded-3xl border border-[#1a1a1a] flex items-center justify-center">
                                <Inbox className="w-16 h-16 text-neutral-500 opacity-100" />
                            </div>
                        </div>
                        {/* <h3 className="text-4xl font-black text-white/40 mb-3 tracking-tighter uppercase">Relay Inbox</h3> */}
                        <p className="text-base text-gray-600 max-w-[320px] font-medium leading-relaxed pr-4">"Direct bridge to all system nodes and registered personnel across CockpitOS."</p>
                        <div className="mt-8 h-1 w-12 bg-gradient-to-r from-transparent via-neutral-600 to-transparent rounded-full"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
