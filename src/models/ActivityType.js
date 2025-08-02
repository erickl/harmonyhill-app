import * as utils from "../utils.js";
import { setDoc, doc } from 'firebase/firestore';
import { db } from "../firebase.js";

export default class ActivityType {
    static COLLECTION = "activityTypes";

    constructor(subCategory, category, priority, customerPrice, providerPrices, houseAvailability, description, instructions) {
        //console.log(`subCategory: ${subCategory}, category: ${category}, customerPrice: ${customerPrice}, providerPrices: ${providerPrices}, description: ${description}, instructions: ${instructions}}`);
        
        this.subCategory       = subCategory.trim().toLowerCase();
        this.category          = category.trim().toLowerCase();
        this.priority          = priority;
        this.customerPrice     = customerPrice;
        this.providerPrices    = providerPrices;
        this.houseAvailability = houseAvailability;
        this.description       = description.trim();
        this.instructions      = instructions.trim();

        this.id = this.id();

        this.displayName = this.subCategory.replace(/-/g, " ");
        this.displayName = utils.capitalizeWords(this.displayName);
    }

    id() {
        return `${this.category}-${this.subCategory}`;
    }

    data() {
        return {
            "displayName"       : this.displayName,
            "category"          : this.category,
            "priority"          : this.priority,
            "subCategory"       : this.subCategory,
            "customerPrice"     : this.customerPrice,
            "providerPrices"    : this.providerPrices,
            "houseAvailability" : this.houseAvailability,
            "description"       : this.description,
            "instructions"      : this.instructions,
        }
    }

    async upload(onError) {
        if(utils.isEmpty(this.id)) {
            onError("ID is empty");
            return false;
        }

        const data = this.data();

        try {
            const ref = doc(db, ...[ActivityType.COLLECTION], this.id);
            const addResult = await setDoc(ref, data);
            return addResult;
        } catch(e) {
            onError(`Error on dish upload ${this.id}: ${e.message}`);
            return false;
        }
    } 

