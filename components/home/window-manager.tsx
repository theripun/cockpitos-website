"use client";

import React, { useState, useEffect, useRef, createContext, useContext } from "react";

interface WindowManagerProps {
    children: React.ReactNode;
    appName: string;
    isOpen: boolean;
    zIndex?: number;
    onClick?: () => void;
}

interface ZIndexContextType {
    bringToFront: (appName: string) => number;
    getZIndex: (appName: string) => number;
    globalMaxZ: number;
}

const ZIndexContext = createContext<ZIndexContextType | null>(null);

export function useZIndex() {
    const context = useContext(ZIndexContext);
    if (!context) {
        throw new Error("useZIndex must be used within a ZIndexProvider");
    }
    return context;
}

export function ZIndexProvider({ children }: { children: React.ReactNode }) {
    const [globalMaxZ, setGlobalMaxZ] = useState(100);
    const appZIndices = useRef<Record<string, number>>({});

    const bringToFront = (appName: string) => {
        setGlobalMaxZ(prev => {
            const newZ = prev + 1;
            appZIndices.current[appName] = newZ;
            return newZ;
        });
        return globalMaxZ + 1;
    };

    const getZIndex = (appName: string) => {
        if (!appZIndices.current[appName]) {
            setGlobalMaxZ(prev => {
                const newZ = prev + 1;
                appZIndices.current[appName] = newZ;
                return newZ;
            });
            return globalMaxZ + 1;
        }
        return appZIndices.current[appName];
    };

    const contextValue: ZIndexContextType = {
        bringToFront,
        getZIndex,
        globalMaxZ
    };

    return (
        <ZIndexContext.Provider value={contextValue}>
            {children}
        </ZIndexContext.Provider>
    );
}

export const WindowManager = React.forwardRef(({ children, appName, isOpen, zIndex: externalZIndex, onClick }: WindowManagerProps, ref: React.Ref<{ bringToFront: () => void }>) => {
    const [internalZIndex, setInternalZIndex] = useState(100);
    const { bringToFront, getZIndex } = useZIndex();
    const containerRef = useRef<HTMLDivElement>(null);
    
    React.useImperativeHandle(ref, () => ({
        bringToFront: () => {
            const newZ = bringToFront(appName);
            setInternalZIndex(newZ);
        }
    }));

    // Update z-index when app opens
    useEffect(() => {
        if (isOpen) {
            const newZ = getZIndex(appName);
            setInternalZIndex(newZ);
        }
    }, [isOpen, appName, getZIndex]);

    // Handle click to bring to front
    const handleClick = (e: React.MouseEvent) => {
        if (isOpen) {
            const newZ = bringToFront(appName);
            setInternalZIndex(newZ);
            
            // Call parent onClick if provided
            if (onClick) {
                onClick();
            }
            
            e.stopPropagation();
        }
    };

    if (!isOpen) {
        return null;
    }

    if (!isOpen) {
        return null;
    }

    // Wrap the children in a div with the z-index style
    return (
        <div 
            style={{ zIndex: externalZIndex || internalZIndex }}
            onClick={handleClick}
            className="fixed inset-0 pointer-events-none flex items-center justify-center"
        >
            {children}
        </div>
    );
});

// Define the displayName for the forwardRef component
WindowManager.displayName = 'WindowManager';