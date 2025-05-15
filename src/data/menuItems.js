// src/data/menuItems.js

class Activity {
    constructor(name, category, price = null, needsProviderName = false) {
        this.name = name;
        this.category = category; // 'Meal', 'Transport', 'Massage', 'Yoga'
        this.price = price;
        this.needsProviderName = needsProviderName;
    }
}

const menuItems = [
    {
        category: 'Meal',
        items: [
            new Activity('Breakfast', 'Meal', 0),
            new Activity('Lunch', 'Meal', 0),
        ],
    },
    {
        category: 'Transport',
        items: [
            new Activity('Airport transfer', 'Transport', 500000, true),
            new Activity('Other transport', 'Transport', null, true), // Price needs input
        ],
    },
    {
        category: 'Massage',
        items: [
            new Activity('60 min', 'Massage', 350000, true),
            new Activity('90 min', 'Massage', 500000, true),
            new Activity('60 min 4 hands', 'Massage', 700000, true),
        ],
    },
    {
        category: 'Yoga',
        items: [
            new Activity('Yoga 1-3P', 'Yoga', 1000000, true),
            new Activity('Yoga 4P', 'Yoga', 1200000, true),
            new Activity('Yoga 5P', 'Yoga', 1400000, true),
        ],
    },
];

export default menuItems;