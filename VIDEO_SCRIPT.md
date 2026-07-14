# 🎬 COCKPIT OPERATING SURFACE — Complete Video Script
### *Duration: ~20 Minutes | Audience: Investors, Acquisition Partners, Users*
### *Tone: Professional, Clear, Easy-to-Understand, No Jargon*

---

## 📋 PRODUCTION NOTES

- **Speaker**: Founder / Product Lead (on-screen or voiceover)
- **Visuals**: Live product demo with screen recording
- **Music**: Subtle, ambient tech background track
- **Transitions**: Smooth crossfades between app demos
- **Lower thirds**: Feature labels and key stats

---

## ⏱️ TIMECODED SCRIPT

---

### **[00:00 – 01:30] OPENING — The Problem & The Vision**

**[VISUAL: Dark screen fading into a cinematic shot of cloud servers, then transitioning to the Cockpit lock screen]**

**NARRATOR:**

> "Managing a cloud server today feels like it was designed in 2005. You open a terminal, type cryptic commands, hope nothing breaks, and pray you remember which config file you edited last Tuesday.
>
> For developers, that's Tuesday. But for teams, businesses, and anyone who doesn't want to memorize Linux commands — it's a wall. A wall between you and your own infrastructure.
>
> We asked a simple question: **What if managing a cloud server felt as natural as using your laptop?**
>
> Not a dashboard. Not a control panel. A complete **operating surface** — a desktop environment that lives in your browser, connects to your real servers, and gives you everything you need without the learning curve.
>
> This is **Cockpit**. And today, I'm going to walk you through every single screen, every feature, and show you exactly why this changes everything."

---

### **[01:30 – 02:30] THE ARCHITECTURE — How It All Works**

**[VISUAL: Simple animated diagram showing three components: Cockpit (Frontend) ↔ Production Server (Backend) ↔ Cocktail Agent (On-Device)]**

**NARRATOR:**

> "Before we dive into the screens, let me quickly explain how Cockpit works under the hood. There are three pieces to this puzzle:
>
> **First, the Cockpit Frontend.** This is what you see — the desktop interface. It's built with Next.js and React, runs entirely in your web browser. No installations. No plugins. Just open a URL and you're in.
>
> **Second, the Production Server.** This is the brain. Built with NestJS, it handles authentication, stores your data, manages your devices, and acts as the secure bridge between you and your servers. It includes modules for user management, device enrollment, file transfers, terminal sessions, notes, calendars, speed tests, and more.
>
> **Third, the Cocktail Agent.** This is a small, lightweight program that runs directly on your cloud server — your VPS, your dedicated machine, whatever you're managing. It's a single binary file, under 50 megabytes, and it does all the heavy lifting: collecting system health data, executing commands, managing files, streaming logs, uploading and downloading files — all securely communicating back to the Production Server over WebSockets and REST APIs.
>
> Together, these three pieces create a seamless experience. You interact with Cockpit. Cockpit talks to the server. The server sends instructions to the agent. And everything happens in real time."

---

### **[02:30 – 04:00] SCREEN 1: THE LOCK SCREEN — First Impressions Matter**

**[VISUAL: Show the Cockpit lock screen with the wallpaper, clock, and Reglook logo]**

**NARRATOR:**

> "When you first open Cockpit, you're greeted with a lock screen. And this isn't just decoration — it's intentional design.
>
> At the top left, you see the **Reglook logo** — the company behind Cockpit. Top right, you'll find **status indicators** showing connectivity and system info.
>
> In the center, there's a beautiful **glass-style clock** displaying the current time. The wallpaper behind it is high-resolution and sets the tone — this is a premium experience.
>
> To unlock, you have two options. You can **swipe up** — just like on a phone — or **scroll up** with your mouse wheel. This gesture triggers a smooth animation that reveals the **PIN pad**.
>
> The background blurs and dims, focusing your attention on the security input. You enter your PIN, and if it's correct, a satisfying unlock animation plays and you're transitioned directly to the **home screen**.
>
> If someone enters the wrong PIN? The pad shakes — a clear, visual 'no' — and resets. Simple, secure, elegant.
>
> This isn't about making things complicated. It's about making the first touch with Cockpit feel like a polished product. Because it is."

---

### **[04:00 – 05:00] SCREEN 2: ONBOARDING — Login, Signup & Device Setup**

**[VISUAL: Navigate to the setup/login screens]**

