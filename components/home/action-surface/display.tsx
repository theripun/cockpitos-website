"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Monitor, Palette, Plus, Minus, Settings } from "lucide-react";

interface DisplaySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const resolutions = [
  "1920×1080",
  "1440×900", 
  "1280×720",
  "2560×1440",
  "3840×2160",
];

const colorProfiles = [
  "sRGB",
  "Adobe RGB",
  "P3",
  "Rec. 2020",
];

export function DisplaySettings({ isOpen, onClose }: DisplaySettingsProps) {
  const [brightness, setBrightness] = useState(75);
  const [resolution, setResolution] = useState(resolutions[0]);
  const [colorProfile, setColorProfile] = useState(colorProfiles[0]);
  
  // Simulate system display settings
  useEffect(() => {
    if (isOpen) {
      // Load saved settings or defaults
      setBrightness(parseInt(localStorage.getItem('displayBrightness') || '75'));
      setResolution(localStorage.getItem('displayResolution') || resolutions[0]);
      setColorProfile(localStorage.getItem('displayColorProfile') || colorProfiles[0]);
    }
  }, [isOpen]);
  
  const saveSettings = () => {
    localStorage.setItem('displayBrightness', brightness.toString());
    localStorage.setItem('displayResolution', resolution);
    localStorage.setItem('displayColorProfile', colorProfile);
    
    // Dispatch event to update system display
    const event = new CustomEvent('displaySettingsChanged', {
      detail: { brightness, resolution, colorProfile }
    });
    document.dispatchEvent(event);
    
    onClose();
  };
  
  const cancelChanges = () => {
    // Restore previous settings
    setBrightness(parseInt(localStorage.getItem('displayBrightness') || '75'));
    setResolution(localStorage.getItem('displayResolution') || resolutions[0]);
    setColorProfile(localStorage.getItem('displayColorProfile') || colorProfiles[0]);
    
    onClose();
  };
  
  const increaseBrightness = () => {
    if (brightness < 100) {
      setBrightness(prev => Math.min(100, prev + 5));
    }
  };
  
  const decreaseBrightness = () => {
    if (brightness > 0) {
      setBrightness(prev => Math.max(0, prev - 5));
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[2001] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-zinc-950 backdrop-blur-lg rounded-3xl border border-white/5 w-full max-w-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Monitor className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">Display Settings</h2>
              </div>
              <button 
                onClick={cancelChanges}
                className="p-1.5 rounded-md hover:bg-white/10 text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Brightness Control */}
              <div className="bg-zinc-900/50 rounded-2xl p-5 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <Sun className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-medium text-white">Brightness</h3>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={decreaseBrightness}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <div className="flex-1">
                    <div className="relative pt-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white/70">Level</span>
                        <span className="text-sm font-medium text-white">{brightness}%</span>
                      </div>
                      <div className="overflow-hidden h-2 bg-white/10 rounded-full">
                        <motion.div 
                          className="h-full bg-blue-500 rounded-full"
                          initial={false}
                          animate={{ width: `${brightness}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={increaseBrightness}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Resolution Control */}
              <div className="bg-zinc-900/50 rounded-2xl p-5 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <Monitor className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-medium text-white">Resolution</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {resolutions.map((res, index) => (
                    <button
                      key={index}
                      className={`py-3 px-4 rounded-xl text-center transition-colors ${resolution === res ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                      onClick={() => setResolution(res)}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Color Profile Control */}
              <div className="bg-zinc-900/50 rounded-2xl p-5 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <Palette className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-medium text-white">Color Profile</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {colorProfiles.map((profile, index) => (
                    <button
                      key={index}
                      className={`py-3 px-4 rounded-xl text-center transition-colors ${colorProfile === profile ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                      onClick={() => setColorProfile(profile)}
                    >
                      {profile}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={cancelChanges}
                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveSettings}
                className="flex-1 py-3 px-4 bg-blue-700 hover:bg-blue-700/80 text-white rounded-xl font-medium transition-colors"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}