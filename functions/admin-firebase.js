import admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";

// Initialize admin SDK once
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// Only when running Firestore emulator
if (process.env.FUNCTIONS_EMULATOR === "true") {
    admin.firestore().settings({
        host: "localhost:8080",
        ssl: false,
    });
}

// Only when running RTDB emulator locally
if (process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
    //const db = admin.database();
    db.useEmulator("localhost", 9000); // 9000 is the default port
}

// To get more time for step debugging during development
if (process.env.FUNCTIONS_EMULATOR === "true") {
    setGlobalOptions({ timeoutSeconds: 300 });
} else {
    setGlobalOptions({ timeoutSeconds: 60 });
}

export { db, admin };