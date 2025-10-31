import { storage } from '../firebase.js';
import { ref, uploadString, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import imageCompression from "browser-image-compression";
import * as utils from "../utils.js";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export async function upload(filename, blob, options = {}, onError = null) {
    try {
        if(!utils.isEmpty(options)) {
            blob = await compressImage(blob, options, onError);
        }
        const dataUrl = await blobToBase64(blob);
        const storageRef = ref(storage, filename);

        const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
        if (!snapshot) {
            if(onError) onError(`Unknown file upload error! Result: ${snapshot}`);
            return false;
        }

        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (e) {
        if(onError) onError(`Unexpected file upload error: ${e.message}`);
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

export async function getFiles(folderPath) {
    const folderRef = ref(storage, folderPath);

    try {
        // 1. Use listAll to get a list of all items (files) and prefixes (folders) in the path.
        const res = await listAll(folderRef);

        // 2. Iterate through each file reference (res.items)
        // res.items contains the file references (StorageReference)
        const urlPromises = res.items.map(async (itemRef) => {
            // 3. For each file reference, get the public download URL
            const url = await getDownloadURL(itemRef);
            return url;
        });

        // Wait for all promises to resolve to get all URLs
        const urls = await Promise.all(urlPromises);
        
        return urls;

    } catch(e) {
        console.error("Error listing photos in folder:", e);
        // Return an empty array or handle the error as needed
        return [];
    }
}

export async function removeFile(fileName, onError) {
    try {
        const fileRef = ref(storage, fileName);
        await deleteObject(fileRef);
    } catch(e) {
        if(onError) onError(`Couldn't remove file ${fileName}: ${e.message}`);
        return false;
    }
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
