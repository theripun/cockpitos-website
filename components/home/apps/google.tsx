"use client";

import React, { useEffect } from "react";

interface GoogleProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Google({ isOpen, onClose }: GoogleProps) {
    useEffect(() => {
        if (!isOpen) return;

        // Trick: Open Google search in new tab immediately
        window.open("https://www.google.com", "_blank");

        // Close the ghost window immediately
        onClose();
    }, [isOpen, onClose]);

    return null;
}