**NARRATOR:**

> "Before you reach the desktop, new users go through our **onboarding flow**. It has three main stages:
>
> **Stage one is authentication.** You either log in with an existing account or sign up for a new one. The login form asks for your email and password. The signup flow collects your name, email, and password in a clean, step-by-step process. There's password visibility toggling, real-time validation, and clear error messages.
>
> **Stage two is the Device Setup Wizard.** This is where the magic begins. The wizard asks for your server details — the hostname or IP address, the SSH username, and generates a unique installation command.
>
> You copy that one command, paste it into your server's terminal, and the **Cocktail Agent** installs itself automatically. The entire process is streamed live in an embedded terminal right inside the Cockpit interface — you can watch every step as it happens.
>
> Once the agent is installed and phones home, the setup wizard detects it automatically, shows a success confirmation, and you're taken to the desktop. That's it. One command. No manual configuration. No YAML files. No headaches."

---

### **[05:00 – 06:30] SCREEN 3: THE DESKTOP — Your Digital Workspace**

**[VISUAL: Show the home screen with wallpaper, menubar, dock, and widgets]**

**NARRATOR:**

> "Welcome to the Cockpit desktop. If this looks familiar, that's by design. We modeled the experience after what billions of people already know — a desktop operating system.
>
> Let me walk you through the key elements:
>
> **The Menu Bar** sits at the top of the screen. On the left, you have the Reglook menu with options like 'About Cockpit', and access to the Finder, Terminal, Settings, and Explorer — all accessible via dropdown menus with keyboard shortcuts. There are also functional menus for File operations, Edit actions like copy and paste, View controls, and Window management.
>
> On the right side of the menu bar, you'll see **real-time system metrics** pulled directly from your connected server — CPU usage, memory usage, disk space, and network speeds. There are also Wi-Fi status, battery indicators, and a live clock with date.
>
> It even runs a **live speed test** in the background, measuring both download and upload speeds of your server, and displaying the results right there in the menu bar.
>
> **The Dock** sits at the bottom of the screen, styled with a frosted glass look. It's organized into three groups:
>
> **System apps** like the File Explorer, Terminal, Settings, and Task Monitor. **Personal apps** like Mail, Calendar, Photos, Music, Notepad, and xCloud Drive. And **Web apps** like the Brave browser and Google shortcut.
>
> Each dock icon has a hover tooltip, a subtle bounce animation, and a small indicator dot when the app is active. Click any icon and the app slides open with a smooth animation from the center of the screen."

---

### **[06:30 – 07:00] THE WINDOW SYSTEM**

**[VISUAL: Open multiple apps, drag them around, resize them, stack them]**

**NARRATOR:**

> "Every app in Cockpit runs as a **real, movable, resizable window**. You can drag windows by their title bar, resize them from any edge or corner, minimize them, maximize them with a double-click, and **stack them** — clicking a background window brings it to the front automatically.
>
> There's even a smart behavior: drag a window to the very top of the screen, and it snaps to **full screen** automatically. This window management system uses a dedicated Z-Index provider to handle layering perfectly, no matter how many apps you have open."

---

### **[07:00 – 09:30] SCREEN 4: FILE EXPLORER — Your Server's File System**

**[VISUAL: Open the Explorer app, navigate through folders]**

**NARRATOR:**

> "The **File Explorer** is one of the most powerful apps in Cockpit. It gives you full access to your remote server's file system — visually.
>
> When you open it, it first connects to your enrolled device. The sidebar shows quick-access locations: the root directory, home, tmp, opt, var, and etc — the most important directories on any Linux server.
>
> The main area displays files and folders in either a **grid view** or a **list view**, and you can switch between them with a single click. Each file shows its name, size, and an icon that changes based on the file type — folders, code files, images, videos, music.
>
> Here's where it gets interesting. This isn't just a viewer — you can actually **do things**:
>
> - **Navigate** through directories by clicking folders. There's a full back-and-forward navigation history.
> - **Create new folders** — click the 'New Folder' button, type a name, and it's created on your remote server instantly.
> - **Create new files** — same thing. A new blank file, ready to edit.
> - **Open and edit text files** — click any code file or config file, and a full **text editor** opens right inside the explorer. Make your changes and hit save — the file is written directly to your server.
> - **Delete files or folders** — with a confirmation dialog to prevent accidents. It supports recursive deletion for directories.
> - **View images, videos, and audio** — media files can be downloaded and previewed directly in the browser.
>
> Everything communicates through the Cocktail Agent. When you click a folder, Cockpit sends a task to the agent, the agent reads the directory, and sends back the file listing. It all happens in about one second.
>
> And from the Explorer, you can even launch a **Terminal session** directly into the current directory, or open the **Task Monitor** for the connected device. Context-appropriate actions, right where you need them."

