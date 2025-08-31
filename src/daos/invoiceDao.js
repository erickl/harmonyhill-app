import { storage } from '../firebase'; // Adjust path if your firebase.js is elsewhere
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import { where, orderBy } from 'firebase/firestore';
import * as dao from "./dao.js";
import * as utils from "../utils.js";

export async function uploadImage(filename, imageDataURL, onError) {
    try {
        const storageRef = ref(storage, filename);

        const snapshot = await uploadString(storageRef, imageDataURL, 'data_url');
        if (!snapshot) {
            onError(`Unknown file upload error! Result: ${snapshot}`);
            return false;
        }

        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (e) {
        onError(`Unexpected file upload error: ${e.message}`);
        return false;
    }
}

export async function compressImage(file, compressionOptions, onError) {
    try {
        const maxSize = utils.isEmpty(compressionOptions.maxSize) ? 0.3 : compressionOptions.maxSize;
        const options = {
            maxSizeMB: maxSize,        
            maxWidthOrHeight: 800, // in unit px
            useWebWorker: true
        };

        const compressedFile = await imageCompression(file, options);

        return compressedFile;
    } catch (e) {
        onError(`Error uploading mini picture: ${e.message}`);
    }
}

export function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); 
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export async function getPurchaseReceipts(filterOptions = {}, onError) {
    const path = [dao.constant.RECEIPTS];
    let queryFilter = [];

    if (Object.hasOwn(filterOptions, "category")) {
        const category = filterOptions.category.trim().toLowerCase();
        queryFilter.push(where("category", "=", category));
    }

    if (Object.hasOwn(filterOptions, "purchasedBy")) {
        const purchasedBy = filterOptions.purchasedBy.trim().toLowerCase();
        queryFilter.push(where("purchasedBy", "=", purchasedBy));
    }

    if (Object.hasOwn(filterOptions, "after")) {
        const afterDateFireStore = utils.toFireStoreTime(filterOptions.after);
        queryFilter.push(where("purchasedAt", ">=", afterDateFireStore));
    }

    if (Object.hasOwn(filterOptions, "before")) {
        const beforeDateFireStore = utils.toFireStoreTime(filterOptions.before);
        queryFilter.push(where("purchasedAt", "<=", beforeDateFireStore));
    }

    let ordering = [orderBy("purchasedAt", "desc")];

    const receipts = await dao.get(path, queryFilter, ordering, onError);
    return receipts;
}

export async function addPurchaseReceipt(data, onError) {
    const purchasedAt = utils.to_YYMMdd(data.purchasedAt);
    const purchasedBy = data.purchasedBy.replace(/ /g, "-");
    const category = data.category.replace(/ /g, "-");
    const id = `${category}-${purchasedBy}-${purchasedAt}-${Date.now()}`;
    const path = [dao.constant.RECEIPTS];
    return await dao.add(path, id, data, onError);
}
