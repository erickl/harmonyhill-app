import * as dataLoader from "../daos/bookingDataLoader.js";
import * as bookingService from "../services/bookingService.js";
import { setDoc, doc } from 'firebase/firestore';
import { db } from "../firebase.js";

export default class Booking {
    
    static COLLECTION = "bookings";

    constructor(data) {
        this.data = data;
        this.id = bookingService.createBookingId(data.name, data.house, data.checkInAt);
    }

    static async uploadData(path) {
        const bookingDatas = await dataLoader.loadData(path);
    
        const nBookings = bookingDatas.length;
        let nErrors = 0;
        let uploadedDocuments = [];
        const onError = (e) => console.log(e);
        for(let i = 0; i < nBookings; i++) {
            const bookingData = bookingDatas[i];
            let booking = new Booking(bookingData);

            try {
                const ref = doc(db, ...[Booking.COLLECTION], booking.id);
                await setDoc(ref, booking.data);
                uploadedDocuments.push(booking.id);
                console.log(`Uploaded ${i+1}/${nBookings}, ${booking.id}`);                
            } catch(e) {
                console.log(`Failed uploading ${i+1}/${nBookings}, ${booking.id}: ${e.message}`);
                nErrors++;
            }
        }

        console.log(`Completed bookings upload for ${path}. Errors ${nErrors}`);
    }
}
