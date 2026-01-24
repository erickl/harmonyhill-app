import * as utils from "../utils.js";
import { setDoc, doc } from 'firebase/firestore';
import { makeAdapter } from "../../functions/db-adapter.js";

export default class Inventory {
    static COLLECTION = "inventory";

    constructor(name, type, customerPrice, purchasePrice, sellers, minimumStock, photoUrl) {
        this.name          = name;
        this.type          = type;
        this.customerPrice = customerPrice;
        this.purchasePrice = purchasePrice;
        this.sellers       = sellers;
        this.minimumStock  = minimumStock;
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
            "minimumStock"  : this.minimumStock,
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
            //             name                                    type,         customerPrice  purchasePrice    sellers              minimumStock                     photoUrl
            new Inventory("Ice Cream Stick",                       "minibar",           55000,    0,               [],                {"hh" : 12, "jn": 6}               ,null), 
            new Inventory("Cassava Chips",                         "minibar",           50000,    0,               [],                {"hh" : 2,  "jn": 2}               ,null), 
            new Inventory("Tempe Chips",                           "minibar",           50000,    0,               [],                {"hh" : 1,  "jn": 1}               ,null), 
            new Inventory("Black Thins",                           "minibar",           60000,    0,               [],                {"hh" : 1,  "jn": 1}               ,null), 
            new Inventory("Yava Granola",                          "minibar",           50000,    0,               [],                {"hh" : 2,  "jn": 2}               ,null), 
            new Inventory("Casa Grata",                            "minibar",           60000,    0,               [],                {"hh" : 1,  "jn": 1}               ,null), 
            new Inventory("Biscoff Roll",                          "minibar",           60000,    0,               ["Delta Dewata"],  {"hh" : 1,  "jn": 1}               ,"gs://harmonyhill-1.firebasestorage.app/resources/minibar/biscoff-roll.jpeg"), 
            new Inventory("Krakakoa Chocolate",                    "minibar",           100000,   0,               [],                {"hh" : 2,  "jn": 2}               ,null), 
            new Inventory("Kombucha Small",                        "minibar",           50000,    0,               [],                {"hh" : 4,  "jn": 4}               ,null), 
            new Inventory("Kombucha Large",                        "minibar",           80000,    0,               [],                {"hh" : 2,  "jn": 1}               ,null), 
            new Inventory("Equil Sparkling Water",                 "minibar",           40000,    0,               [],                {"hh" : 4,  "jn": 2}               ,null), 
            new Inventory("Polaris Sparkling Water",               "minibar",           25000,    0,               [],                {"hh" : 4,  "jn": 2}               ,null),        
            new Inventory("Oatside Small",                         "minibar",           25000,    0,               [],                {"hh" : 8,  "jn": 4}               ,null), 
            new Inventory("Coke",                                  "minibar",           25000,    0,               [],                {"hh" : 4,  "jn": 2}               ,null), 
            new Inventory("Coke Zero",                             "minibar",           25000,    0,               [],                {"hh" : 4,  "jn": 2}               ,null), 
            new Inventory("Schweppes",                             "minibar",           25000,    0,               [],                {"hh" : 4,  "jn": 2}               ,null),           
            new Inventory("Scented Candle",                        "minibar",           90000,    0,               [],                {"hh" : 3,  "jn": 1}               ,null),
            new Inventory("Umbrella",                              "minibar",           0,        0,               [],                {"hh" : 3,  "jn": 1}               ,null),
            
            new Inventory("Peanut Butter Chocolate Cookie",        "dessert",           35000,    0,               [],                {"hh" : 0,  "jn": 0}               ,"gs://harmonyhill-1.firebasestorage.app/resources/menu/peanut-butter-cookie.png"     ), 
            new Inventory("Chocolate Chip Cookie",                 "dessert",           35000,    0,               [],                {"hh" : 0,  "jn": 0}               ,"gs://harmonyhill-1.firebasestorage.app/resources/menu/chocolate-chip-cookie.png"    ), 
            new Inventory("Brookies (2 pcs)",                      "dessert",           60000,    0,               [],                {"hh" : 0,  "jn": 0}               ,"gs://harmonyhill-1.firebasestorage.app/resources/menu/brookies.png"                 ), 
            new Inventory("Cookies And Cream Cake",                "dessert",           60000,    0,               [],                {"hh" : 0,  "jn": 0}               ,"gs://harmonyhill-1.firebasestorage.app/resources/menu/cookies-and-cream-cake.png"   ), 
            new Inventory("Chocolate Caramel Cake",                "dessert",           60000,    0,               [],                {"hh" : 0,  "jn": 0}               ,"gs://harmonyhill-1.firebasestorage.app/resources/menu/chocolate-caramel-cake.png"   ), 
            new Inventory("Mango Coconut Cheese Cake",             "dessert",           60000,    0,               [],                {"hh" : 0,  "jn": 0}               ,"gs://harmonyhill-1.firebasestorage.app/resources/menu/mango-coconut-cheese-cake.png"), 
            new Inventory("Forest Berry Cheese Cake",              "dessert",           60000,    0,               [],                {"hh" : 0,  "jn": 0}               ,"gs://harmonyhill-1.firebasestorage.app/resources/menu/forest-berry-cheesecake.png"  ), 
            new Inventory("Biscoff Caramel Peanut Slice (Square)", "dessert",           50000,    0,               [],                {"hh" : 0,  "jn": 0}               ,"gs://harmonyhill-1.firebasestorage.app/resources/menu/biscoff-slice.png"            ), 
            new Inventory("Biscoff Cheesecake (Round)",            "dessert",           60000,    0,               [],                {"hh" : 0,  "jn": 0}               ,"gs://harmonyhill-1.firebasestorage.app/resources/menu/biscoff-cheesecake-round.png" ), 
        ];

        const adapter = await makeAdapter();
        
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
