"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GlassInterface } from "@/components/common/glass-interface";
import { cn } from "@/lib/utils";
import { Cloud, CloudSun, Sun, CloudRain, CloudSnow, CloudLightning, MapPin } from "lucide-react";

interface HourlySlot {
    time: string;
    temp: number;
    code: number;
    /** Vertical rule before this cell (first hour of tomorrow after today) */
    showDayDivider?: boolean;
}

interface WeatherData {
    location: string;
    temperature: number;
    condition: string;
    conditionCode: number;
    high: number;
    low: number;
    /** High/low for tomorrow (index 1 of daily) when available */
    tomorrowHigh?: number;
    tomorrowLow?: number;
    /** Third daily period (index 2) — day after tomorrow */
    dayAfterHigh?: number;
    dayAfterLow?: number;
    dayAfterLabel?: string;
    hourly: HourlySlot[];
}

interface HourlySeries {
    time: string[];
    temp: number[];
    code: number[];
}

// Map WMO weather codes to icons and descriptions
const getWeatherInfo = (code: number): { icon: React.ComponentType<{ className?: string }>; description: string } => {
    if (code === 0) return { icon: Sun, description: "Clear sky" };
    if (code === 1) return { icon: Sun, description: "Mainly clear" };
    if (code === 2) return { icon: CloudSun, description: "Partly cloudy" };
    if (code === 3) return { icon: Cloud, description: "Overcast" };
    if (code >= 45 && code <= 48) return { icon: Cloud, description: "Foggy" };
    if (code >= 51 && code <= 55) return { icon: CloudRain, description: "Drizzle" };
    if (code >= 56 && code <= 57) return { icon: CloudRain, description: "Freezing drizzle" };
    if (code >= 61 && code <= 65) return { icon: CloudRain, description: "Rain" };
    if (code >= 66 && code <= 67) return { icon: CloudRain, description: "Freezing rain" };
    if (code >= 71 && code <= 77) return { icon: CloudSnow, description: "Snow" };
    if (code >= 80 && code <= 82) return { icon: CloudRain, description: "Rain showers" };
    if (code >= 85 && code <= 86) return { icon: CloudSnow, description: "Snow showers" };
    if (code >= 95 && code <= 99) return { icon: CloudLightning, description: "Thunderstorm" };
    return { icon: Cloud, description: "Cloudy" };
};

const CACHE_KEY = "weather_cache";
const LOCATION_CHOICE_KEY = "weather_location_choice";
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes — balances freshness vs API load
const REFETCH_INTERVAL_MS = 10 * 60 * 1000;
const SLICE_TICK_MS = 60 * 1000; // re-slice hourly row every minute without refetch

const HOURLY_SLOT_COUNT = 6;
const UNKNOWN_LOCATION_LABEL = "N/A";

function normalizeLocationLabel(location?: string | null): string {
    const trimmed = location?.trim();
    if (
        !trimmed ||
        trimmed.toLowerCase() === "your location" ||
        /^\d+(\.\d+)?°[NS],\s*\d+(\.\d+)?°[EW]$/i.test(trimmed)
    ) {
        return UNKNOWN_LOCATION_LABEL;
    }
    return trimmed;
}

