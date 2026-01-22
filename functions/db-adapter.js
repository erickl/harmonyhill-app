import { makeFirestoreAdapter } from "@harmonyhill/shared/firestoreAdapter.js";
import { db, storage, Timestamp } from "./admin-firebase.js";

// Create the instance once
export const makeAdapter = async () => await makeFirestoreAdapter(db, storage, Timestamp);
