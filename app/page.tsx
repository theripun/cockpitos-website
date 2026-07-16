"use client";

import React, { Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Greetings } from "@/components/setup/greetings";
import { Menubar } from "@/components/home/menubar";
import { GlassInterface } from "@/components/common/glass-interface";
import { SetupForm } from "@/components/setup/setup-form";
import { LoginForm } from "@/components/setup/login-form";
import { DeviceSelectionModal } from "@/components/setup/device-selection-modal"; // Import new component
import { PostAuthPricing } from "@/components/setup/post-auth-pricing";
import { AnimatePresence, motion } from "framer-motion";
import { BASE_URL } from "@/lib/baseURL";
import {
  detectCheckoutRegionSlug,
  readStoredCheckoutRegionSlug,
  storeCheckoutRegionSlug,
} from "@/lib/checkout-region";
import { shouldShowPricingForUser } from "@/lib/plan-access";

type SetupDevice = {
  id: string;
  name: string;
  host: string;
  username: string;
  status?: string;
};

async function fetchCurrentUserPlan() {
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, { credentials: "include" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isConfigure = searchParams.get('configure') === 'true';
  const isDevices = searchParams.get('devices') === 'true';
  /** Deep-link straight to the sign-in screen (same idea as `configure=true` / `devices=true`). */
  const isSignin = searchParams.get('signin') === 'true';
  /** Deep-link straight to Plans / post-auth pricing when already signed in. */
  const isPricing = searchParams.get('pricing') === 'true';
  const skipGreetings = isConfigure || isDevices || isSignin || isPricing;

  const [stage, setStage] = React.useState<'loading' | 'greetings' | 'login' | 'pricing' | 'setup' | 'device-selection'>(skipGreetings ? 'loading' : 'greetings');
  const [musicReady, setMusicReady] = React.useState(skipGreetings);
  const [devices, setDevices] = React.useState<SetupDevice[]>([]);

  const goHome = React.useCallback(() => {
    window.location.replace('/home');
  }, []);

  React.useEffect(() => {
    const checkSession = async () => {
      try {
        if (skipGreetings) {
          try {
            const res = await fetch(`${BASE_URL}/cockpit/vps`, { credentials: "include" });
            if (res.ok) {
              const data = await res.json();
              const devs = Array.isArray(data) ? data as SetupDevice[] : [];
              setDevices(devs);

              if (devs.length > 0 && (isConfigure || isDevices)) {
                goHome();
                return;
              }

              if (isConfigure) {
                setStage('setup');
              } else if (isDevices) {
                setStage('setup');
              } else if (isSignin) {
                goHome();
                return;
              } else if (isPricing) {
                const user = await fetchCurrentUserPlan();
                if (shouldShowPricingForUser(user)) {
                  setStage('pricing');
                } else if (devs.length > 0) {
                  goHome();
                  return;
                } else {
                  setStage('setup');
                  router.replace(`/${readStoredCheckoutRegionSlug() ?? "in"}?configure=true`, { scroll: false });
                }
              } else {
                setStage('login');
              }
            } else {
              setStage('login');
            }
          } catch {
            setStage('login');
          }
          return;
        }

        const res = await fetch(`${BASE_URL}/cockpit/vps`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setDevices(Array.isArray(data) ? data as SetupDevice[] : []);
        }
      } catch (err) {
        console.error("Session check failed:", err);
      }
    };

    checkSession();
  }, [goHome, isConfigure, isDevices, isSignin, isPricing, router, skipGreetings]);

  React.useEffect(() => {
    if (!skipGreetings) return;
    let cancelled = false;
    (async () => {
      const slug = await detectCheckoutRegionSlug();
      if (cancelled || typeof window === "undefined") return;
      storeCheckoutRegionSlug(slug);
      const search = window.location.search || "";
      router.replace(`/${slug}${search}`, { scroll: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [skipGreetings, router]);

  /**
   * After the policy screen: re-check session (avoids stale state if the user finished before the
   * initial /cockpit/vps fetch completed), then sync the URL with Next router and open the right step.
   */
  const completeAfterPolicy = React.useCallback(async () => {
    let slug = readStoredCheckoutRegionSlug();
    if (!slug) {
      slug = await detectCheckoutRegionSlug();
      storeCheckoutRegionSlug(slug);
    }

    try {
      const res = await fetch(`${BASE_URL}/cockpit/vps`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const devs = Array.isArray(data) ? data : [];
        setDevices(devs);
        const user = await fetchCurrentUserPlan();
        const shouldShowPricing = shouldShowPricingForUser(user);

        const p = new URLSearchParams();
        if (shouldShowPricing && !isConfigure) {
          p.set("pricing", "true");
        } else if (isConfigure) {
          p.set("configure", "true");
        } else if (devs.length > 0) {
          goHome();
          return;
        } else {
          p.set("configure", "true");
        }
        router.replace(`/${slug}?${p.toString()}`, { scroll: false });

        if (shouldShowPricing && !isConfigure) {
          setStage("pricing");
        } else if (isConfigure) {
          setStage("setup");
        } else if (devs.length > 0) {
          goHome();
        } else {
          setStage("setup");
        }
      } else {
        router.replace(`/${slug}?signin=true`, { scroll: false });
        setDevices([]);
        setStage("login");
      }
    } catch {
      router.replace(`/${slug}?signin=true`, { scroll: false });
      setDevices([]);
      setStage("login");
    }
  }, [goHome, isConfigure, router]);

  const proceedAfterPricing = React.useCallback(() => {
    void (async () => {
      let slug = readStoredCheckoutRegionSlug();
      if (!slug) {
        slug = await detectCheckoutRegionSlug();
        storeCheckoutRegionSlug(slug);
      }
      if (devices.length > 0 && !isConfigure) {
        goHome();
      } else {
        router.replace(`/${slug}?configure=true`, { scroll: false });
        setStage("setup");
      }
    })();
  }, [devices.length, goHome, isConfigure, router]);

  const handleLoginSuccess = async () => {
    try {
      const res = await fetch(`${BASE_URL}/cockpit/vps`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const devicesList = Array.isArray(data) ? data as SetupDevice[] : [];
        setDevices(devicesList);
        let slug = readStoredCheckoutRegionSlug();
        if (!slug) {
          slug = await detectCheckoutRegionSlug();
          storeCheckoutRegionSlug(slug);
        }
        const user = await fetchCurrentUserPlan();
        if (shouldShowPricingForUser(user)) {
          router.replace(`/${slug}?pricing=true`, { scroll: false });
          setStage("pricing");
        } else if (devicesList.length > 0) {
          goHome();
        } else {
          router.replace(`/${slug}?configure=true`, { scroll: false });
          setStage("setup");
        }
      } else {
        setStage('setup');
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      setStage('setup');
    }
  };

  const handleDeviceSelect = () => {
    // Here we could store the selected device ID in local storage or context if needed
    // For now, assume /home handles default or stored state
    window.location.href = '/home';
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black font-sans selection:bg-white/20">
      {/* Hidden glass interface just to include the SVG filter once for the whole page */}
      <div className="hidden">
        <GlassInterface includeSvgFilter={true}>
          <div />
        </GlassInterface>
      </div>

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/wallpaper/67.jpg"
          alt="Setup Background"
          fill
          priority
          quality={100}
          className="object-cover blur-sm"
        />
        {/* Subtle overlay with blur */}
        <div className={`absolute inset-0 bg-black/20 transition-all duration-1000 ${stage !== 'greetings' ? "backdrop-blur-xl" : "backdrop-blur-md"}`} />
      </div>

      {/* Background Animation */}
      <AnimatePresence>
        {stage === 'greetings' && musicReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 z-10"
          >
            <Greetings onComplete={() => void completeAfterPolicy()} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menubar */}
      <Menubar
        showFullMenus={false}
        showSystemMonitor={false}
        showSearch={false}
        transparent={true}
        showMusicExperience
        onMusicExperienceReady={() => setMusicReady(true)}
      />

      {/* Main Content Area — must not sit above greetings (z-10) when empty or it steals wheel/touch */}
      <main
        className={`relative min-h-screen flex items-center justify-center p-6 ${
          stage === "greetings" || stage === "loading"
            ? "pointer-events-none z-[5]"
            : "z-20 pointer-events-auto"
        }`}
      >
        <AnimatePresence mode="wait">
          {stage === "login" && (
            <div key="login" className="pointer-events-auto">
              <LoginForm onSuccess={handleLoginSuccess} />
            </div>
          )}
          {stage === "pricing" && (
            <div key="pricing" className="pointer-events-auto flex w-full max-w-[1180px] items-center justify-center">
              <PostAuthPricing
                onContinueFree={proceedAfterPricing}
                onContinuePro={proceedAfterPricing}
              />
            </div>
          )}
          {stage === "device-selection" && (
            <div key="device-selection" className="pointer-events-auto">
              <DeviceSelectionModal
                devices={devices}
                onSelect={handleDeviceSelect}
                onConfigureNew={() => {
                  const slug = readStoredCheckoutRegionSlug() ?? "intl";
                  window.location.href = `/${slug}?configure=true`;
                }}
              />
            </div>
          )}
          {stage === "setup" && (
            <div key="setup" className="pointer-events-auto">
              <SetupForm />
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-white/50 animate-spin"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
