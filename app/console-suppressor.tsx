"use client";

import { useEffect } from "react";

export function ConsoleSuppressor() {
    useEffect(() => {
        if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
            // Disable logs in production only, or remove the check for global suppression as requested
            // Given the user request "globally", typically implies hiding it always or just for clean demo.
            // I will enable it unconditionally based on the prompt, but usually it's process.env.NODE_ENV === 'production'

            // However, the user request is "now lets disable... globally", implying an immediate action.
            // I'll suppress everything.

            const noop = () => { };
            // console.log = noop;
            // console.warn = noop;
            // console.error = noop;
            // console.info = noop;
            // console.debug = noop;
        }
    }, []);

    // Actually effective suppression script injection for immediate effect even before hydration
    return (
        <script
            dangerouslySetInnerHTML={{
                __html: `
                    (function() {
                        var noop = function() {};
                        console.log = noop;
                        console.warn = noop;
                        console.error = noop;
                        console.info = noop;
                        console.debug = noop;
                    })();
                `,
            }}
        />
    );
}
