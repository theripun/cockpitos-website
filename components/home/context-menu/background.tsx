"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { GlassInterface } from "@/components/common/glass-interface";
import { Settings, X, ChevronLeft, ChevronRight } from "lucide-react";

interface BackgroundSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeBackground: (imagePath: string) => void;
  currentBackground: string;
}

const backgroundImages = [
  "/wallpaper/1.jpg",
  "/wallpaper/2.jpg",
  "/wallpaper/3.jpg",
  "/wallpaper/4.jpg",
  "/wallpaper/5.jpg",
  "/wallpaper/6.jpg",
  "/wallpaper/7.jpg",
  "/wallpaper/8.jpg",
  "/wallpaper/9.jpg",
  "/wallpaper/10.jpg",
  "/wallpaper/11.jpg",
  "/wallpaper/12.jpg",
];

export function BackgroundSelector({ isOpen, onClose, onChangeBackground, currentBackground }: BackgroundSelectorProps) {
  const [selectedImage, setSelectedImage] = useState(currentBackground);
  const [previewImage, setPreviewImage] = useState(currentBackground);

  const currentIndex = backgroundImages.indexOf(selectedImage);

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % backgroundImages.length;
    setSelectedImage(backgroundImages[nextIndex]);
    setPreviewImage(backgroundImages[nextIndex]);
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + backgroundImages.length) % backgroundImages.length;
    setSelectedImage(backgroundImages[prevIndex]);
    setPreviewImage(backgroundImages[prevIndex]);
  };

  const handleApply = () => {
    onChangeBackground(selectedImage);
    onClose();
  };

  const handleCancel = () => {
    setPreviewImage(currentBackground);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedImage(currentBackground);
      setPreviewImage(currentBackground);
    }
  }, [isOpen, currentBackground]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[2001] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-zinc-950 backdrop-blur-lg rounded-3xl border border-white/5 w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-white" />
                <h2 className="text-lg font-semibold text-white">Cockpit Background</h2>
              </div>
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-md hover:bg-white/10 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Preview Section - Hidden on mobile */}
              <div className="hidden md:flex md:w-1/2 p-4 flex-col">
                <div className="mb-4 relative rounded-lg overflow-hidden border border-white/10 flex-1 min-h-[300px]">
                  <Image
                    src={previewImage}
                    alt="Preview background"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handlePrev}
                    className="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleApply}
                  className="mt-4 py-2.5 px-4 bg-blue-700 hover:bg-blue-700/80 text-white rounded-lg font-medium transition-colors"
                >
                  Apply Changes
                </button>
              </div>

              {/* Thumbnails Section - Full width on mobile, half on desktop */}
              <div className="w-full md:w-1/2 p-4 md:border-l md:border-white/10 overflow-y-auto max-h-[calc(90vh-100px)]">
                <h3 className="text-white font-medium mb-3">Choose a picture</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {backgroundImages.map((img, index) => (
                    <div
                      key={index}
                      className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedImage === img ? 'border-blue-500' : 'border-transparent'}`}
                      onClick={() => {
                        setSelectedImage(img);
                        setPreviewImage(img);
                      }}
                    >
                      <div className="aspect-video relative">
                        <Image
                          src={img}
                          alt={`Background ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-2 text-xs text-white truncate bg-black/30">
                        Background {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface BackgroundChangerProps {
  currentBackground?: string;
  onChangeBackground?: (imagePath: string) => void;
}

export function BackgroundChanger({ currentBackground = "/wallpaper/49.jpg", onChangeBackground }: BackgroundChangerProps) {
  const [background, setBackground] = useState(currentBackground);
  const [showSelector, setShowSelector] = useState(false);

  const handleChangeBackground = (newBackground: string) => {
    setBackground(newBackground);
    onChangeBackground?.(newBackground);
  };

  useEffect(() => {
    const handleOpenSelector = () => {
      setShowSelector(true);
    };

    document.addEventListener('openBackgroundSelector', handleOpenSelector);

    return () => {
      document.removeEventListener('openBackgroundSelector', handleOpenSelector);
    };
  }, []);

  return (
    <>
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={false}
        animate={{ backgroundImage: `url('${background}')` }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <Image
          src={background}
          alt="cockpit Wallpaper"
          fill
          priority
          className="object-cover scale-105 opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </motion.div>

      <BackgroundSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        onChangeBackground={handleChangeBackground}
        currentBackground={background}
      />

      {/* <button 
        onClick={() => setShowSelector(true)}
        className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-colors z-[100] hidden md:block"
      >
        Change Background
      </button> */}
    </>
  );
}