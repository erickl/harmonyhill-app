/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 * // https://firebase.google.com/docs/functions/get-started
 */

// const logger = require("firebase-functions/logger");
//import { onDocumentCreated } from "firebase-functions/v2/firestore";
// import { makeFirestoreAdapter } from "@harmonyhill/shared/firestoreAdapter.js";
//import * as utils from "@harmonyhill/shared/utils.js";
// import { db } from "./admin-firebase.js";

import * as calendars from "./api/calendars.js";
import * as debug from "./api/debug.js";
import * as pms from "./api/pms.js";

export { 
    calendars, 
    //debug, 
    //pms 
};
