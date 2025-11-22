import * as utils from "../utils.js";
import { setDoc, doc } from 'firebase/firestore';
import { db } from "../firebase.js";

export default class Inventory {
    static COLLECTION = "inventory";

    constructor(name, type, customerPrice, purchasePrice, sellers, photoUrl) {
        this.name          = name;
        this.type          = type;
        this.customerPrice = customerPrice;
        this.purchasePrice = purchasePrice;
        this.sellers       = sellers;
        this.photoUrl      = photoUrl;

        this.id = this.id();
    }

    data() {
        return {
            "name"          : this.name,
            "type"          : this.type,
            "customerPrice" : this.customerPrice,
            "purchasePrice" : this.purchasePrice,
            "sellers"       : this.sellers,
            "photoUrl"      : this.photoUrl
        }
    }

    id() {
        const name = utils.isString(this.name) ? this.name.toLowerCase().replace(/ /g, "-") : "";
        return `inv-${name}`;
    }

    async upload(onError) {
        if(utils.isEmpty(this.id)) {
            onError("ID is empty");
            return false;
        }

        const data = this.data();

        try {
            const ref = doc(db, ...[Inventory.COLLECTION], this.id);
            const addResult = await setDoc(ref, data);
            return addResult;
        } catch(e) {
            onError(`Error on inventory upload ${this.id}: ${e.message}`);
            return false;
        }
    } 

    static async seed() {
        const inventoryItems = [         
            //             name                       type,         customerPrice  purchasePrice    sellers             photoUrl
            new Inventory("Ice Cream Stick",          "minibar",           55000,    0,               [],                null), 
            new Inventory("Cassava Chips",            "minibar",           50000,    0,               [],                null), 
            new Inventory("Tempe Chips",              "minibar",           50000,    0,               [],                null), 
            new Inventory("Black Thins",              "minibar",           50000,    0,               [],                null), 
            new Inventory("Yava Granola",             "minibar",           50000,    0,               [],                null), 
            new Inventory("Casa Grata",               "minibar",           60000,    0,               [],                null), 
            new Inventory("Biscoff Roll",             "minibar",           60000,    0,               ["Delta Dewata"],  "gs://harmonyhill-1.firebasestorage.app/resources/minibar/biscoff-roll.jpeg"), 
            new Inventory("Krakakoa Chocolate",       "minibar",           100000,   0,               [],                null), 
            new Inventory("Kombucha Small",           "minibar",           50000,    0,               [],                null), 
            new Inventory("Kombucha Large",           "minibar",           80000,    0,               [],                null), 
            new Inventory("Equil Sparkling Water",    "minibar",           40000,    0,               [],                null), 
            new Inventory("Polaris Sparkling Water",  "minibar",           25000,    0,               [],                null),        
            new Inventory("Oatside Small",            "minibar",           25000,    0,               [],                null), 
            new Inventory("Coke",                     "minibar",           25000,    0,               [],                null), 
            new Inventory("Coke Zero",                "minibar",           25000,    0,               [],                null), 
            new Inventory("Schweppes",                "minibar",           25000,    0,               [],                null), 
            new Inventory("Candle",                   "minibar",           0,        0,               [],                null), 
        ];

        const adapter = await makeFirestoreAdapter(db, Timestamp);
        
        let errorCount = 0;
        const count = inventoryItems.length;
        for(let i = 0; i < count; i++) {
            const inventoryItem = inventoryItems[i];
            await adapter.add([Inventory.COLLECTION], inventoryItem.id, inventoryItem.data());
            console.log(`Uploaded ${(i+1)}/${count} ${inventoryItem.id}`);
        }
        console.log(`Inventory upload complete. Errors: ${errorCount}`);
    }
}