---

### **[09:30 – 11:30] SCREEN 5: TERMINAL — Full SSH Access In Your Browser**

**[VISUAL: Open the Terminal app, show tabs, show a VPS connection]**

**NARRATOR:**

> "The **Terminal** is the power user's best friend. It's a full-featured, real-time SSH terminal — running entirely inside your browser.
>
> When you open it, you'll see a list of your connected servers. Click one, and a live terminal session starts. Under the hood, it connects via WebSocket to the production server, which then establishes a secure SSH connection to your VPS through the Cocktail Agent.
>
> This isn't a simulated terminal. It's the real thing. You can:
>
> - Run any command — `ls`, `htop`, `nano`, `docker compose up` — anything your server supports.
> - Use **interactive programs** like nano, vim, and other text editors — full keyboard support with proper control key handling.
> - Open **multiple tabs** — each one is an independent terminal session. You can have one tab running a deployment script while another monitors logs.
> - **Name your tabs** — they automatically pick up the current directory name, but you can rename them for clarity.
> - **Resize the terminal** — the terminal automatically refits to the window size, whether you resize the window or toggle full screen.
>
> The terminal uses **xterm.js** for rendering, which means it supports colors, unicode characters, progress bars, and everything you'd expect from a professional terminal emulator.
>
> You can also launch the terminal directly from the File Explorer with a pre-set working directory, or from the menu bar. It's deeply integrated into the entire Cockpit experience."

---

### **[11:30 – 13:30] SCREEN 6: TASK MONITOR — Real-Time Server Health**

**[VISUAL: Open Task Monitor, show system metrics, processes, and the boost feature]**

**NARRATOR:**

> "The **Task Monitor** is your command center for understanding what's happening on your server right now.
>
> At the top, you see the **big picture metrics**: CPU usage with a live percentage and core count, memory usage showing how much is used versus available, disk usage with a visual progress bar, and network speed showing both incoming and outgoing data rates in real time. There's also a temperature readout and uptime counter.
>
> Below that, you'll find a **Neofetch panel** — a visual summary of your server's identity: the operating system, kernel version, CPU model, and RAM.
>
> The bottom section shows a live **process list** — every running process on your server, sorted by CPU or memory usage. For each process, you see the PID, name, user, CPU percentage, memory percentage, RAM usage, and thread count.
>
> But here's the best part — you can **manage these processes directly**. See a runaway process eating up CPU? Click the kill button, confirm, and it's terminated. You can send different signals — terminate, kill, interrupt, or hangup — all from the interface.
>
> There's also a **System Booster** feature. Click the rocket icon, and Cockpit will run a cleanup sequence on your server — cleaning temporary files, rotating logs, and purging package manager caches. It streams the progress in real time, with each action logged live in the interface.
>
> The entire Task Monitor stays up to date through **WebSocket streaming**. The Cocktail Agent pushes new metrics every five seconds, and the Task Monitor immediately reflects the changes. No refreshing. No polling delays. Real, live data."

---

### **[13:30 – 14:30] SCREEN 7: SETTINGS — Deep Server Configuration**

**[VISUAL: Open Settings app, browse through sections]**

**NARRATOR:**

> "The **Settings** app is where you configure everything about your connected server. It's organized into four groups:
>
> **Cloud Instance** — Shows your server's identity: hostname, OS, architecture, IP address, and current status. You'll also see the live CPU usage chart over time.
>
> **Performance** — Displays real-time metrics polling with historical data.
>
> **Connectivity** — This is where it gets powerful:
>
> - **SSH Keys** — View all authorized SSH keys on your server. Add new keys with a single paste. Delete keys you no longer need. All changes happen instantly on the remote server.
> - **Network & Ports** — See every open port on your server, which service is using it, and the type of traffic flowing through it. All discovered automatically.
> - **Firewall (UFW)** — View your firewall rules, check if UFW is active or inactive, and see the complete rule set.
>
> **Environment** — Check what software is installed:
>
> - **Runtimes** — Detects Node.js, Python, Docker, Go, Java, and Bun — showing their versions and status.
> - **Docker Containers** — Lists all running Docker containers with their ID, name, image, and status.
> - **Databases** — Detects PostgreSQL, MySQL, Redis, and MongoDB — showing connection counts, data sizes, and latency.
>
> **Administration** — Manage users on the server and view system logs. The logs auto-refresh every 5 seconds."