async function resolveLocationLabel(lat: number, lon: number): Promise<string> {
    try {
        const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        if (geoRes.ok) {
            const geoData = await geoRes.json();
            const label = normalizeLocationLabel(
                geoData.city ||
                geoData.locality ||
                geoData.principalSubdivision ||
                geoData.localityInfo?.administrative?.find?.((item: { name?: string; order?: number }) => (item.order ?? 0) >= 6)?.name ||
                geoData.countryName
            );
            if (label !== UNKNOWN_LOCATION_LABEL) return label;
        }
    } catch (geoError) {
        console.warn("BigDataCloud geocoding failed", geoError);
    }

    try {
        const osmRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`
        );
        if (osmRes.ok) {
            const osmData = await osmRes.json();
            const address = osmData.address ?? {};
            const label = normalizeLocationLabel(
                osmData.name ||
                address.city ||
                address.town ||
                address.village ||
                address.county ||
                address.state_district ||
                address.state ||
                address.country
            );
            if (label !== UNKNOWN_LOCATION_LABEL) return label;
        }
    } catch (geoError) {
        console.warn("OpenStreetMap geocoding failed", geoError);
    }

    return UNKNOWN_LOCATION_LABEL;
}

interface CachedWeather {
    location: string;
    temperature: number;
    condition: string;
    conditionCode: number;
    high: number;
    low: number;
    tomorrowHigh?: number;
    tomorrowLow?: number;
    dayAfterHigh?: number;
    dayAfterLow?: number;
    /** ISO date strings from Open-Meteo `daily.time` (today, tomorrow, …) */
    dailyTime?: string[];
    hourlySeries: HourlySeries;
    timestamp: number;
    lat: number;
    lon: number;
}

function formatDailyRowLabel(isoDate: string): string {
    try {
        const d = new Date(isoDate.length <= 10 ? `${isoDate}T12:00:00` : isoDate);
        return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    } catch {
        return "";
    }
}

/** Pick the “current” hour bucket, then the next N-1 hours (crosses midnight; uses ISO timestamps). */
function buildHourlySlice(series: HourlySeries, now: Date): HourlySlot[] {
    const { time, temp, code } = series;
    if (!time.length || time.length !== temp.length || time.length !== code.length) return [];

    let startIdx = 0;
    for (let i = time.length - 1; i >= 0; i--) {
        if (new Date(time[i]).getTime() <= now.getTime()) {
            startIdx = i;
            break;
        }
    }

    const todayStr = now.toDateString();
    const out: HourlySlot[] = [];

    for (let j = 0; j < HOURLY_SLOT_COUNT; j++) {
        const idx = startIdx + j;
        if (idx >= time.length) break;

        const d = new Date(time[idx]);
        const hourLabel = d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });

        const prevIdx = idx - 1;
        let showDayDivider = false;
        if (prevIdx >= 0) {
            const prev = new Date(time[prevIdx]);
            if (prev.toDateString() !== d.toDateString()) {
                showDayDivider = prev.toDateString() === todayStr && d.toDateString() !== todayStr;
            }
        }

        out.push({
            time: hourLabel,
            temp: Math.round(temp[idx]),
            code: code[idx],
            showDayDivider,
        });
    }

    return out;
}

function buildWeatherFromSeries(
    locationName: string,
    currentTemp: number,
    currentCode: number,
    dailyMax: number[],
    dailyMin: number[],
    series: HourlySeries,
    now: Date,
    dailyTime: string[] = []
): WeatherData {
    const hi0 = dailyMax[0] != null ? Math.round(dailyMax[0]) : Math.round(currentTemp);
    const lo0 = dailyMin[0] != null ? Math.round(dailyMin[0]) : Math.round(currentTemp);
    const hi1 = dailyMax[1] != null ? Math.round(dailyMax[1]) : undefined;
    const lo1 = dailyMin[1] != null ? Math.round(dailyMin[1]) : undefined;
    const hi2 = dailyMax[2] != null ? Math.round(dailyMax[2]) : undefined;
    const lo2 = dailyMin[2] != null ? Math.round(dailyMin[2]) : undefined;
    const dayAfterLabel =
        Boolean(dailyTime[2]) && hi2 !== undefined && lo2 !== undefined
            ? formatDailyRowLabel(dailyTime[2]!)
            : undefined;

    return {
        location: locationName,
        temperature: Math.round(currentTemp),
        condition: getWeatherInfo(currentCode).description,
        conditionCode: currentCode,
        high: hi0,
        low: lo0,
        tomorrowHigh: hi1,
        tomorrowLow: lo1,
        dayAfterHigh: hi2,
        dayAfterLow: lo2,
        dayAfterLabel: dayAfterLabel || undefined,
        hourly: buildHourlySlice(series, now),
    };
}

export function WeatherWidget() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [series, setSeries] = useState<HourlySeries | null>(null);
    const [meta, setMeta] = useState<{
        lat: number;
        lon: number;
        temperature: number;
        conditionCode: number;
        dailyMax: number[];
        dailyMin: number[];
        dailyTime: string[];
        location: string;
    } | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showLocationPrompt, setShowLocationPrompt] = useState(false);

    const applySliceFromSeries = useCallback(
        (
            s: HourlySeries,
            m: NonNullable<typeof meta>,
            locOverride?: string
        ) => {
            const now = new Date();
            const w = buildWeatherFromSeries(
                locOverride ?? m.location,
                m.temperature,
                m.conditionCode,
                m.dailyMax,
                m.dailyMin,
                s,
                now,
                m.dailyTime
            );
            setWeather(w);
        },
        []
    );

    const saveToCache = useCallback((payload: CachedWeather) => {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
        } catch (e) {
            console.warn("Cache write error:", e);
        }
    }, []);

    const fetchWeather = useCallback(async (
        lat: number,
        lon: number,
        isBackground = false,
        allowReverseGeocode = true
    ) => {
        try {
            if (!isBackground) {
                setLoading(true);
                setError(null);
            }

            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                    `&current=temperature_2m,weather_code` +
                    `&daily=temperature_2m_max,temperature_2m_min` +
                    `&hourly=temperature_2m,weather_code` +
                    `&timezone=auto&forecast_days=3`
            );

            if (!weatherRes.ok) throw new Error("Weather fetch failed");
            const weatherData = await weatherRes.json();

            const dailyTime = (weatherData.daily?.time ?? []) as string[];

            const locationName = allowReverseGeocode
                ? await resolveLocationLabel(lat, lon)
                : UNKNOWN_LOCATION_LABEL;

            const hourlySeries: HourlySeries = {
                time: weatherData.hourly.time as string[],
                temp: weatherData.hourly.temperature_2m as number[],
                code: weatherData.hourly.weather_code as number[],
            };

            const m = {
                lat,
                lon,
                temperature: weatherData.current.temperature_2m as number,
                conditionCode: weatherData.current.weather_code as number,
                dailyMax: weatherData.daily.temperature_2m_max as number[],
                dailyMin: weatherData.daily.temperature_2m_min as number[],
                dailyTime,
                location: locationName,
            };

            setMeta(m);
            setSeries(hourlySeries);

            const now = new Date();
            const w = buildWeatherFromSeries(
                locationName,
                m.temperature,
                m.conditionCode,
                m.dailyMax,
                m.dailyMin,
                hourlySeries,
                now,
                dailyTime
            );
            setWeather(w);

            saveToCache({
                location: locationName,
                temperature: m.temperature,
                condition: w.condition,
                conditionCode: m.conditionCode,
                high: w.high,
                low: w.low,
                tomorrowHigh: w.tomorrowHigh,
                tomorrowLow: w.tomorrowLow,
                dayAfterHigh: w.dayAfterHigh,
                dayAfterLow: w.dayAfterLow,
                dailyTime,
                hourlySeries,
                timestamp: Date.now(),
                lat,
                lon,
            });
        } catch (e) {
            console.error("Weather fetch error:", e);
            if (!isBackground) setError("Could not fetch weather");
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, [saveToCache]);

    const requestLocationWeather = useCallback(() => {
        setShowLocationPrompt(false);
        localStorage.setItem(LOCATION_CHOICE_KEY, "allowed");

        if (!navigator.geolocation) {
            fetchWeather(28.6139, 77.2090, false, false);
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
            () => fetchWeather(28.6139, 77.2090, false, false),
            { timeout: 10000, enableHighAccuracy: false }
        );
    }, [fetchWeather]);

    const useWeatherWithoutLocation = useCallback(() => {
        setShowLocationPrompt(false);
        localStorage.removeItem(LOCATION_CHOICE_KEY);
        fetchWeather(28.6139, 77.2090, false, false);
    }, [fetchWeather]);

    useEffect(() => {
        let cancelled = false;

        const loadCachedWeather = (): CachedWeather | null => {
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached) as CachedWeather;
                    if (
                        parsed.hourlySeries?.time?.length &&
                        Date.now() - parsed.timestamp < CACHE_DURATION
                    ) {
                        return parsed;
                    }
                }
            } catch (e) {
                console.warn("Cache read error:", e);
            }
            return null;
        };

        const applyCachedWeather = (cached: CachedWeather) => {
            const fallHi = cached.tomorrowHigh ?? cached.high;
            const fallLo = cached.tomorrowLow ?? cached.low;
            const dailyMax = [
                cached.high,
                fallHi,
                cached.dayAfterHigh ?? fallHi,
            ];
            const dailyMin = [
                cached.low,
                fallLo,
                cached.dayAfterLow ?? fallLo,
            ];
            const dailyTime = cached.dailyTime ?? [];
            const mFixed = {
                lat: cached.lat,
                lon: cached.lon,
                temperature: cached.temperature,
                conditionCode: cached.conditionCode,
                dailyMax,
                dailyMin,
                dailyTime,
                location: normalizeLocationLabel(cached.location),
            };

            setMeta(mFixed);
            setSeries(cached.hourlySeries);
            setWeather(
                buildWeatherFromSeries(
                    normalizeLocationLabel(cached.location),
                    cached.temperature,
                    cached.conditionCode,
                    dailyMax,
                    dailyMin,
                    cached.hourlySeries,
                    new Date(),
                    dailyTime
                )
            );
            setLoading(false);

            const cacheAge = Date.now() - cached.timestamp;
            if (cacheAge > 5 * 60 * 1000) {
                fetchWeather(cached.lat, cached.lon, true);
            }
        };

        const loadInitialWeather = async () => {
            const cached = loadCachedWeather();
            const cachedLocation = normalizeLocationLabel(cached?.location);
            const choice = localStorage.getItem(LOCATION_CHOICE_KEY);
            const cachedHasReadableLocation = cachedLocation !== UNKNOWN_LOCATION_LABEL;

            if (choice === "skipped") {
                localStorage.removeItem(LOCATION_CHOICE_KEY);
            }

            if (cached && cachedHasReadableLocation) {
                applyCachedWeather(cached);
                return;
            }

            if (cached && choice === "allowed") {
                fetchWeather(cached.lat, cached.lon, false, true);
                return;
            }

            if (choice === "allowed" && navigator.geolocation) {
                requestLocationWeather();
                return;
            }

            try {
                const permission = await navigator.permissions?.query?.({ name: "geolocation" as PermissionName });
                if (cancelled) return;

                if (permission?.state === "granted") {
                    requestLocationWeather();
                    return;
                }

                if (permission?.state === "denied") {
                    if (cached) {
                        applyCachedWeather(cached);
                    } else {
                        fetchWeather(28.6139, 77.2090, false, false);
                    }
                    return;
                }
            } catch {
                /* Permissions API is optional. Fall through to the app-level prompt. */
            }

            if (cancelled) return;
            setLoading(false);
            setShowLocationPrompt(true);
        };

        loadInitialWeather();

        return () => {
            cancelled = true;
        };
    }, [fetchWeather, requestLocationWeather]);

    // Keep hourly row aligned to the clock every minute (no shrink later in the day)
    useEffect(() => {
        if (!series || !meta) return;
        const id = window.setInterval(() => {
            applySliceFromSeries(series, meta);
        }, SLICE_TICK_MS);
        return () => clearInterval(id);
    }, [series, meta, applySliceFromSeries]);

    // Periodic refresh for near–real-time current conditions
    useEffect(() => {
        if (!meta) return;
        const id = window.setInterval(() => {
            fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${meta.lat}&longitude=${meta.lon}` +
                    `&current=temperature_2m,weather_code` +
                    `&daily=temperature_2m_max,temperature_2m_min` +
                    `&hourly=temperature_2m,weather_code` +
                    `&timezone=auto&forecast_days=3`
            )
                .then((r) => (r.ok ? r.json() : Promise.reject()))
                .then((weatherData) => {
                    const hourlySeries: HourlySeries = {
                        time: weatherData.hourly.time,
                        temp: weatherData.hourly.temperature_2m,
                        code: weatherData.hourly.weather_code,
                    };
                    const dailyTime = (weatherData.daily?.time ?? []) as string[];
                    const nextMeta = {
                        ...meta,
                        temperature: weatherData.current.temperature_2m,
                        conditionCode: weatherData.current.weather_code,
                        dailyMax: weatherData.daily.temperature_2m_max,
                        dailyMin: weatherData.daily.temperature_2m_min,
                        dailyTime,
                    };
                    setMeta(nextMeta);
                    setSeries(hourlySeries);
                    applySliceFromSeries(hourlySeries, nextMeta);
                    try {
                        const w = buildWeatherFromSeries(
                            nextMeta.location,
                            nextMeta.temperature,
                            nextMeta.conditionCode,
                            nextMeta.dailyMax,
                            nextMeta.dailyMin,
                            hourlySeries,
                            new Date(),
                            dailyTime
                        );
                        localStorage.setItem(
                            CACHE_KEY,
                            JSON.stringify({
                                location: nextMeta.location,
                                temperature: nextMeta.temperature,
                                condition: w.condition,
                                conditionCode: nextMeta.conditionCode,
                                high: w.high,
                                low: w.low,
                                tomorrowHigh: w.tomorrowHigh,
                                tomorrowLow: w.tomorrowLow,
                                dayAfterHigh: w.dayAfterHigh,
                                dayAfterLow: w.dayAfterLow,
                                dailyTime,
                                hourlySeries,
                                timestamp: Date.now(),
                                lat: nextMeta.lat,
                                lon: nextMeta.lon,
                            } satisfies CachedWeather)
                        );
                    } catch {
                        /* ignore */
                    }
                })
                .catch(() => {});
        }, REFETCH_INTERVAL_MS);
        return () => clearInterval(id);
    }, [meta, applySliceFromSeries]);

    const WeatherIcon = weather ? getWeatherInfo(weather.conditionCode).icon : Cloud;

    const glassContentShell =
        "relative flex min-h-0 w-full flex-1 flex-col items-center justify-center";

    if (showLocationPrompt) {
        return (
            <GlassInterface
                contentLayout="none"
                contentClassName={glassContentShell}
                className="!flex !min-h-[260px] !w-full !max-w-[450px] !flex-col !rounded-[2.5rem] !p-4 sm:!min-h-[280px] sm:!p-6"
            >
                <div className="flex w-full max-w-[22rem] flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10">
                        <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="mt-4 text-xl font-bold tracking-tight text-white">
                        Use your location?
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                        Allow location access to show local weather. If you skip, we’ll keep the location label as N/A.
                    </p>
                    <div className="mt-5 grid w-full grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={useWeatherWithoutLocation}
                            className="h-10 rounded-full border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                        >
                            Not now
                        </button>
                        <button
                            type="button"
                            onClick={requestLocationWeather}
                            className="h-10 rounded-full bg-white px-4 text-sm font-semibold text-black transition-colors hover:bg-white/90"
                        >
                            Allow
                        </button>
                    </div>
                </div>
            </GlassInterface>
        );
    }

    if (loading) {
        return (
            <GlassInterface
                contentLayout="none"
                contentClassName={glassContentShell}
                className="!flex !min-h-[260px] !w-full !max-w-[450px] !flex-col !rounded-[2.5rem] !p-4 sm:!min-h-[280px] sm:!p-6"
            >
                <div className="flex w-full max-w-full flex-col items-center justify-center gap-4 animate-pulse text-center">
                    <div className="grid w-full min-w-0 grid-cols-2 items-center justify-items-center gap-4">
                        <div className="flex min-w-0 flex-col items-center">
                            <div className="h-7 w-3/4 max-w-[10rem] rounded-lg bg-white/10" />
                            <div className="mt-2 h-14 w-20 rounded-lg bg-white/10 sm:h-16" />
                        </div>
                        <div className="flex min-w-0 flex-col items-center gap-1">
                            <div className="h-10 w-10 rounded-full bg-white/10 sm:h-12 sm:w-12" />
                            <div className="h-4 w-full max-w-[9rem] rounded-lg bg-white/10" />
                            <div className="h-3 w-full max-w-[7rem] rounded-lg bg-white/10" />
                        </div>
                    </div>
                    <div className="grid w-full min-w-0 grid-cols-6 gap-0.5 pt-2 sm:gap-1 sm:pt-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="h-3 w-8 bg-white/10 rounded mx-auto" />
                                <div className="w-6 h-6 bg-white/10 rounded-full" />
                                <div className="h-4 w-6 bg-white/10 rounded mx-auto" />
                            </div>
                        ))}
                    </div>
                </div>
            </GlassInterface>
        );
    }

    if (error || !weather) {
        return (
            <GlassInterface
                contentLayout="none"
                contentClassName={glassContentShell}
                className="!flex !min-h-[200px] !w-full !max-w-[450px] !flex-col !rounded-[2.5rem] !p-4 sm:!p-6"
            >
                <div className="px-2 text-center text-white/60">
                    <span>{error || "Weather unavailable"}</span>
                </div>
            </GlassInterface>
        );
    }

    return (
        <GlassInterface
            contentLayout="none"
            contentClassName={glassContentShell}
            className="!flex !min-h-[260px] !w-full !max-w-[450px] !flex-col !rounded-[2.5rem] !p-4 sm:!min-h-[280px] sm:!p-6"
        >
            <div className="flex w-full max-w-full flex-col items-center justify-center gap-4 overflow-hidden text-center">
                <div className="grid w-full min-w-0 grid-cols-2 items-center justify-items-center gap-3 sm:gap-4">
                    <div className="flex min-w-0 flex-col items-center">
                        <div className="flex max-w-full min-w-0 items-center justify-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-white/60 sm:h-4 sm:w-4" />
                            <h2 className="min-w-0 truncate text-lg font-bold tracking-tight sm:text-2xl">
                                {weather.location}
                            </h2>
                        </div>
                        <div className="mt-0.5 text-5xl font-light leading-none tabular-nums sm:text-6xl lg:text-7xl">
                            {weather.temperature}°
                        </div>
                    </div>
                    <div className="flex min-w-0 w-full max-w-full flex-col items-center gap-0.5 sm:gap-1">
                        <WeatherIcon className="h-10 w-10 shrink-0 text-white/90 sm:h-12 sm:w-12" />
                        <span className="max-w-[95%] text-xs font-medium leading-tight opacity-80 sm:text-sm">
                            {weather.condition}
                        </span>
                        <span className="max-w-full text-[10px] font-bold uppercase leading-tight tracking-wide opacity-60 sm:text-xs sm:tracking-widest">
                            H:{weather.high}° L:{weather.low}°
                        </span>
                        {weather.tomorrowHigh != null && weather.tomorrowLow != null ? (
                            <>
                                <div
                                    className="my-1.5 h-px w-full max-w-[11rem] bg-gradient-to-r from-transparent via-white/25 to-transparent sm:my-2"
                                    aria-hidden
                                />
                                <span className="max-w-[95%] text-[9px] font-semibold uppercase leading-snug tracking-wide text-white/50 sm:text-[10px]">
                                    Tomorrow H:{weather.tomorrowHigh}° L:{weather.tomorrowLow}°
                                </span>
                            </>
                        ) : null}
                        {weather.dayAfterLabel &&
                        weather.dayAfterHigh != null &&
                        weather.dayAfterLow != null ? (
                            <>
                                {/* <div
                                    className="my-1.5 h-px w-full max-w-[11rem] bg-gradient-to-r from-transparent via-white/25 to-transparent sm:my-2"
                                    aria-hidden
                                />
                                <span className="max-w-[95%] text-[9px] font-semibold uppercase leading-snug tracking-wide text-white/50 sm:text-[10px]">
                                    {weather.dayAfterLabel} H:{weather.dayAfterHigh}° L:{weather.dayAfterLow}°
                                </span> */}
                            </>
                        ) : null}
                    </div>
                </div>

                <div
                    className="grid w-full min-w-0 grid-cols-6 justify-items-center gap-0.5 border-t border-white/[0.08] pt-3 sm:gap-1"
                    style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}
                >
                    {Array.from({ length: HOURLY_SLOT_COUNT }, (_, index) => {
                        const h = weather.hourly[index];
                        if (!h) {
                            return (
                                <div
                                    key={`empty-${index}`}
                                    className="flex min-h-[3.75rem] min-w-0 flex-col items-center justify-start gap-0.5 opacity-25 sm:min-h-[4.25rem] sm:gap-1"
                                    aria-hidden
                                >
                                    <span className="text-[8px] font-bold sm:text-[9px]">—</span>
                                    <Cloud className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                                    <span className="text-xs font-bold">—</span>
                                </div>
                            );
                        }
                        const HourIcon = getWeatherInfo(h.code).icon;
                        return (
                            <ForecastHour
                                key={`${h.time}-${index}-${h.showDayDivider ? "d" : ""}`}
                                hour={h.time}
                                showDayDivider={h.showDayDivider}
                                temp={`${h.temp}°`}
                                icon={HourIcon}
                            />
                        );
                    })}
                </div>
            </div>
        </GlassInterface>
    );
}

function ForecastHour({
    hour,
    showDayDivider,
    temp,
    icon: Icon,
}: {
    hour: string;
    showDayDivider?: boolean;
    temp: string;
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <div
            className={cn(
                "flex min-w-0 max-w-full flex-col items-center justify-start gap-0.5 px-0.5 text-center sm:gap-1 sm:px-1",
                showDayDivider && "border-l border-white/20 pl-1 sm:pl-2"
            )}
        >
            <span className="w-full truncate text-[8px] font-bold uppercase leading-none tracking-wide text-white/70 sm:text-[9px] sm:leading-tight">
                {hour}
            </span>
            <Icon className="h-5 w-5 shrink-0 text-white sm:h-6 sm:w-6" />
            <span className="text-xs font-bold tabular-nums sm:text-sm">{temp}</span>
        </div>
    );
}
