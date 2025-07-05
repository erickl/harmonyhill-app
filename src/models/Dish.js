import * as dao from "../daos/dao.js";
import * as utils from "../utils.js";

export class Dish {
    static COLLECTION = "menu";

    constructor(name, allergens, image, houseAvailability, mealCategories, price, instructions, description) {
        this.name              = name; 
        this.allergens         = allergens;
        this.image             = image;
        this.houseAvailability = houseAvailability;
        this.mealCategories    = mealCategories;
        this.price             = price;
        this.instructions      = instructions;
        this.description       = description;

        this.isAvailable       = true;
        this.isFavorite        = false;

        this.id = this.id();
    }

    data() {
        return {
            "allergens"         : this.allergens,
            "instructions"      : this.instructions,
            "description"       : this.description,
            "houseAvailability" : this.houseAvailability,
            "image"             : this.image,
            "isAvailable"       : this.isAvailable,
            "isFavorite"        : this.isFavorite,
            "mealCategories"    : this.mealCategories,
            "name"              : this.name,
            "price"             : this.price
        }
    }

    id() {
        return utils.isString(this.name) ? this.name.toLowerCase().replace(/ /g, "-") : "";
    }

    async upload(onError) {
        if(utils.isEmpty(this.id)) {
            onError("ID is empty");
            return false;
        }

        const data = this.data();
        try {
            const uploadSuccess = await dao.add([Dish.COLLECTION], this.id, data);
            return uploadSuccess;
        } catch(e) {
            onError(`Error on dish upload ${this.id}: ${e.message}`);
            return false;
        }
    } 
}

