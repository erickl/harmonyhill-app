import { initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { setGlobalOptions } from "firebase-functions/v2";
import admin from "firebase-admin";
import serviceAccount from "./harmonyhill-1-service-account-key.json" with { type: "json" };

// import dotenv from 'dotenv';
// dotenv.config(); // for the seeder script in the local env
// console.log('API KEY:', process.env.FIREBASE_API_KEY);

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {  
    // Use the default host and port for the Firestore emulator
    process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080"; 
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199";
}

let app;

try {
    app = getApp();
} catch(e) {
    app = initializeApp({
        credential : admin.credential.cert(serviceAccount),
        storageBucket: 'harmonyhill-1.firebasestorage.app'
    });
}

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

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
    storage,
    Timestamp,
};
