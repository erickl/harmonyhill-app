import { useEffect, useState } from "react";

// Dynamically load Google Identity Services (GIS) SDK into the app
//      Downloads Google’s gsi/client JavaScript library.
export function useGoogleApi() {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (document.querySelector("#google-identity-script")) {
            setLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.id = "google-identity-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => setLoaded(true);
        document.body.appendChild(script);
    }, []);

    return loaded;
}