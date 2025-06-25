import * as utils from "../utils.js";

export async function loadData() {
    let documents = [];

    const path = '/Booking list - Bookings Harmony Hill.tsv';
    const dataSeparator = "\t";

    try {
        const response = await fetch(path);
        const content = await response.text();

        const rows = content.split("\n");
        const headerRow = rows.find((row) => row.includes("Action required?")); // may return undefined
        if(!headerRow) throw new Error(`Cannot find header row of file ${path}`);
        
        const headers = headerRow.split(dataSeparator);
        const nameIndex = headers.indexOf("Name");
        if(nameIndex == -1) {
            throw new Error(`Missing name field in header row of file ${path}`);
        }
        const headerRowIndex = rows.indexOf(headerRow);
        
        for(let r = headerRowIndex+1; r < rows.length; r++) {
            const row = rows[r];
            const columns = row.split(dataSeparator);
            if(utils.isEmpty(columns[nameIndex])) {
                continue;
            }

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
                doc[translatedHeader] = interpretData(translatedHeader, columns[c]);
            }
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
        "# guests"             : "guestCount",
        
        "check in"             : "checkInAt",
        "check out"            : "checkOutAt",
        
        "name"                 : "name",
        "source"               : "source",
        "status"               : "status",
        
        "room rate"            : "roomRate",
        "guest paid per night" : "guestPaid",
        "Total payout (still incl tax & service charge)" : "hostPayout",
        
        "country"              : "country",
        "special promos"       : "promotions",
        "Other requests"       : "requests",
        "customer info"        : "otherDetails",
        
        "payment method"       : "paymentMethod",
        "welcome message sent" : "welcomeMessageSent",

        "pre-check-in message sent" : "preCheckInMessageSent",
        
    };

    return translator[headerIn];
}

function interpretData(header, data) {
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
        default:
            return data;
    }
}
