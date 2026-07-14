'use client';

import { useEffect, useCallback, useRef } from 'react';
import { BASE_URL } from '@/lib/baseURL';

const TAB_ID = typeof window !== 'undefined' ? Math.random().toString(36).substring(2, 11) : '';

export function useActivityTracker(page: string) {
    const lastActivityRef = useRef<number>(Date.now());
    const isLeaderRef = useRef<boolean>(false);

    // Track user interaction
    useEffect(() => {
        const handleActivity = () => {
            lastActivityRef.current = Date.now();
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('click', handleActivity);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('click', handleActivity);
        };
    }, []);

    // Tab leader election logic
    useEffect(() => {
        const checkLeader = () => {
            const now = Date.now();
            const lastLeaderPulse = Number(localStorage.getItem('cockpit_tracker_pulse') || 0);
            const currentLeaderId = localStorage.getItem('cockpit_tracker_leader');

            // If no leader or leader pulse is old (> 5s), try to become leader
            if (!currentLeaderId || now - lastLeaderPulse > 5000) {
                localStorage.setItem('cockpit_tracker_leader', TAB_ID);
                localStorage.setItem('cockpit_tracker_pulse', now.toString());
                isLeaderRef.current = true;
            } else if (currentLeaderId === TAB_ID) {
                // Refresh pulse if already leader
                localStorage.setItem('cockpit_tracker_pulse', now.toString());
                isLeaderRef.current = true;
            } else {
                isLeaderRef.current = false;
            }
        };

        const interval = setInterval(checkLeader, 2000);
        checkLeader(); // Initial check

        return () => clearInterval(interval);
    }, []);

    const sendHeartbeat = useCallback(async (latitude?: number, longitude?: number, accuracy?: number) => {
        try {
            await fetch(`${BASE_URL}/activity/heartbeat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    page,
                    latitude,
                    longitude,
                    accuracy,
                }),
                //@ts-ignore
                credentials: 'include',
            });
        } catch (error) {
            console.error('Failed to send heartbeat:', error);
        }
    }, [page]);

    const track = useCallback(() => {
        // Only the leader tab and only if recently active
        const isRecentlyActive = Date.now() - lastActivityRef.current < 60000;

        if (!isLeaderRef.current || !isRecentlyActive) {
            return;
        }

        if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    sendHeartbeat(
                        position.coords.latitude,
                        position.coords.longitude,
                        position.coords.accuracy
                    );
                },
                (error) => {
                    // Fallback to heartbeat without GPS if denied or fails
                    sendHeartbeat();
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
            );
        } else {
            sendHeartbeat();
        }
    }, [sendHeartbeat]);

    useEffect(() => {
        // Check activity and send pulse
        const pulseInterval = setInterval(track, 60000);
        track(); // Initial attempt

        return () => clearInterval(pulseInterval);
    }, [track]);
}
