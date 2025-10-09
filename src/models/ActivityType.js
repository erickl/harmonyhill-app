import * as utils from "../utils.js";
import { setDoc, doc } from 'firebase/firestore';
import { db } from "../firebase.js";

export default class ActivityType {
    static COLLECTION = "activityTypes";

    constructor(subCategory, category, priority, customerPrice, providerPrices, houseAvailability, description, instructions, custom, internal, deadline1, deadline2) {
        //console.log(`subCategory: ${subCategory}, category: ${category}, customerPrice: ${customerPrice}, providerPrices: ${providerPrices}, description: ${description}, instructions: ${instructions}}`);
        
        this.subCategory       = subCategory.trim().toLowerCase();
        this.category          = category.trim().toLowerCase();
        this.priority          = priority;
        this.customerPrice     = customerPrice;
        this.providerPrices    = providerPrices;
        this.houseAvailability = houseAvailability;
        this.description       = description.trim();
        this.instructions      = instructions.trim();
        this.custom            = custom;
        this.internal          = internal; // i.e. handled by our own staff or not
        this.deadline1         = deadline1;
        this.deadline2         = deadline2;

        this.id = this.id();

        this.displayName = `${this.category.replace(/-/g, " ")}: ${this.subCategory.replace(/-/g, " ")}`;
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
            "custom"            : this.custom,
            "internal"          : this.internal,
            "deadline1"         : this.deadline1,
            "deadline2"         : this.deadline2,
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
        //                    subCategory                        category   priority price    providerPrices                            House availability                    Description                                                                         Instructions                                                                            custom? internal?
        const activityTypes = [
            new ActivityType("breakfast",                         "meal",       100, 0,       {                                       }, ["harmony hill", "the jungle nook"], "Available from 08:00 - 11:00",                                                      "Choose 1 main, 1 coffee/tea, 1 juice, 1 fruit platter per guest"                      , false, true,  0, 0 ),
            new ActivityType("floating-breakfast-for-1-to-2",     "meal",       101, 200000,  {                                       }, ["harmony hill", "the jungle nook"], "Available from 08:00 - 11:00, only for Harmony Hill (and the nook if HH is empty)", "1 cake/cookie per couple. Offer to stand-by for photos"                               , false, true,  0, 0 ),
            new ActivityType("floating-breakfast-for-3-to-4",     "meal",       102, 300000,  {                                       }, ["harmony hill"                   ], "Available from 08:00 - 11:00, only for Harmony Hill",                               "1 cake/cookie per couple. Offer to stand-by for photos"                               , false, true,  0, 0 ),
            new ActivityType("floating-breakfast-for-5-to-6",     "meal",       103, 400000,  {                                       }, ["harmony hill"                   ], "Available from 08:00 - 11:00, only for Harmony Hill",                               "1 cake/cookie per couple. Offer to stand-by for photos"                               , false, true,  0, 0 ),
            new ActivityType("lunch",                             "meal",       104, 0,       {                                       }, ["harmony hill", "the jungle nook"], "Available from 11:00 - 14:00",                                                      ""                                                                                     , false, true,  0, 0 ),
            new ActivityType("dinner",                            "meal",       105, 0,       {                                       }, ["harmony hill", "the jungle nook"], "Available from 17:00 - 19:00",                                                      ""                                                                                     , false, true,  0, 0 ),
            new ActivityType("snack",                             "meal",       106, 0,       {                                       }, ["harmony hill", "the jungle nook"], "Available from 08:00 - 19:00",                                                      ""                                                                                     , false, true,  0, 0 ),
            new ActivityType("afternoon-tea",                     "meal",       107, 0,       {                                       }, ["harmony hill", "the jungle nook"], "Available from 08:00 - 19:00",                                                      ""                                                                                     , false, true,  0, 0 ),
            new ActivityType("minibar",                           "meal",       108, 0,       {                                       }, ["harmony hill", "the jungle nook"], "Only on checkout",                                                                  ""                                                                                     , false, true,  0, 0 ),
              
            new ActivityType("honeymoon-package-nook",            "package",    200, 1600000, {                                       }, [                "the jungle nook"], "",                                                                                  ""                                                                                     , false, true,  0, 0 ),
            new ActivityType("honeymoon-package-hh",              "package",    200, 1800000, {                                       }, ["harmony hill"                   ], "",                                                                                  ""                                                                                     , false, true,  0, 0 ),
            new ActivityType("solo-traveler-package",             "package",    200, 0,       {                                       }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                                     , false, true,  0, 0 ),
         
            new ActivityType("from-airport",                      "transport",  100, 500000,  {                                       }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                                     , false, false, 48, 12 ),
            new ActivityType("to-airport",                        "transport",  100, 500000,  {                                       }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                                     , false, false, 48, 12 ),
            new ActivityType("ubud",                              "transport",  100, 200000,  {                                       }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                                     , false, false, 48, 12 ), // todo: double check price
            new ActivityType("custom",                            "transport",  100, 0,       {                                       }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                                     , true,  false, 48, 12 ),
                
            new ActivityType("for-1",                             "yoga",       100, 800000,  { "pebi"  : 350000,  "kartana" : 500000 }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                                     , false, false, 72, 24 ),
            new ActivityType("for-2",                             "yoga",       100, 800000,  { "pebi"  : 525000,  "kartana" : 500000 }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                                     , false, false, 72, 24 ),
            new ActivityType("for-3",                             "yoga",       100, 950000,  { "pebi"  : 700000,  "kartana" : 600000 }, ["harmony hill"                   ], "",                                                                                  ""                                                                                     , false, false, 72, 24 ),
            new ActivityType("for-4",                             "yoga",       100, 1100000, { "pebi"  : 875000,  "kartana" : 700000 }, ["harmony hill"                   ], "",                                                                                  ""                                                                                     , false, false, 72, 24 ),
            new ActivityType("for-5",                             "yoga",       100, 1250000, { "pebi"  : 1050000, "kartana" : 800000 }, ["harmony hill"                   ], "",                                                                                  ""                                                                                     , false, false, 72, 24 ),
            new ActivityType("for-6",                             "yoga",       100, 1400000, { "pebi"  : 1225000, "kartana" : 900000 }, ["harmony hill"                   ], "",                                                                                  ""                                                                                     , false, false, 72, 24 ),
                
            new ActivityType("batur-sunrise-hike-for-1",          "tour",       100, 1000000, { "pineh" : 700000                      }, ["harmony hill", "the jungle nook"], "",                                                                                  "Bring sweater (could be 13 degrees up there). Check if customer needs vegan breakfast", false, false, 72, 24 ),
            new ActivityType("batur-sunrise-hike-for-2",          "tour",       100, 1600000, { "pineh" : 1000000                     }, ["harmony hill", "the jungle nook"], "",                                                                                  "Bring sweater (could be 13 degrees up there). Check if customer needs vegan breakfast", false, false, 72, 24 ),
            new ActivityType("batur-sunrise-hike-for-3",          "tour",       100, 2250000, { "pineh" : 1300000                     }, ["harmony hill"                   ], "",                                                                                  "Bring sweater (could be 13 degrees up there). Check if customer needs vegan breakfast", false, false, 72, 24 ),
            new ActivityType("batur-sunrise-hike-for-4",          "tour",       100, 2800000, { "pineh" : 1600000                     }, ["harmony hill"                   ], "",                                                                                  "Bring sweater (could be 13 degrees up there). Check if customer needs vegan breakfast", false, false, 72, 24 ),
            new ActivityType("batur-sunrise-hike-for-5",          "tour",       100, 3250000, { "pineh" : 1900000                     }, ["harmony hill"                   ], "",                                                                                  "Bring sweater (could be 13 degrees up there). Check if customer needs vegan breakfast", false, false, 72, 24 ),
            new ActivityType("batur-sunrise-hike-for-6",          "tour",       100, 3600000, { "pineh" : 2200000                     }, ["harmony hill"                   ], "",                                                                                  "Bring sweater (could be 13 degrees up there). Check if customer needs vegan breakfast", false, false, 72, 24 ),
            
            new ActivityType("batur-jeep-for-1",                  "tour",       100, 1300000, { "pineh" : 1100000                     }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                                              , false, false, 72, 24 ),
            new ActivityType("batur-jeep-for-2",                  "tour",       100, 2000000, { "pineh" : 1100000                     }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                                              , false, false, 72, 24 ),
            new ActivityType("batur-jeep-for-3",                  "tour",       100, 2600000, { "pineh" : 1700000                     }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                                              , false, false, 72, 24 ),
            new ActivityType("batur-jeep-for-4",                  "tour",       100, 3200000, { "pineh" : 1700000                     }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                                              , false, false, 72, 24 ),
            new ActivityType("batur-jeep-for-5",                  "tour",       100, 3800000, { "pineh" : 2800000                     }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                                              , false, false, 72, 24 ),
            new ActivityType("batur-jeep-for-6",                  "tour",       100, 4400000, { "pineh" : 2800000                     }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                                              , false, false, 72, 24 ),
            
            new ActivityType("gunung-kawi-and-tirta-empul-for-1", "tour",       100, 550000,  { "rena" : 250+150, "dewa" : 250+150    }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                                              , false, false, 48, 24 ),
            new ActivityType("gunung-kawi-and-tirta-empul-for-2", "tour",       100, 750000,  { "rena" : 250+300, "dewa" : 250+300    }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                                              , false, false, 48, 24 ),
            new ActivityType("gunung-kawi-and-tirta-empul-for-3", "tour",       100, 950000,  { "rena" : 250+450, "dewa" : 250+450    }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                                              , false, false, 48, 24 ),
            new ActivityType("gunung-kawi-and-tirta-empul-for-4", "tour",       100, 1150000, { "rena" : 250+600, "dewa" : 250+600    }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                                              , false, false, 48, 24 ),
            new ActivityType("gunung-kawi-and-tirta-empul-for-5", "tour",       100, 1350000, { "rena" : 250+750, "dewa" : 250+750    }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                                              , false, false, 48, 24 ),
            new ActivityType("gunung-kawi-and-tirta-empul-for-6", "tour",       100, 1550000, { "rena" : 250+900,                     }, ["harmony hill"                   ], "",                                                                                  "Check if customer needs vegan breakfast"                                              , false, false, 48, 24 ),
               
            new ActivityType("private-half-day-for-1-to-4",       "tour",       100, 500000,  { "dewa"  : 350000,  "rena" : 400000    }, ["harmony hill", "the jungle nook"], "Duration: 4 hours",                                                                 ""                                                                                     , false, false, 48, 24 ),
            new ActivityType("private-half-day-for-5-to-6",       "tour",       100, 600000,  { "rena"  : 400000                      }, ["harmony hill"                   ], "Duration: 4 hours",                                                                 ""                                                                                     , false, false, 48, 24 ),
            new ActivityType("private-full-day-for-1-to-4",       "tour",       100, 950000,  { "dewa"  : 600000,  "rena" : 750000    }, ["harmony hill", "the jungle nook"], "Duration: 8 hours",                                                                 ""                                                                                     , false, false, 48, 24 ),
            new ActivityType("private-full-day-for-5-to-6",       "tour",       100, 1100000, { "rena"  : 750000                      }, ["harmony hill"                   ], "Duration: 8 hours",                                                                 ""                                                                                     , false, false, 48, 24 ),
        
            new ActivityType("rice-paddy-waterfall-village",      "tour",       100, 0,       {                                       }, ["harmony hill", "the jungle nook"], "Duration: 1 hour",                                                                  ""                                                                                     , false, true,  0, 0 ),  
            
            new ActivityType("nusa-penida-for-1",                 "tour",       100, 1600000, {                                       }, ["harmony hill", "the jungle nook"], "1000k/person + 600k for transport",                                                 ""                                                                                     , false, false, 96, 36 ),
            new ActivityType("nusa-penida-for-2",                 "tour",       100, 2600000, {                                       }, ["harmony hill", "the jungle nook"], "1000k/person + 600k for transport",                                                 ""                                                                                     , false, false, 96, 36 ),
            new ActivityType("nusa-penida-for-3",                 "tour",       100, 3600000, {                                       }, ["harmony hill",                  ], "1000k/person + 600k for transport",                                                 ""                                                                                     , false, false, 96, 36 ),
            new ActivityType("nusa-penida-for-4",                 "tour",       100, 4600000, {                                       }, ["harmony hill",                  ], "1000k/person + 600k for transport",                                                 ""                                                                                     , false, false, 96, 36 ),
            new ActivityType("nusa-penida-for-5",                 "tour",       100, 5600000, {                                       }, ["harmony hill",                  ], "1000k/person + 600k for transport",                                                 ""                                                                                     , false, false, 96, 36 ),
            new ActivityType("nusa-penida-for-6",                 "tour",       100, 6600000, {                                       }, ["harmony hill",                  ], "1000k/person + 600k for transport",                                                 ""                                                                                     , false, false, 96, 36 ),       
            
            new ActivityType("tubing-for-1",                      "activity",   100, 600000,  {                                       }, ["harmony hill","the jungle nook" ], "600k/person",                                                                       ""                                                                                     , false, false, 72, 36 ),       
            new ActivityType("tubing-for-2",                      "activity",   100, 1200000, {                                       }, ["harmony hill","the jungle nook" ], "600k/person",                                                                       ""                                                                                     , false, false, 72, 36 ),       
            new ActivityType("tubing-for-3",                      "activity",   100, 1800000, {                                       }, ["harmony hill","the jungle nook" ], "600k/person",                                                                       ""                                                                                     , false, false, 72, 36 ),       
            new ActivityType("tubing-for-4",                      "activity",   100, 2400000, {                                       }, ["harmony hill","the jungle nook" ], "600k/person",                                                                       ""                                                                                     , false, false, 72, 36 ),       
            new ActivityType("tubing-for-5",                      "activity",   100, 3000000, {                                       }, ["harmony hill","the jungle nook" ], "600k/person",                                                                       ""                                                                                     , false, false, 72, 36 ),       
            new ActivityType("tubing-for-6",                      "activity",   100, 3600000, {                                       }, ["harmony hill","the jungle nook" ], "600k/person",                                                                       ""                                                                                     , false, false, 72, 36 ),       

            new ActivityType("towel-art",                         "workshop",   100, 0,       {                                       }, ["harmony hill", "the jungle nook"], "Duration: 1 hour",                                                                  ""                                                                                     , false, true,  0, 0 ),  
            new ActivityType("canang-making",                     "workshop",   100, 0,       {                                       }, ["harmony hill", "the jungle nook"], "Duration: 1 hour. Price 75k/person",                                                ""                                                                                     , false, true,  0, 0 ),  
                   
            new ActivityType("balinese-4-hands-60-min",           "massage",    100, 700000,  { "yunik" : 400000,                     }, ["harmony hill", "the jungle nook"], "Duration: 1 hour",                                                                  ""                                                                                     , false, false, 96, 48 ),  
            new ActivityType("balinese-60-min",                   "massage",    100, 350000,  { "yunik" : 0,                          }, ["harmony hill", "the jungle nook"], "Duration: 1 hour",                                                                  ""                                                                                     , false, false, 48, 24 ),  
            new ActivityType("balinese-90-min",                   "massage",    100, 500000,  { "yunik" : 0,                          }, ["harmony hill", "the jungle nook"], "Duration: 1 hour",                                                                  ""                                                                                     , false, false, 48, 24 ),  
            new ActivityType("deep-tissue-60-min",                "massage",    100, 700000,  { "yunik" : 0,                          }, ["harmony hill", "the jungle nook"], "Duration: 1 hour",                                                                  ""                                                                                     , false, false, 72, 36 ),  
            new ActivityType("custom",                            "massage",    100, 0,       {                                       }, ["harmony hill", "the jungle nook"], "Duration: 1 hour",                                                                  ""                                                                                     , true , false, 48, 24 ),  
            new ActivityType("ayurvedic-abhyanga-60-min",         "massage",    100, 950000,  { "yunik" : 0, "Ayu Trisna" : 0         }, ["harmony hill", "the jungle nook"], "Duration: 1 hour",                                                                  ""                                                                                     , false, false, 96, 48 ),  
                   
            new ActivityType("laundry",                           "service",    999, 0,       {                                       }, ["harmony hill", "the jungle nook"], "Two day return, 20k/kg",                                                            "Accept latest the morning before checkout"                                            , false, false, 0, 0 ),
            new ActivityType("laundry-express",                   "service",    999, 0,       {                                       }, ["harmony hill", "the jungle nook"], "One day return, 30k/kg",                                                            "Accept latest the morning the day before checkout"                                    , false, false, 0, 0 ),
            new ActivityType("house-keeping",                     "service",    999, 0,       {                                       }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                                     , false, true,  0, 0 ),
            new ActivityType("baby-sitting",                      "service",    999, 0,       {                                       }, ["harmony hill", "the jungle nook"], "50k/hour",                                                                          "Ask the parents for their rules"                                                      , false, true,  0, 0 ),
            new ActivityType("red-envelope",                      "service",    999, 0,       {                                       }, ["harmony hill", "the jungle nook"], "Put the day before, with personalized letter and feedback form",                    ""                                                                                     , false, true,  0, 0 ),
            new ActivityType("shopping-help-tps",                 "service",    999, 50000,   {                                       }, ["harmony hill", "the jungle nook"], "Their goods bill shouldn't be in their invoice. They pay for that directly by cash",""                                                                                     , false, true,  0, 0 ),
            new ActivityType("shopping-help-ubud",                "service",    999, 100000,  {                                       }, ["harmony hill", "the jungle nook"], "Their goods bill shouldn't be in their invoice. They pay for that directly by cash",""                                                                                     , false, true,  0, 0 ),
                   
            new ActivityType("custom",                            "custom",     999, 0,       {                                       }, ["harmony hill", "the jungle nook"], "",                                                                                  ""                                                                                     , true , false, 0, 0 ),
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
