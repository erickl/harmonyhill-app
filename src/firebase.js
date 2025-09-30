import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAuth, connectAuthEmulator } from "firebase/auth";

import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// To enable running this from a script when seeding database data. Only load dotenv if running in Node (not in the browser)
// if (typeof process !== 'undefined' && process?.versions?.node) {
//   const dotenv = await import('dotenv');
//   dotenv.config();
// }

//import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check"; //DebugAppCheckProvider

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId:     process.env.REACT_APP_MEASUREMENT_ID
};

//console.log("firebaseConfig being passed to initializeApp:", firebaseConfig); 

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 2025-05-15: unenforced currently. Can be enforced in the Firebase console
// todo: includ the final domain in the google console, in the enterprise recaptcha security section: https://console.cloud.google.com/security/recaptcha/create?inv=1&invt=AbxtoQ&project=harmonyhill-1
// const appCheck = initializeAppCheck(app, {
//     provider: new ReCaptchaEnterpriseProvider(process.env.REACT_APP_RECAPTCHA_SITE_KEY),
//     //provider: new DebugAppCheckProvider(),
//     isTokenAutoRefreshEnabled: true,
// });

// Optional: for browser only
let analytics;
if (typeof window !== 'undefined') {
    const { getAnalytics } = await import('firebase/analytics');
    analytics = getAnalytics(app);
}

const functions = getFunctions(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app, firebaseConfig.storageBucket);

//if (process.env.NODE_ENV === "dev") {
if (true && window.location.hostname === "localhost") {
    connectFirestoreEmulator(db, "localhost", 8080);
    connectFunctionsEmulator(functions, "localhost", 5001);
    connectAuthEmulator(auth, "http://localhost:9099", 9099);
    connectStorageEmulator(storage, "localhost", 9199);
}

export { db, functions, auth, analytics, storage };
