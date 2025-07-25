import * as utils from "../utils.js";
import { readFile } from 'fs/promises'; // works only with a node script, not in react

export async function loadData(path) {
    let documents = [];
    
    const house = path.toLowerCase().includes("harmony hill") ? "harmony hill" : "the jungle nook";
    const dataSeparator = path.endsWith(".tsv") ? "\t" : ",";

    try {
        // Load text file data
        console.log("Fetching:", path);

        // This works in react only
        //const response = await fetch(path);
        //const content = await response.text();

        // ... but this is the equivalent for running from a node script
        const content = await readFile(path, 'utf-8');
        

        // Find data headers
        const rows = content.split("\n");
        const headerRow = rows.find((row) => row.includes("Action required?")); // may return undefined
        if(!headerRow) throw new Error(`Cannot find header row of file ${path}`);
        
        // Find the name data column, among the data headers
        const headers = headerRow.split(dataSeparator);
        const nameIndex = headers.indexOf("Name");
        if(nameIndex == -1) {
            throw new Error(`Missing name field in header row of file ${path}`);
        }
        const headerRowIndex = rows.indexOf(headerRow);
        
        // Create an object from each booking data row
        for(let r = headerRowIndex+1; r < rows.length; r++) {
            const row = rows[r];
            const columns = row.split(dataSeparator);
            if(utils.isEmpty(columns[nameIndex])) {
                continue;
            }

            // Format the data of each attribute of the booking, if needed, and add it to the object
            let doc = {};
            for(let c = 0; c < columns.length; c++) {
                const header = headers[c];
                if(utils.isEmpty(header)) {
                    continue;
                }
                const translatedHeader = translateDataHeader(header);
                if(!translatedHeader) {
                    continue;
                }
                const interpretedData = interpretData(translatedHeader, columns[c]);
                doc[translatedHeader] = interpretedData; 
            }
            
            doc["house"] = house;
            documents.push(doc);
        }
    } catch (error) {
        console.error('Failed to load file:', error);
    }

    return documents;
}

function translateDataHeader(headerIn) {
    headerIn = headerIn.trim().toLowerCase();
    const translator = {
        "# people"             : "guestCount",
        
        "check in"             : "checkInAt",
        "check out"            : "checkOutAt",
        
        "name"                 : "name",
        "source"               : "source",
        "status"               : "status",
        
        "room rate"            : "roomRate",
        "guest paid per night" : "guestPaid",
        "total payout (still incl tax & service charge)" : "hostPayout",
        
        "country"              : "country",
        "special promos"       : "promotions",
        "customer info"        : "customerInfo",
        "dietary restrictions" : "dietaryRestrictions",
        "other requests"       : "specialRequests",

        "customer wa"          : "phoneNumber",
        "customer email"       : "email",

        "payment method"       : "paymentMethod",
        
        "arrival time"         : "arrivalInfo",  

        //"welcome message sent"      : "welcomeMessageSent",
        //"pre-check-in message sent" : "preCheckInMessageSent",   
    };

    return translator[headerIn];
}

function interpretData(header, data) {
    if(utils.isString(data)) {
        data = data.trim();
        if(header != "name") {
            data = data.toLowerCase();
        }
    }
    switch(header) {
        case "checkInAt": 
            return utils.toFireStoreTime(data);
        case "checkOutAt": 
            return utils.toFireStoreTime(data);
        case "roomRate": 
            return utils.toNumber(data);
        case "guestPaid": 
            return utils.toNumber(data);
        case "hostPayout": 
            return utils.toNumber(data);
        case "guestCount": 
            return utils.toNumber(data);
        default:
            return data;
    }
}
