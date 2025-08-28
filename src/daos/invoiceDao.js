import { storage } from '../firebase'; // Adjust path if your firebase.js is elsewhere
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import * as dao from "./dao.js";

export async function uploadImage(filename, imageDataURL, onError) {
    try {
        const storageRef = ref(storage, filename);

        const snapshot = await uploadString(storageRef, imageDataURL, 'data_url');
        if(!snapshot) {
            onError(`Unknown file upload error! Result: ${snapshot}`);
            return false;
        }

        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch(e) {
        onError(`Unexpected file upload error: ${e.message}`);
        return false;
    }
}

export async function addPurchaseInvoice(data, onError) {
    const id = `${data.category}-${data.purchasedBy}-${data.purchasedAt}-${Date.now()}`;
    const path = [dao.constant.RECEIPTS];
    return await dao.add(path, id, data, onError);
}
