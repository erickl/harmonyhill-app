import dotenv from 'dotenv';
dotenv.config();

import Dish from '../models/Dish.js';
import * as utils from "../utils.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({path: path.resolve(__dirname, "../../.env")} );

export function seed() {
    //console.log("ENV dump:", process.env);
    const firebaseProjectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
    if(!utils.isString(firebaseProjectId)) {
        throw new Error("Environment config files missing");
    }
    const dish = new Dish();
    dish.seed();
    
}

seed();