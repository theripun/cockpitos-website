# Desktop Context Menu

## Overview
Added macOS-style right-click context menu functionality to the Cockpit desktop interface.

## Features
- **Right-click anywhere** on the desktop to open the context menu
- **Glass morphism design** matching the existing UI aesthetic
- **Hierarchical submenu system** with smooth animations
- **Keyboard navigation** support (Escape to close)
- **Intelligent positioning** to stay within viewport bounds
- **Smart submenu placement** (switches sides when near screen edges)
- **System-level options** similar to macOS

## Menu Options

### File Operations
- New Finder Window (⌘N)
- New Folder (⇧⌘N)
- New Terminal
- Get Info (⌘I)
- Change Desktop Background

### System Controls
- **Display Settings**
  - Brightness adjustment
  - Resolution selection
  - Color profile management
- **Sound Settings**
  - Volume control
  - Output device selection

### System Preferences
- Direct access to System Preferences
- Recent Items management
- Force Quit applications (⌥⌘⎋)

### Power Options
- Sleep
- Restart
- Shut Down
- Lock Screen (⌃⌘Q)
- Log Out (⇧⌘Q)

## Implementation Details

### Components
- `DesktopContextMenu` - Main context menu component
- Uses `GlassInterface` for consistent styling
- Built with `framer-motion` for smooth animations
- Fully typed with TypeScript

### Usage
The context menu is automatically attached to the main desktop area in `app/home/page.tsx`:

```tsx
<div 
    className="relative min-h-screen w-full overflow-hidden bg-black"
    onContextMenu={handleContextMenu}
>
    {/* ... desktop content ... */}
    
    {contextMenu && (
        <DesktopContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={closeContextMenu}
        />
    )}
</div>
```

### Styling
- Matches macOS context menu aesthetics
- Glass morphism effect with backdrop blur
- Subtle hover states and transitions
- Proper z-index management (z-[1000])
- **Viewport-aware positioning** prevents menu cutoff
- **Adaptive submenu placement** (left/right based on available space)

## Future Enhancements
- [ ] Add more system integration
- [ ] Customizable menu items
- [ ] User preferences for menu layout
- [ ] Additional display options
- [ ] Network settings integration