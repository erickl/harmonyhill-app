import { storage } from '../firebase.js';
import { ref, uploadString, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import imageCompression from "browser-image-compression";
import * as utils from "../utils.js";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export async function upload(filename, dataUrl, options = {}, onError = null, writes = []) {
    try {
        if(!utils.isEmpty(options)) {
            dataUrl = await compressImage(dataUrl, options, onError);
        }

        if(dataUrl === false) return false;
        
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

export async function compressImage(fileData, compressionOptions, onError) {
    try {
        const maxSize = utils.isEmpty(compressionOptions.maxSize) ? 0.3 : compressionOptions.maxSize;
        const options = {
            maxSizeMB: maxSize,        
            maxWidthOrHeight: 800, // in unit px
            useWebWorker: true
        };

        let file = null;
        const type = determineUrlType(fileData);
        
        if(type === "data-url") {
            file = dataUrlToFile(fileData);
        } else if(type === "http-url") {
            file = await urlToFile(fileData); 
        }

        if(file === "unknown") {
            throw new Error(`Unknown file type: ${fileData}`);
        }

        const compressedFile = await imageCompression(file, options);
        const compressedDataUrl = await blobToBase64(compressedFile);

        return compressedDataUrl;
    } catch (e) {
        onError(`Error compressing file: ${e.message}`);
        return false;
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

export async function removeFile(fileName, onError, writes = []) {
    try {
        const fileRef = ref(storage, fileName);
        writes.push(async () => await deleteObject(fileRef));
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

// dataURL should be a base64 encoded string, like 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBg...'
function dataUrlToFile(dataURL, filename) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

/**
 * Fetches remote content from a URL and converts it into a File object.
 * @param {string} url The remote HTTP URL of the file (e.g., Firebase Storage link).
 * @param {string} filename The desired name for the resulting File object.
 * @returns {Promise<File>} A Promise that resolves to the new File object.
 */
async function urlToFile(url, filename) {
    // 1. Fetch the remote resource
    const response = await fetch(url);
    
    // 2. Get the content as a binary Blob
    const blob = await response.blob();
    
    // 3. Extract the correct MIME type from the response headers
    const mime = response.headers.get('content-type');
    
    // 4. Create the File object from the Blob
    // The File constructor is: new File([Blob|BufferSource|string], filename, [options])
    return new File([blob], filename, { type: mime });
}

export async function downloadAllZipped(toFilename, paths, onProgress, onError) {
    try {
        const zip = new JSZip();

        const fileCount = paths.length;
        for (let i = 0; i < fileCount; i++) {
            const path = paths[i];
            const fileRef = ref(storage, path);
            const url = await getDownloadURL(fileRef);
            // For this to work, we have to set CORS restrictions: see cors.json
            const res = await fetch(url);
            const filedata = await res.blob();
            const filename = path.split("/").pop();
            zip.file(filename, filedata);
            onProgress(i/fileCount);
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${toFilename}.zip`);
        
        onProgress(100);
    } catch(e) {
        onError(`Could not download all files: ${e.message}`);
        return false;
    }
    return true;
}

/**
 * Determines if a string is a standard HTTP/HTTPS URL or a Base64 Data URL.
 * * @param {string} inputString The string to check.
 * @returns {'data-url' | 'http-url' | 'unknown'} The type of the string.
 */
function determineUrlType(inputString) {
    if (!inputString || typeof inputString !== 'string') {
        return 'unknown';
    }

    // 1. Check for Base64 Data URL signature
    // Data URLs start with 'data:'
    if (inputString.startsWith('data:')) {
        // A simple check to ensure it roughly matches the structure:
        // data:MIME_TYPE[;BASE64],DATA
        const dataUrlRegex = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9]+);base64,([a-zA-Z0-9+/=]+)$/;
        if (dataUrlRegex.test(inputString)) {
            return 'data-url';
        }
    }

    // 2. Check for standard HTTP/HTTPS URL
    // Standard URLs start with 'http://' or 'https://'
    if (inputString.startsWith('http://') || inputString.startsWith('https://')) {
        // Optional: Use the URL constructor for a more rigorous check
        try {
            new URL(inputString);
            return 'http-url';
        } catch (e) {
            // If the URL constructor throws an error, it's not a valid URL format
            return 'unknown';
        }
    }

    // 3. Fallback
    return 'unknown';
}