---

### **[14:30 – 15:30] SCREEN 8: GALLERY — Remote Photo Management**

**[VISUAL: Open Gallery app, browse photos, upload, preview]**

**NARRATOR:**

> "The **Gallery** is a beautifully designed photo management app that works with images stored on your remote server.
>
> It automatically scans your server for image files — JPEG, PNG, GIF, WebP — and displays them in a responsive grid. Each image is downloaded and rendered as a preview thumbnail.
>
> You can:
>
> - **Browse** all photos in a grid layout with smooth loading animations.
> - **Click to view** a full-size preview with navigation arrows to move between photos.
> - **Upload new photos** — drag and drop files, paste from clipboard, or use the upload button. Files are securely transferred to your server via Cloudflare R2 storage, with progress tracking and SHA-256 verification.
> - **Delete photos** with a confirmation step.
> - **Search** through your image library by file name.
>
> The upload system uses a sophisticated pipeline: the file is first uploaded to R2 cloud storage with a signed URL, then the Cocktail Agent downloads it from R2 to the server. This means even large files transfer reliably, with progress reported in real time."

---

### **[15:30 – 16:15] SCREEN 9: xCLOUD DRIVE — Your Cloud Storage**

**[VISUAL: Open xCloud Drive app, browse folders and files]**

**NARRATOR:**

> "**xCloud Drive** is the cloud storage interface within Cockpit. Think of it as Google Drive, but for your own infrastructure.
>
> The sidebar lets you navigate between your main Drive, Recent files, Starred items, Shared resources, and Trash. There's a storage indicator showing how much space you've used.
>
> The main area shows your files and folders in a card layout. Each card shows the item name, type, size, last modified date, and sync status. Synced files show a blue checkmark; files currently syncing show a spinning animation.
>
> You can create new folders, generate shared links, search through your files, and upload new content — all in one clean interface."

---

### **[16:15 – 17:00] SCREEN 10: NOTEPAD — Rich Text Notes**

**[VISUAL: Open Notepad, create a note, format text, save]**

**NARRATOR:**

> "The **Notepad** is a full-featured notes application synced through your Cockpit account.
>
> On the left side, you see your note list with titles and timestamps. Hit the plus button to create a new note. On the right side, you get a rich text editor with formatting controls: **bold**, *italic*, underline, and text alignment.
>
> Notes are saved to the production server, so they're available across sessions. You can delete notes, and even export them — the download button generates a file from your note content.
>
> It uses `contentEditable` for rich text editing, so you can format text naturally without any markdown syntax."

---

### **[17:00 – 17:45] SCREEN 11: CALENDAR — Event Management**

**[VISUAL: Open Calendar, browse months, add an event]**

**NARRATOR:**

> "The **Calendar** is a beautifully designed monthly planner that syncs in real time via WebSocket.
>
> You see a full month view with navigation arrows to move between months. Days with events show colored dots. Click any day to see its events or create a new one.
>
> The event creation modal lets you set a title, date, time, location, and description with color coding. You can edit existing events, delete them, and everything syncs instantly — if you have Cockpit open on multiple tabs or devices, changes appear everywhere at once."

---

### **[17:45 – 18:30] SCREENS 12-14: ADDITIONAL APPS**

**[VISUAL: Quick montage of remaining apps]**

**NARRATOR:**

> "Let me quickly show you the remaining apps in Cockpit:
>
> **Reglook Mail** — An embedded mail client that opens your email directly within the Cockpit window. Full browsing experience with back, forward, and reload controls.
>
> **Music** — A music player interface with album art, a sidebar organizer for playlists and your library, and playback controls. Designed for a familiar, Spotify-like browsing experience within the Cockpit environment.
>
> **Brave Browser** — An embedded web browser using Brave Search as the default engine. It has a URL bar, navigation controls, security indicators, and renders websites inside the Cockpit window using an iframe. You can browse the web without ever leaving your server management environment.
>
> **FaceTime (RegCall)** — A video calling interface with camera preview, mute and video toggle buttons, and a recent calls list. It accesses the device camera for a native video call experience — designed for team communication right within the Cockpit workspace.
>
> **Finder (Help & Info)** — A system information and help center. It shows Cockpit's version, build number, kernel information, architecture specs, security details, and has expandable sections for documentation and troubleshooting guides.
>
> **Google** — A simple shortcut that opens Google in a new browser tab."

