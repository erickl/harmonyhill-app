import { initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { setGlobalOptions } from "firebase-functions/v2";

let app;

try {
    app = getApp();
} catch(e) {
    app = initializeApp();
}

const db = getFirestore(app);
const auth = getAuth(app);

// Only when running Firestore emulator
if (process.env.FUNCTIONS_EMULATOR === "true") {
    db.settings({
        host: "localhost:8080",
        ssl: false,
    });
}

// Only when running RTDB emulator locally
if (process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
    db.useEmulator("localhost", 9000); // 9000 is the default port
}

// To get more time for step debugging during development
if (process.env.FUNCTIONS_EMULATOR === "true") {
    setGlobalOptions({ timeoutSeconds: 300 });
} else {
    setGlobalOptions({ timeoutSeconds: 60 });
}

export { 
    db, 
    auth,
    Timestamp,
};
