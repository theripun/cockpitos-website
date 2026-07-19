"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getCsrfToken } from "@/lib/utils";
import { BASE_URL } from "@/lib/baseURL";

interface BackgroundSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeBackground: (imagePath: string) => void;
  currentBackground: string;
}

const SUPPORTED_WALLPAPER_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);

const numberedWallpaperFiles = Array.from({ length: 77 }, (_, i) => `${i + 1}.jpg`);

const backgroundImages = numberedWallpaperFiles
  .filter((filename) => SUPPORTED_WALLPAPER_EXTENSIONS.has(filename.split(".").pop()?.toLowerCase() ?? ""))
  .map((filename) => `/wallpaper/${filename}`);

export function BackgroundSelector({
  isOpen,
  onClose,
  onChangeBackground,
  currentBackground,
}: BackgroundSelectorProps) {
  const [selectedImage, setSelectedImage] = useState(currentBackground || backgroundImages[0]);
  const [previewImage, setPreviewImage] = useState(currentBackground || backgroundImages[0]);

  const selectedIndex = backgroundImages.indexOf(selectedImage);
  const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;

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
      const initialImage = currentBackground || backgroundImages[0];
      setSelectedImage(initialImage);
      setPreviewImage(initialImage);
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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-zinc-950 rounded-3xl border border-white/5 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
          style={{ width: "90vw" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* IMPORTANT: h-full + min-h-0 makes inner scroll work */}
          <div className="flex flex-col h-full min-h-0">
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

            {/* IMPORTANT: min-h-0 here too */}
            <div className="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row">
              {/* LEFT - Preview Section */}
              <div className="w-full md:w-1/2 p-4 flex flex-col min-h-0 bg-white/[0.02]" style={{ minWidth: "300px" }}>
                <div className="relative rounded-2xl overflow-hidden border border-white/10 flex-1 min-h-[200px] shadow-2xl">
                  {previewImage && (
                    <Image src={previewImage} alt="Preview background" fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 50vw" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Preview</p>
                    <p className="text-sm font-semibold text-white truncate">Background {selectedIndex >= 0 ? selectedIndex + 1 : 1}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handlePrev}
                    className="flex-1 py-2.5 px-4 bg-transparent hover:bg-white/5 text-white rounded-sm flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-xs font-semibold">Prev</span>
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 py-2.5 px-4 bg-transparent hover:bg-white/5 text-white rounded-sm flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/5"
                  >
                    <span className="text-xs font-semibold">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleApply}
                  className="mt-3 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
                >
                  Apply Wallpaper
                </button>
              </div>

              {/* RIGHT - Scroller Section */}
              <div className="w-full md:w-1/2 p-6 border-l border-white/10 flex flex-col min-h-0 bg-black/20" style={{ minWidth: "300px" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-sm tracking-tight">Gallery</h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-zinc-500 uppercase">
                    {backgroundImages.length} Items
                  </span>
                </div>

                {/* SCROLLER */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {backgroundImages.map((img, index) => {
                      const isActive = selectedImage === img;
                      return (
                        <button
                          key={img}
                          type="button"
                          className={[
                            "group text-left rounded-2xl overflow-hidden border transition-all duration-300 relative aspect-[4/5]",
                            isActive
                              ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/10"
                              : "border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.08]",
                          ].join(" ")}
                          onClick={() => {
                            setSelectedImage(img);
                            setPreviewImage(img);
                          }}
                        >
                          <Image
                            src={img}
                            alt={`Background ${index + 1}`}
                            fill
                            className={[
                              "object-cover transition-transform duration-500",
                              isActive ? "scale-110" : "group-hover:scale-105"
                            ].join(" ")}
                            sizes="(max-width: 1024px) 50vw, 25vw"
                          />
                          <div className={[
                            "absolute inset-0 transition-opacity duration-300",
                            isActive ? "bg-blue-500/10" : "bg-black/0 group-hover:bg-black/20"
                          ].join(" ")} />

                          {isActive && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border border-white/20">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            </div>
                          )}

                          <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-[10px] font-bold text-white/90 truncate">Wallpaper {index + 1}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
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

export function BackgroundChanger({
  currentBackground = "",
  onChangeBackground,
}: BackgroundChangerProps) {
  const [background, setBackground] = useState(currentBackground);
  const [showSelector, setShowSelector] = useState(false);



  const handleChangeBackground = async (newBackground: string) => {
    setBackground(newBackground);
    onChangeBackground?.(newBackground);

    // Save to backend
    const match = newBackground.match(/\/wallpaper\/(\d+)\.jpg/);
    if (match && match[1]) {
      const id = parseInt(match[1]);
      try {
        await fetch(`${BASE_URL}/cockpit/wallpaper`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': getCsrfToken()
          },
          credentials: 'include',
          body: JSON.stringify({ wallpaperId: id })
        });
      } catch (e) {
        console.error("Failed to save wallpaper", e);
      }
    }
  };

  useEffect(() => {
    if (currentBackground) {
      setBackground(currentBackground);
    }
  }, [currentBackground]);

  // Fetch initial wallpaper
  useEffect(() => {
    const fetchWallpaper = async () => {
      try {
        const res = await fetch(`${BASE_URL}/cockpit/wallpaper`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.wallpaperId) {
            const newBg = `/wallpaper/${data.wallpaperId}.jpg`;
            setBackground(newBg);
            onChangeBackground?.(newBg);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to fetch wallpaper", e);
      }

      // Fallback if no wallpaper set
      if (!background) {
        const defaultBg = "/wallpaper/49.jpg";
        setBackground(defaultBg);
        onChangeBackground?.(defaultBg);
      }
    };
    fetchWallpaper();
  }, []);

  useEffect(() => {
    const handleOpenSelector = () => setShowSelector(true);
    document.addEventListener("openBackgroundSelector", handleOpenSelector);
    return () => document.removeEventListener("openBackgroundSelector", handleOpenSelector);
  }, []);

  return (
    <>
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={false}
        animate={{ backgroundImage: background ? `url('${background}')` : 'none' }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {background && (
          <Image src={background} alt="cockpit Wallpaper" fill priority className="object-cover scale-105 opacity-100" sizes="100vw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </motion.div>

      <BackgroundSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        onChangeBackground={handleChangeBackground}
        currentBackground={background}
      />
    </>
  );
}
