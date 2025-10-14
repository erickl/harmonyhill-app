import { storage } from '../firebase.js';
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import imageCompression from "browser-image-compression";
import * as utils from "../utils.js";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export async function upload(filename, dataURL, onError) {
    try {
        const storageRef = ref(storage, filename);

        const snapshot = await uploadString(storageRef, dataURL, 'data_url');
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

export async function downloadAllZipped(toFilename, paths, onError) {
    try {
        const zip = new JSZip();

        for (const path of paths) {
            const fileRef = ref(storage, path);
            const url = await getDownloadURL(fileRef);
            // For this to work, we have to set CORS restrictions: see cors.json
            const res = await fetch(url);
            const filedata = await res.blob();
            const filename = path.split("/").pop();
            zip.file(filename, filedata);
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${toFilename}.zip`);
    } catch(e) {
        onError(`Could not download all files: ${e.message}`);
        return false;
    }
    return true;
}
