"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BootPage() {
  const [bootStage, setBootStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  
  // Deterministic particle positions to avoid hydration mismatch
  const particlePositions = [
    { x: 0.1, y: 0.2 }, { x: 0.3, y: 0.8 }, { x: 0.7, y: 0.1 }, { x: 0.9, y: 0.6 },
    { x: 0.2, y: 0.4 }, { x: 0.8, y: 0.3 }, { x: 0.4, y: 0.9 }, { x: 0.6, y: 0.2 },
    { x: 0.15, y: 0.7 }, { x: 0.85, y: 0.5 }, { x: 0.5, y: 0.15 }, { x: 0.35, y: 0.65 },
    { x: 0.65, y: 0.85 }, { x: 0.25, y: 0.35 }, { x: 0.75, y: 0.45 }, { x: 0.45, y: 0.75 },
    { x: 0.1, y: 0.9 }, { x: 0.9, y: 0.2 }, { x: 0.3, y: 0.5 }, { x: 0.7, y: 0.8 },
    { x: 0.2, y: 0.1 }, { x: 0.8, y: 0.7 }, { x: 0.5, y: 0.3 }, { x: 0.4, y: 0.6 },
    { x: 0.6, y: 0.9 }, { x: 0.15, y: 0.4 }, { x: 0.85, y: 0.25 }, { x: 0.35, y: 0.85 },
    { x: 0.65, y: 0.15 }, { x: 0.25, y: 0.65 }, { x: 0.75, y: 0.35 }, { x: 0.45, y: 0.85 },
    { x: 0.1, y: 0.6 }, { x: 0.9, y: 0.4 }, { x: 0.3, y: 0.2 }, { x: 0.7, y: 0.5 },
    { x: 0.2, y: 0.8 }, { x: 0.8, y: 0.1 }, { x: 0.5, y: 0.7 }, { x: 0.4, y: 0.3 },
    { x: 0.6, y: 0.6 }, { x: 0.15, y: 0.9 }, { x: 0.85, y: 0.35 }, { x: 0.35, y: 0.15 },
    { x: 0.65, y: 0.45 }, { x: 0.25, y: 0.85 }, { x: 0.75, y: 0.25 }, { x: 0.45, y: 0.55 },
    { x: 0.1, y: 0.3 }, { x: 0.9, y: 0.7 }
  ];

  const bootStages = [
    { text: "Starting up...", duration: 2000 },
  ];

  useEffect(() => {
    // Set dimensions after mount to avoid window object on server
    setDimensions({
      width: typeof window !== 'undefined' ? window.innerWidth : 1920,
      height: typeof window !== 'undefined' ? window.innerHeight : 1080
    });
    if (bootStage < bootStages.length) {
      const timer = setTimeout(() => {
        setBootStage(prev => prev + 1);
        setProgress(((bootStage + 1) / bootStages.length) * 100);
      }, bootStages[bootStage].duration);

      return () => clearTimeout(timer);
    } else {
      // Boot complete - show login
      const loginTimer = setTimeout(() => {
        setShowLogin(true);
      }, 800);

      return () => clearTimeout(loginTimer);
    }
  }, [bootStage]);

  useEffect(() => {
    if (bootStage >= bootStages.length) {
      // Boot complete - redirect directly
      setTimeout(() => {
        window.location.href = "http://localhost:3000";
      }, 500);
    }
  }, [bootStage]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">


      <AnimatePresence mode="wait">
        {/* Boot Animation Sequence */}
        <motion.div
          key="boot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-center z-10"
        >
            {/* Apple-style logo animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="mb-12"
            >
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 blur-xl bg-white/10 rounded-full"
                />
                <div className="relative w-32 h-32 mx-auto">
                  <svg 
                    width="128" 
                    height="128" 
                    viewBox="0 0 603 501" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-2xl"
                  >
                    <mask id="mask0_2007_124" style={{maskType: "luminance"}} maskUnits="userSpaceOnUse" x="0" y="0" width="402" height="402">
                      <path d="M401.149 131.511L131.511 0L-0.000115037 269.638L269.638 401.15L401.149 131.511Z" fill="white"/>
                    </mask>
                    <g mask="url(#mask0_2007_124)">
                      <path d="M131.15 205.3L70.2737 137.895C66.2727 133.463 70.5286 126.412 77.1785 126.457L389.812 128.567C396.056 128.608 398.769 136.485 393.873 140.363L148.814 334.501C143.601 338.631 135.907 335.695 136.331 329.739L142.803 239.144C143.691 226.746 139.482 214.523 131.15 205.3Z" fill="white"/>
                    </g>
                    <mask id="mask1_2007_124" style={{maskType: "luminance"}} maskUnits="userSpaceOnUse" x="201" y="99" width="402" height="402">
                      <path d="M201 368.639L470.638 500.15L602.15 230.512L332.511 99.0003L201 368.639Z" fill="white"/>
                    </mask>
                    <g mask="url(#mask1_2007_124)">
                      <path d="M471 294.849L531.876 362.255C535.877 366.687 531.621 373.737 524.971 373.693L212.338 371.583C206.093 371.542 203.381 363.664 208.276 359.787L453.336 165.648C458.548 161.519 466.243 164.455 465.818 170.41L459.347 261.006C458.459 273.403 462.668 285.627 471 294.849Z" fill="white"/>
                    </g>
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "200px", opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="h-1 bg-white/20 rounded-full mx-auto mb-8 overflow-hidden"
            >
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </motion.div>

            {/* Status text */}
            {/* <motion.div
              key={bootStage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-white/80 text-sm font-light tracking-wide"
            >
              {bootStages[bootStage]?.text || "Starting up..."}
            </motion.div> */}

            {/* Loading dots */}
            {/* <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex justify-center gap-1 mt-4"
            >
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-white/60 rounded-full" />
              ))}
            </motion.div> */}
          </motion.div>
      </AnimatePresence>
    </div>
  );
}