import * as dataLoader from "../daos/bookingDataLoader.js";
import * as bookingService from "../services/bookingService.js";

export default class Booking {
    constructor() {

    }

    static async uploadData(path) {
        const documents = await dataLoader.loadData(path);
    
        let uploadedDocuments = [];
        const onError = (e) => console.log(e);
        for(const doc of documents) {
            const id = await bookingService.add(doc, onError);
            if(id !== false) {
                uploadedDocuments.push(id);
                console.log(`Uploaded ${id}`);
            }
        }
        const x = 1;
    }
}