import { makeFirestoreAdapter } from "@harmonyhill/shared/firestoreAdapter.js";
import { db, Timestamp } from "./admin-firebase.js";

// Create the instance once
export const adapter = await makeFirestoreAdapter(db, Timestamp);