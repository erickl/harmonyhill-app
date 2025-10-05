import { storage } from '../firebase';
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import imageCompression from "browser-image-compression";
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

export async function getPhotoUrl(filePath) {
    try {
        const fileRef = ref(storage, filePath); // e.g. "images/myPhoto.png"
        const url = await getDownloadURL(fileRef);
        return url;
    } catch(e) {
        return null
    }
}

export async function removeImage(fileName) {
    const fileRef = ref(storage, fileName);
    await deleteObject(fileRef);
    return true;
}

export function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); 
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
