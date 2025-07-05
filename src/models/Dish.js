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

    // todo: might need wingko and "i love bali toast" twice. Extra breakfast items are 80k. But wingko as dessert is 60

    const dishes = [
    //            name                               allergens         image   house availability                  meal categories                price  instructions   descriptions
        new Dish("Smoothie Bowl Of Seasonal Fruits", ["nuts"],            "", ["harmony hill"],                    ["breakfast"],                    0,      "", "Topped with our homemade granola and fresh sliced fruits - ask us what's in season if you wish to customize"                                                  ),
        new Dish("Javanese Wingko Waffle",           ["coconut"],         "", ["harmony hill", "the jungle nook"], ["breakfast", "dessert"],         60000,  "", "Chewy, coconutty and crispy, baked in an authentic cast waffle iron, served with our homemade jam and fresh fruit"                                            ),
        new Dish("Plant Power Breakfast",            ["soy"],             "", ["harmony hill", "the jungle nook"], ["breakfast"],                    0,      "", "Scrambled tofu, served with baked potatoes, roasted tomato, garlic, spinach and seasonal sauteed veggies"                                                     ),
        new Dish("Nasi Goreng 2.0",                  ["soy"],             "", ["harmony hill", "the jungle nook"], ["breakfast"],                    0,      "", "Indonesia's classic fried rice, boosted with brown rice, seasonal veggies, tempeh and tofu"                                                                   ),
        new Dish("Colorful Chia Seed Pudding",       ["soy"],             "", ["harmony hill", "the jungle nook"], ["breakfast"],                    0,      "", "Indonesia's classic fried rice, boosted with brown rice, seasonal veggies, tempeh and tofu"                                                                   ),
        
        new Dish("Edamame With Bali Sea Salt",       [""],                "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              50000,  "", ""                                                                                                                                                             ),
        new Dish("Carrot Ginger Soup",               [""],                "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              50000,  "", ""                                                                                                                                                             ),
        new Dish("Pumpkin Soup",                     [""],                "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              50000,  "", ""                                                                                                                                                             ),
        new Dish("Vegetables And Tofu Soup",         ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              50000,  "", ""                                                                                                                                                             ),
        new Dish("Tomato Veggies Soup",              [""],                "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              60000,  "", ""                                                                                                                                                             ),
        new Dish("Guacarosti",                       [""],                "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              60000,  "", ""                                                                                                                                                             ),
        new Dish("Gado-Gado Rolls",                  ["peanut"],          "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              60000,  "", ""                                                                                                                                                             ),
        new Dish("Treenut Cheeze Platter",           ["nuts"],            "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              420000, "", ""                                                                                                                                                             ),  
        new Dish("Lentil Bolognese",                 ["seeds"],           "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              100000, "", "Treat yourself to Made’s famous spaghetti bolognese, loved by all. Can also be served with rice"                                                              ),
        new Dish("Mexican Bowl",                     ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              100000, "", "Eat the rainbow with our protein-packed chile sin carne, accompanied by guacamole and tomato-corn salsa. Served with brown rice"                              ),
        new Dish("Sushi",                            [],                  "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              100000, "", "Colorful sushi rolls with our homemade watermelon “toona”, marinated tofu and raw veggies inside"                                                             ),
        new Dish("Tempeh Steak",                     ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              100000, "", "Flavorfully marinated tempeh drizzled with Made's secret sauce, served with baby potatoes and Balinese \"Urab\" veggies"                                      ),
        new Dish("Chickpea Curry",                   ["coconut"],         "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              100000, "", "Chickpeas, potatoes, tomatoes and coconut cream blend together with a fragrant spice mix to warm your tummy served with brown rice"                           ),
        new Dish("Mediterranean Eggplant Stew",      ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              100000, "", "Tomatoes, eggplant, chickpeas meet on a bed of mashed :) Served with crispy tempeh for an extra protein boost"                                                ),
        new Dish("Marry Me Pasta",                   ["cashews"],         "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              100000, "", "Deliciously creamy cashew-based sauce packed with veggies and herbs - Prepare to fall in love!"                                                               ),
        new Dish("Healthy Bowl",                     ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              100000, "", "Healthful bowl with teriyaki glazed tempeh, vegan \"honey\" mustard dressing and a colorful mix of raw  and steamed seasonal veggies. Served with brown rice" ),
        new Dish("Nasi Campur",                      ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              100000, "", "The way we love to eat in Bali: Rice in the middle surrounded by 4-5 seasonal veggies and tempeh/tofu preparations"                                           ),
        new Dish("Poke Bowl",                        ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              100000, "", "Homemade watermelon \"toona\", marinated tofu, edamame, avocado, cucumber and pickled ginger, served with sushi rice and homemade ginger soy dressing"        ),
        new Dish("Savoury Tempeh Mushroom Stew",     ["soy"],             "", ["harmony hill", "the jungle nook"], ["lunch", "dinner"],              100000, "", "Tempeh in a super creamy mushroom sauce, served with baked apple, mashed potatoes and steamed veggie of the day"                                              ),
        new Dish("I Love Bali Toast",                ["soy"],             "", ["harmony hill", "the jungle nook"], ["breakfast", "lunch", "dinner"], 100000, "", "Toasted sourdough, half topped with scrambled tofu and half topped with smashed avocado, garnished with mixed seeds and roasted tomatoes"                     ),
        new Dish("Wingko Waffle",                    ["coconut"],         "", ["harmony hill", "the jungle nook"], ["dessert"],                      60000,  "", "Traditional Balinese crepes filled with grated coconut, served with fresh fruits"                                                                                     ),
        new Dish("Dadar Gulung",                     ["coconut, gluten"], "", ["harmony hill", "the jungle nook"], ["dessert"],                      60000,  "", "Traditional Balinese crepes filled with grated coconut, served with fresh fruits"                                                                                     ),
        new Dish("Cookies And Cream Cake",           ["nuts, gluten"],    "", ["harmony hill", "the jungle nook"], ["dessert"],                      60000,  "", "Melt in your mouth oreo goodness"                                                                                                                                     ),
        new Dish("Marz Choc Caramel Cake",           ["nuts"],            "", ["harmony hill", "the jungle nook"], ["dessert"],                      60000,  "", "Gooey caramel goodness"                                                                                                                                               ),
        new Dish("Mango Coconut Cheese Cake",        ["coconut"],         "", ["harmony hill", "the jungle nook"], ["dessert"],                      60000,  "", "A fruity kick in the summer heat"                                                                                                                                     ),
        new Dish("Forest Berry Cheese Cake",         [""],                "", ["harmony hill", "the jungle nook"], ["dessert"],                      60000,  "", "Something juicy to berry your nose in"                                                                                                                                ),
        new Dish("Brookies",                         [""],                "", ["harmony hill", "the jungle nook"], ["dessert"],                      60000,  "", "Yummy mix between a brownie and a cookie"                                                                                                                             ),
        new Dish("Biscoff Caramel Peanut Slice",     [""],                "", ["harmony hill", "the jungle nook"], ["dessert"],                      50000,  "", "Small in size, but packs a punch!"                                                                                                                                    ),
        new Dish("Cookie",                           [""],                "", ["harmony hill", "the jungle nook"], ["dessert"],                      50000,  "", "Chocolate Chip, Peanut Butter Belgian Chocolate"                                                                                                                      ),
        new Dish("Fruit Platter",                    [""],                "", ["harmony hill", "the jungle nook"], ["dessert"],                      40000,  "", ""                                                                                                                                                                     ),           
        new Dish("Ice Cream Sticks",                 [""],                "", ["harmony hill", "the jungle nook"], ["dessert"],                      35000,  "", "See the freezer"                                                                                                                                                      ),
        new Dish("Pineapple Juice",                  [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       35000,  "", ""                                                                                                                                                                     ),
        new Dish("Papaya Juice",                     [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       35000,  "", ""                                                                                                                                                                     ),
        new Dish("Banana Juice",                     [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       35000,  "", ""                                                                                                                                                                     ),
        new Dish("Watermelon Juice",                 [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       35000,  "", ""                                                                                                                                                                     ),
        new Dish("Passionfruit Juice",               [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       35000,  "", ""                                                                                                                                                                     ),
        new Dish("Watermelon Juice",                 [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       35000,  "", ""                                                                                                                                                                     ),   
        new Dish("Passionfruit Banana Smoothie",     [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       50000,  "", ""                                                                                                                                                                     ),
        new Dish("Pina Colada Smoothie",             [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       50000,  "", ""                                                                                                                                                                     ),
        new Dish("Strawberry Smoothie",              [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       50000,  "", ""                                                                                                                                                                     ),
        new Dish("Mango Banana Smoothie",            [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       50000,  "", ""                                                                                                                                                                     ),  
        new Dish("Bottle Of Jamu",                   [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       60000,  "", ""                                                                                                                                                                     ),
        new Dish("Young Coconut",                    [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       40000,  "", ""                                                                                                                                                                     ), 
        new Dish("Probiotic Kombucha",               [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       0,      "", ""                                                                                                                                                                     ),
        new Dish("Sparkling Water",                  [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       0,      "", ""                                                                                                                                                                     ),
        new Dish("Soda",                             [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       0,      "", "Coke, Coke Zero, Schweppes"                                                                                                                                           ),
        new Dish("Espresso",                         [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       0,      "", ""                                                                                                                                                                     ),
        new Dish("Americano",                        [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       0,      "", ""                                                                                                                                                                     ),
        new Dish("Latte with oatmilk",               [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       0,      "", ""                                                                                                                                                                     ),
        new Dish("Cappucino with oatmilk",           [""],                "", ["harmony hill", "the jungle nook"], ["drinks"],                       0,      "", ""                                                                                                                                                                     ),
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