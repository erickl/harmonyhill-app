import { storage } from '../firebase'; // Adjust path if your firebase.js is elsewhere
import { ref, uploadString, getDownloadURL } from "firebase/storage";

export async function uploadImage(filename, imageDataURL) {
    try {
        const storageRef = ref(storage, filename);

        const snapshot = await uploadString(storageRef, imageDataURL, 'data_url');
        //onProgress('Processing...');

        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch(error) {
        console.log(error);
        return false;
    }
}
