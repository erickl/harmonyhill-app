import * as dao from "../daos/dao.js";
import * as utils from "../utils.js";

class ActivityType {
    static COLLECTION = "activityTypes";

    constructor(subCategory, category, customerPrice, providerPrices, description, instructions) {
        this.subCategory    = subCategory.trim().toLowerCase();
        this.category       = category.trim().toLowerCase();
        this.customerPrice  = customerPrice;
        this.providerPrices = providerPrices;
        this.description    = description.trim();
        this.instructions   = instructions.trim();

        this.id = this.id();
    }

    id() {
        return `${this.category}-${this.subCategory}`;
    }

    data() {
        return {
            "category"       : this.category,
            "subCategory"    : this.subCategory,
            "customerPrice"  : this.customerPrice,
            "providerPrices" : this.providerPrices,
            "description"    : this.description,
            "instructions"   : this.instructions,
        }
    }

    async upload(onError) {
        if(utils.isEmpty(this.id)) {
            onError("ID is empty");
            return false;
        }

        const data = this.data();

        try {
            const uploadSuccess = await dao.add([ActivityType.COLLECTION], this.id, data);
            return uploadSuccess;
        } catch(e) {
            onError(`Error on dish upload ${this.id}: ${e.message}`);
            return false;
        }
    } 
}

export async function seed() {
    const activityTypes = [
        new ActivityType("breakfast",                "meal",      0,       { },                                    "Available from 08:00 - 11:00",  ""                                        ),
        new ActivityType("lunch",                    "meal",      0,       { },                                    "Available from 11:00 - 14:00",  ""                                        ),
        new ActivityType("dinner",                   "meal",      0,       { },                                    "Available from 17:00 - 19:00",  ""                                        ),
        new ActivityType("from-airport",             "transport", 500000,  { },                                    "",                              ""                                        ),
        new ActivityType("to-airport",               "transport", 450000,  { },                                    "",                              ""                                        ),
        new ActivityType("ubud",                     "transport", 200000,  { },                                    "",                              ""                                        ), // todo: double check price
        new ActivityType("for-1",                    "yoga",      1000000, { "pebi"  : 350000                   }, "",                              ""                                        ),
        new ActivityType("for-2",                    "yoga",      1000000, { "pebi"  : 525000                   }, "",                              ""                                        ),
        new ActivityType("for-3",                    "yoga",      1000000, { "pebi"  : 700000                   }, "",                              ""                                        ),
        new ActivityType("for-4",                    "yoga",      1200000, { "pebi"  : 875000                   }, "",                              ""                                        ),
        new ActivityType("for-5",                    "yoga",      1400000, { "pebi"  : 1050000                  }, "",                              ""                                        ),
        new ActivityType("for-6",                    "yoga",      1600000, { "pebi"  : 1225000                  }, "",                              ""                                        ),
        new ActivityType("batur-sunrise-hike-for-1", "tour",      1000000, { "pineh" : 700000                   }, "",                              "Check if customer needs vegan breakfast" ),
        new ActivityType("batur-sunrise-hike-for-2", "tour",      1600000, { "pineh" : 1000000                  }, "",                              "Check if customer needs vegan breakfast" ),
        new ActivityType("batur-sunrise-hike-for-3", "tour",      2250000, { "pineh" : 1300000                  }, "",                              "Check if customer needs vegan breakfast" ),
        new ActivityType("batur-sunrise-hike-for-4", "tour",      2800000, { "pineh" : 1600000                  }, "",                              "Check if customer needs vegan breakfast" ),
        new ActivityType("batur-sunrise-hike-for-5", "tour",      3250000, { "pineh" : 1900000                  }, "",                              "Check if customer needs vegan breakfast" ),
        new ActivityType("batur-sunrise-hike-for-6", "tour",      3600000, { "pineh" : 2200000                  }, "",                              "Check if customer needs vegan breakfast" ),
        new ActivityType("private-half-day-for-1-4", "tour",      500000,  { "dewa"  : 350000,  "rena" : 400000 }, "Duration: 4 hours",             "Check if customer needs vegan breakfast" ),
        new ActivityType("private-half-day-for-5-6", "tour",      600000,  { "rena"  : 400000                   }, "Duration: 4 hours",             "Check if customer needs vegan breakfast" ),
        new ActivityType("private-full-day-for-1-4", "tour",      950000,  { "dewa"  : 600000,  "rena" : 750000 }, "Duration: 8 hours",             "Check if customer needs vegan breakfast" ),
        new ActivityType("private-full-day-for-5-6", "tour",      600000,  { "rena"  : 750000                   }, "Duration: 8 hours",             "Check if customer needs vegan breakfast" ),

    ];

    for(const activityType of activityTypes) {
        const res = await activityType.upload((e) => {
            console.log(`Upload error for ${activityType.id}`, e);
        });
    
        console.log(`Uploaded ${activityType.id}`);
    }

    console.log(`ActivityType upload complete`);
}
