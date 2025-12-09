"use client";

import { useEffect } from "react";

export default function PWARegistration() {
    useEffect(() => {
        if (
            typeof window !== "undefined" &&
            "serviceWorker" in navigator &&
            process.env.NODE_ENV === "production"
        ) {
            navigator.serviceWorker
                .register("/sw.js")
                .then(registration => {
                    console.log(
                        "Service Worker registered successfully:",
                        registration.scope
                    );
                })
                .catch(error => {
                    console.error("Service Worker registration failed:", error);
                });
        }
    }, []);

    return null;
}