---

### **[18:30 – 19:00] DESKTOP WIDGETS**

**[VISUAL: Show widgets on the home screen]**

**NARRATOR:**

> "The home screen also features **desktop widgets** — small, always-visible cards that give you quick information:
>
> - The **Weather Widget** shows current conditions, temperature, and forecasts for your location.
> - The **Note Widget** gives you a quick-access sticky note right on your desktop.
> - The **Booster Widget** provides a one-click system optimization button with live status — like a quick-clean shortcut.
>
> These widgets layer beautifully on top of the wallpaper with frosted glass effects."

---

### **[19:00 – 20:00] CLOSING — The Bigger Picture**

**[VISUAL: Slow zoom out from the Cockpit desktop to a cinematic wide shot]**

**NARRATOR:**

> "So let's step back and think about what you've just seen.
>
> Cockpit isn't another server dashboard or monitoring tool. It's a **complete operating surface** — a desktop environment that runs in the browser and gives non-technical and technical users alike the ability to fully manage cloud infrastructure.
>
> You've got a lock screen with secure PIN authentication. An onboarding wizard that sets up a server with a single command. A full desktop environment with a dock, menu bar, and window management. A file explorer that lets you browse, create, edit, and delete files on remote servers. A real SSH terminal with multi-tab support. A task monitor with live metrics, process management, and system optimization. Deep server settings covering SSH keys, firewalls, ports, runtimes, Docker, databases, and user management. A photo gallery with cloud-powered uploads. A notepad, calendar, mail client, music player, web browser, and video calling — all in one unified interface.
>
> **For investors**: This is a platform play. Every cloud server in the world needs management. Cockpit turns that into a consumer-grade experience with enterprise capabilities. The architecture is modular — the Cocktail Agent can be extended to support new task types. The server backend is NestJS, production-ready, and horizontally scalable.
>
> **For acquisition partners**: The codebase is modern, well-structured, and built on proven technologies — React, Next.js, NestJS, WebSockets, TypeScript end to end. The agent, the server, and the frontend are fully decoupled. You could deploy this as SaaS, self-hosted, or white-labeled.
>
> **For users**: You don't need to be a Linux expert anymore. You just need Cockpit.
>
> Thank you for watching. If you'd like a live demo or deeper technical walkthrough, we'd love to connect."

**[VISUAL: Reglook logo + "cockpit.reglook.com" + contact info]**

**[MUSIC: Fades out]**

---

## 📊 SCRIPT STATISTICS

| Metric | Value |
|--------|-------|
| **Total Duration** | ~20 minutes |
| **Total Words** | ~2,800 |
| **Screens Covered** | 14+ screens |
| **Apps Demonstrated** | 14 apps |
| **Key Architecture Pieces** | 3 (Cockpit, Server, Agent) |
| **Target Audience** | Investors, Partners, Users |

---

## 🎯 KEY TALKING POINTS SUMMARY

1. **Problem**: Server management is stuck in 2005 — terminal-only, command-line driven, intimidating.
2. **Solution**: Cockpit — a browser-based desktop that makes server management feel natural.
3. **Architecture**: Three-part system (Frontend + Backend Server + On-Device Agent).
4. **Onboarding**: One-command setup — paste a script, agent installs, you're managing.
5. **14 Built-in Apps**: File Explorer, Terminal, Task Monitor, Settings, Gallery, xCloud Drive, Notepad, Calendar, Mail, Music, Browser, FaceTime, Finder, Google.
6. **Real-Time**: WebSocket-powered metrics, live terminal sessions, instant file operations.
7. **Security**: PIN-protected lock screen, secure WebSocket tunneling, SHA-256 file verification.
8. **Developer Experience**: TypeScript end-to-end, React/Next.js frontend, NestJS backend, modular agent.
9. **Market Opportunity**: Every cloud server in the world is a potential user.
10. **Differentiator**: Not a dashboard — a full operating surface with desktop-class UX.