    static async seed() {
        //                    subCategory                   category    priority price    providerPrices                            House availability                    Description                                                                         Instructions
        const activityTypes = [
            new ActivityType("breakfast",                     "meal",       100, 0,       {                                    }, ["harmony hill", "the jungle nook"], "Available from 08:00 - 11:00",                                                      "Choose 1 main, 1 coffee/tea, 1 juice, 1 fruit platter per guest" ),
            new ActivityType("floating-breakfast-for-1-to-2", "meal",       101, 200000,  {                                    }, ["harmony hill", "the jungle nook"], "Available from 08:00 - 11:00, only for Harmony Hill (and the nook if HH is empty)", "1 cake/cookie per couple. Offer to stand-by for photos"          ),
            new ActivityType("floating-breakfast-for-3-to-4", "meal",       102, 300000,  {                                    }, ["harmony hill"                   ], "Available from 08:00 - 11:00, only for Harmony Hill",                               "1 cake/cookie per couple. Offer to stand-by for photos"          ),
            new ActivityType("floating-breakfast-for-5-to-6", "meal",       103, 400000,  {                                    }, ["harmony hill"                   ], "Available from 08:00 - 11:00, only for Harmony Hill",                               "1 cake/cookie per couple. Offer to stand-by for photos"          ),
            new ActivityType("lunch",                         "meal",       104, 0,       {                                    }, ["harmony hill", "the jungle nook"], "Available from 11:00 - 14:00",                                                      ""                                                                ),
            new ActivityType("dinner",                        "meal",       105, 0,       {                                    }, ["harmony hill", "the jungle nook"], "Available from 17:00 - 19:00",                                                      ""                                                                ),
            new ActivityType("snack",                         "meal",       106, 0,       {                                    }, ["harmony hill", "the jungle nook"], "Available from 08:00 - 19:00",                                                      ""                                                                ),
            new ActivityType("afternoon-tea",                 "meal",       107, 0,       {                                    }, ["harmony hill", "the jungle nook"], "Available from 08:00 - 19:00",                                                      ""                                                                ),
            new ActivityType("honeymoon-package-nook",        "package",    200, 1600000, {                                    }, [                "the jungle nook"], "",                                                                                  ""                                                                ),
            new ActivityType("honeymoon-package-hh",          "package",    200, 1800000, {                                    }, ["harmony hill"                   ], "",                                                                                  ""                                                                ),
            new ActivityType("solo-traveler-package",         "package",    200, 0,       {                                    }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                ),
            new ActivityType("from-airport",                  "transport",  100, 500000,  {                                    }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                ),
            new ActivityType("to-airport",                    "transport",  100, 450000,  {                                    }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                ),
            new ActivityType("ubud",                          "transport",  100, 200000,  {                                    }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                ), // todo: double check price
            new ActivityType("for-1",                         "yoga",       100, 1000000, { "pebi"  : 350000                   }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                ),
            new ActivityType("for-2",                         "yoga",       100, 1000000, { "pebi"  : 525000                   }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                ),
            new ActivityType("for-3",                         "yoga",       100, 1000000, { "pebi"  : 700000                   }, ["harmony hill"                   ], "",                                                                                  ""                                                                ),
            new ActivityType("for-4",                         "yoga",       100, 1200000, { "pebi"  : 875000                   }, ["harmony hill"                   ], "",                                                                                  ""                                                                ),
            new ActivityType("for-5",                         "yoga",       100, 1400000, { "pebi"  : 1050000                  }, ["harmony hill"                   ], "",                                                                                  ""                                                                ),
            new ActivityType("for-6",                         "yoga",       100, 1600000, { "pebi"  : 1225000                  }, ["harmony hill"                   ], "",                                                                                  ""                                                                ),
            new ActivityType("batur-sunrise-hike-for-1",      "tour",       100, 1000000, { "pineh" : 700000                   }, ["harmony hill", "the jungle nook"], "",                                                                                  "Check if customer needs vegan breakfast"                         ),
            new ActivityType("batur-sunrise-hike-for-2",      "tour",       100, 1600000, { "pineh" : 1000000                  }, ["harmony hill", "the jungle nook"], "",                                                                                  "Check if customer needs vegan breakfast"                         ),
            new ActivityType("batur-sunrise-hike-for-3",      "tour",       100, 2250000, { "pineh" : 1300000                  }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                         ),
            new ActivityType("batur-sunrise-hike-for-4",      "tour",       100, 2800000, { "pineh" : 1600000                  }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                         ),
            new ActivityType("batur-sunrise-hike-for-5",      "tour",       100, 3250000, { "pineh" : 1900000                  }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                         ),
            new ActivityType("batur-sunrise-hike-for-6",      "tour",       100, 3600000, { "pineh" : 2200000                  }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                         ),
            new ActivityType("private-half-day-for-1-to-4",   "tour",       100, 500000,  { "dewa"  : 350000,  "rena" : 400000 }, ["harmony hill", "the jungle nook"], "Duration: 4 hours",                                                                 "Check if customer needs vegan breakfast"                         ),
            new ActivityType("private-half-day-for-5-to-6",   "tour",       100, 600000,  { "rena"  : 400000                   }, ["harmony hill"                   ], "Duration: 4 hours",                                                                 "Check if customer needs vegan breakfast"                         ),
            new ActivityType("private-full-day-for-1-to-4",   "tour",       100, 950000,  { "dewa"  : 600000,  "rena" : 750000 }, ["harmony hill", "the jungle nook"], "Duration: 8 hours",                                                                 "Check if customer needs vegan breakfast"                         ),
            new ActivityType("private-full-day-for-5-to-6",   "tour",       100, 600000,  { "rena"  : 750000                   }, ["harmony hill"                   ], "Duration: 8 hours",                                                                 "Check if customer needs vegan breakfast"                         ),
            new ActivityType("rice-paddy-waterfall-village",  "tour",       100, 0,       {                                    }, ["harmony hill", "the jungle nook"], "Duration: 1 hour",                                                                  ""                                                                ),  
            new ActivityType("laundry",                       "service",    999, 0,       {                                    }, ["harmony hill", "the jungle nook"], "Two day return, 20k/kg",                                                            "Accept latest the morning before checkout"                       ),
            new ActivityType("laundry-express",               "service",    999, 0,       {                                    }, ["harmony hill", "the jungle nook"], "One day return, 30k/kg",                                                            "Accept latest the morning the day before checkout"               ),
            new ActivityType("custom",                        "custom",     999, 0,       {                                    }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                ),
        ];

        let errorCount = 0;
        const nActivityTypes = activityTypes.length;
        for(let i = 0; i < nActivityTypes; i++) {
            const activityType = activityTypes[i];
            const res = await activityType.upload((e) => {
                console.log(`Upload error for ${i}, ${activityType.id}: ${e.message}`);
                errorCount++;
            });

            console.log(`Uploaded ${i+1}/${nActivityTypes}: ${activityType.id}`);
        }

        console.log(`ActivityType upload complete. Errors: ${errorCount}`);
    }
}