export async function seed() {

    const dishes = [
    // id                                      name                             allergens        image    house availability                  meal categories     price  instructions   descriptions
    /*"edamame-with-bali-sea-salt"   : */new Dish("Edamame With Bali Sea Salt",    [""],                "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 50000,  "", "" ),
    /*"carrot-ginger-soup"           : */new Dish("Carrot Ginger Soup",            [""],                "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 50000,  "", "" ),
    /*"pumpkin-soup"                 : */new Dish("Pumpkin Soup",                  [""],                "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 50000,  "", "" ),
    /*"vegetables-and-tofu-soup"     : */new Dish("Vegetables And Tofu Soup",      ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 50000,  "", "" ),
    /*"tomato-veggies-soup"          : */new Dish("Tomato Veggies Soup",           [""],                "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 60000,  "", "" ),
    /*"guacarosti"                   : */new Dish("Guacarosti",                    [""],                "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 60000,  "", "" ),
    /*"gado-gado-rolls"              : */new Dish("Gado-Gado Rolls",               ["peanut"],          "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 60000,  "", "" ),
    /*"treenut-cheeze-platter"       : */new Dish("Treenut Cheeze Platter",        ["nuts"],            "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 420000, "", "" ),  
    /*"lentil-bolognese"             : */new Dish("Lentil Bolognese",              ["seeds"],           "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 100000, "", "Treat yourself to Made’s famous spaghetti bolognese, loved by all. Can also be served with rice"                                                              ),
    /*"mexican-bowl"                 : */new Dish("Mexican Bowl",                  ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 100000, "", "Eat the rainbow with our protein-packed chile sin carne, accompanied by guacamole and tomato-corn salsa. Served with brown rice"                              ),
    /*"sushi"                        : */new Dish("Sushi",                         [],                  "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 100000, "", "Colorful sushi rolls with our homemade watermelon “toona”, marinated tofu and raw veggies inside"                                                             ),
    /*"tempeh-steak"                 : */new Dish("Tempeh Steak",                  ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 100000, "", "Flavorfully marinated tempeh drizzled with Made's secret sauce, served with baby potatoes and Balinese \"Urab\" veggies"                                      ),
    /*"chickpea-curry"               : */new Dish("Chickpea Curry",                ["coconut"],         "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 100000, "", "Chickpeas, potatoes, tomatoes and coconut cream blend together with a fragrant spice mix to warm your tummy served with brown rice"                           ),
    /*"mediterranean-eggplant-stew"  : */new Dish("Mediterranean Eggplant Stew",   ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 100000, "", "Tomatoes, eggplant, chickpeas meet on a bed of mashed :) Served with crispy tempeh for an extra protein boost"                                                ),
    /*"marry-me-pasta"               : */new Dish("Marry Me Pasta",                ["cashews"],         "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 100000, "", "Deliciously creamy cashew-based sauce packed with veggies and herbs - Prepare to fall in love!"                                                               ),
    /*"healthy-bowl"                 : */new Dish("Healthy Bowl",                  ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 100000, "", "Healthful bowl with teriyaki glazed tempeh, vegan \"honey\" mustard dressing and a colorful mix of raw  and steamed seasonal veggies. Served with brown rice" ),
    /*"nasi-campur"                  : */new Dish("Nasi Campur",                   ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 100000, "", "The way we love to eat in Bali: Rice in the middle surrounded by 4-5 seasonal veggies and tempeh/tofu preparations"                                           ),
    /*"poke-bowl"                    : */new Dish("Poke Bowl",                     ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 100000, "", "Homemade watermelon \"toona\", marinated tofu, edamame, avocado, cucumber and pickled ginger, served with sushi rice and homemade ginger soy dressing"        ),
    /*"savoury-tempeh-mushroom-stew" : */new Dish("Savoury Tempeh Mushroom Stew",  ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 100000, "", "Tempeh in a super creamy mushroom sauce, served with baked apple, mashed potatoes and steamed veggie of the day"                                              ),
    /*"i-love-bali-toast"            : */new Dish("I Love Bali Toast",             ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"], 100000, "", "Toasted sourdough, half topped with scrambled tofu and half topped with smashed avocado, garnished with mixed seeds and roasted tomatoes"                     ),
    /*"dadar-gulung"                 : */new Dish("Dadar Gulung",                  ["coconut, gluten"], "", ["harmony hill", "the jungle nook"], ["dessert"], 60000,  "", "Traditional Balinese crepes filled with grated coconut, served with fresh fruits"                                                                                     ),
    /*"wingko-waffle"                : */new Dish("Wingko Waffle",                 ["coconut"],         "", ["harmony hill", "the jungle nook"], ["dessert"], 60000,  "", "Traditional Balinese crepes filled with grated coconut, served with fresh fruits"                                                                                     ),
    /*"cookies-and-cream-cake"       : */new Dish("Cookies And Cream Cake",        ["nuts, gluten"],    "", ["harmony hill", "the jungle nook"], ["dessert"], 60000,  "", "Melt in your mouth oreo goodness"                                                                                                                                     ),
    /*"marz-choc-caramel-cake"       : */new Dish("Marz Choc Caramel Cake",        ["nuts"],            "", ["harmony hill", "the jungle nook"], ["dessert"], 60000,  "", "Gooey caramel goodness"                                                                                                                                               ),
    /*"mango-coconut-cheese-cake"    : */new Dish("Mango Coconut Cheese Cake",     ["coconut"],         "", ["harmony hill", "the jungle nook"], ["dessert"], 60000,  "", "A fruity kick in the summer heat"                                                                                                                                     ),
    /*"forest-berry-cheese-cake"     : */new Dish("Forest Berry Cheese Cake",      [""],                "", ["harmony hill", "the jungle nook"], ["dessert"], 60000,  "", "Something juicy to berry your nose in"                                                                                                                                ),
    /*"brookies"                     : */new Dish("Brookies",                      [""],                "", ["harmony hill", "the jungle nook"], ["dessert"], 60000,  "", "Yummy mix between a brownie and a cookie"                                                                                                                             ),
    /*"biscoff-caramel-peanut-slice" : */new Dish("Biscoff Caramel Peanut Slice",  [""],                "", ["harmony hill", "the jungle nook"], ["dessert"], 50000,  "", "Small in size, but packs a punch!"                                                                                                                                    ),
    /*"cookie"                       : */new Dish("Cookie",                        [""],                "", ["harmony hill", "the jungle nook"], ["dessert"], 50000,  "", "Chocolate Chip, Peanut Butter Belgian Chocolate"                                                                                                                      ),
    /*"fruit-platter"                : */new Dish("Fruit Platter",                 [""],                "", ["harmony hill", "the jungle nook"], ["dessert"], 40000,  "", ""                                                                                                                                                                     ),           
    /*"ice-cream-sticks"             : */new Dish("Ice Cream Sticks",              [""],                "", ["harmony hill", "the jungle nook"], ["dessert"], 35000,  "", "See the freezer"                                                                                                                                                      ),
    /*"pine-apple-juice"             : */new Dish("Pineapple Juice",               [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  35000,  "", ""                                                                                                                                                                     ),
    /*"papaya-juice"                 : */new Dish("Papaya Juice",                  [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  35000,  "", ""                                                                                                                                                                     ),
    /*"banana-juice"                 : */new Dish("Banana Juice",                  [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  35000,  "", ""                                                                                                                                                                     ),
    /*"watermelon-juice"             : */new Dish("Watermelon Juice",              [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  35000,  "", ""                                                                                                                                                                     ),
    /*"passionfruit-juice"           : */new Dish("Passionfruit Juice",            [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  35000,  "", ""                                                                                                                                                                     ),
    /*"watermelon-juice"             : */new Dish("Watermelon Juice",              [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  35000,  "", ""                                                                                                                                                                     ),   
    /*"passionfruit-banana-smoothie" : */new Dish("Passionfruit Banana Smoothie",  [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  50000,  "", ""                                                                                                                                                                     ),
    /*"pina-colada-smoothie"         : */new Dish("Pina Colada Smoothie",          [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  50000,  "", ""                                                                                                                                                                     ),
    /*"strawberry-smoothie"          : */new Dish("Strawberry Smoothie",           [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  50000,  "", ""                                                                                                                                                                     ),
    /*"mango-banana-smoothie"        : */new Dish("Mango Banana Smoothie",         [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  50000,  "", ""                                                                                                                                                                     ),  
    /*"bottle-of-jamu"               : */new Dish("Bottle Of Jamu",                [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  60000,  "", ""                                                                                                                                                                     ),
    /*"young-coconut"                : */new Dish("Young Coconut",                 [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  40000,  "", ""                                                                                                                                                                     ), 
    /*"probiotic-kombucha"           : */new Dish("Probiotic Kombucha",            [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  0,      "", ""                                                                                                                                                                     ),
    /*"sparkling-water"              : */new Dish("Sparkling Water",               [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  0,      "", ""                                                                                                                                                                     ),
    /*"soda"                         : */new Dish("Soda",                          [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  0,      "", "Coke, Coke Zero, Schweppes"                                                                                                                                           ),
    /*"espresso"                     : */new Dish("Espresso",                      [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  0,      "", ""                                                                                                                                                                     ),
    /*"americano"                    : */new Dish("Americano",                     [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  0,      "", ""                                                                                                                                                                     ),
    /*"latte-with-oatmilk"           : */new Dish("Latte with oatmilk",            [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  0,      "", ""                                                                                                                                                                     ),
    /*"cappucino-with-oatmilk"       : */new Dish("Cappucino with oatmilk",        [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],  0,      "", ""                                                                                                                                                                     ),
    ];

    for(const dish of dishes) {
        const res = await dish.upload((e) => {
            console.log(`Upload error for ${dish.id}`, e);
        });
    
        console.log(`Uploaded ${dish.id}`);
    }
    console.log(`Dishes upload complete`);
}

//seed();