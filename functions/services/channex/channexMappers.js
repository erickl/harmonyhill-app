// put under the settings collection, in a sub document
const hhDescription = "Our little piece of paradise located halfway between Ubud and Batur. Step onto your private deck, greeted by wide valley views of vibrant rice fields and coconut trees. Savour nourishing plant-based foods. Make your way down the valley to a hidden waterfall or enjoy your private infinity pool overlooking the jungle. Homemade lunch & dinner are available, as well as massage, yoga and more...";

export const createGroupCreateRequest = (title) => {
    return {
        group: {
            "title": title
        }
    };
}

export async function createPropertyCreateRequest(propertyName, groupId, facilities) {
    const property = await channexService.getPropertyDetails(propertyName);
    if(property === false) return false;

    const adapter = await makeAdapter();
    const logoUrl = await adapter.getFile("resources/logo/logo-black-background.png");
    const hhPoolSidePhotoUrl = await adapter.getFile("resources/property_photos/harmony_hill/hh-pool-side-1.jpeg");
    
    return {
        "property": {
            "title"         : property.name,
            "currency"      : property.currency,
            "email"         : property.email,
            "phone"         : property.phone,
            "zip_code"      : property.address.zipcode,
            "country"       : property.address.country2,
            "state"         : property.address.state,
            "city"          : property.address.city,
            "address"       : property.address.street,
            "longitude"     : property.address.longitude,
            "latitude"      : property.address.latitude,
            "timezone"      : property.address.timezone,
            "facilities"    : facilities,
            "property_type" : "hotel",
            "group_id"      : groupId,
            "settings"      : {
                "allow_availability_autoupdate_on_confirmation": true,
                "allow_availability_autoupdate_on_modification": false,
                "allow_availability_autoupdate_on_cancellation": false,
                "min_stay_type": "both",
                "min_price": null,
                "max_price": null,
                "state_length": 500,
                "cut_off_time": "00:00:00",
                "cut_off_days": 0,
                "max_day_advance": null
            },
            "content": {
                "description": property.description,
                "photos": [{
                    "url": hhPoolSidePhotoUrl,
                    "position": 0,
                    "author": property.name,
                    "kind": "photo",
                    "description": "Pool Side"
                }],
                "important_information": "Insects, no AC, vegan",
            },
            "logo_url": logoUrl,
            "website": property.website
        }
    };
};

export const createRatePlanCreateRequest = (propertyId, roomTypeId, taxSetId, cancellationPolicyId, title) => {
    return {
        "rate_plan": {
            "title": title,
            "property_id": propertyId,
            "room_type_id": roomTypeId,
            "tax_set_id": taxSetId,
            "cancellation_policy_id": cancellationPolicyId,
            "parent_rate_plan_id": null,
            "children_fee": "0.00",
            "infant_fee": "0.00",
            //                       Mon    Tues   Wed    Thu    Fri    Sat    Sun
            "max_stay"            : [0,     0,     0,     0,     0,     0,     0    ],
            "min_stay_arrival"    : [1,     1,     1,     1,     1,     1,     1    ],
            "min_stay_through"    : [1,     1,     1,     1,     1,     1,     1    ],
            "closed_to_arrival"   : [false, false, false, false, false, false, false],
            "closed_to_departure" : [false, false, false, false, false, false, false],
            "stop_sell"           : [false, false, false, false, false, false, false],

            "options": [{
                "occupancy": 3,
                "is_primary": true,
                "rate": 0
            }],
            "currency": "IDR",
            "sell_mode": "per_room",
            "rate_mode": "manual",
            "inherit_rate": false,
            "inherit_closed_to_arrival": false,
            "inherit_closed_to_departure": false,
            "inherit_stop_sell": false,
            "inherit_min_stay_arrival": false,
            "inherit_min_stay_through": false,
            "inherit_max_stay": false,
            "inherit_max_sell": false,
            "inherit_max_availability": false,
            "inherit_availability_offset": false,
            "auto_rate_settings": null
        }
    };
};

export const createCancellationPolicyCreateRequest = (propertyId, title) => {
    return {
        "cancellation_policy": {
            "property_id": propertyId,

            "title": title,
            "currency": "IDR",

            // charged a prepayment of 50% of the reservation at the time of booking.
            "guarantee_payment_policy": "percent_based",
            "guarantee_payment_amount": "50",

            "after_reservation_cancellation_logic": "guarantee_amount",
            
            // Guarantee payment is non-refundable
            "cancellation_policy_logic": "non_refundable",
            
            "cancellation_policy_mode": "percent",

            // Non-show will be charged the total price
            "non_show_policy": "total_price",
            
            // This rule will be applicable up to 7 days before arrival. After this time booking is non-refundable
            "cancellation_policy_deadline": 7,

            "cancellation_policy_deadline_type": null,
            
            // -1 => collect at booking time?
            "guarantee_collected_at_days": -1,

            "cancellation_policy_penalty": null,
            "after_reservation_cancellation_amount": null,
            "associated_rate_plan_ids": null
        }
    };
};

export const createTaxSetCreateRequest = (propertyId, ratePlanIds, taxIds, title) => {
    return {
        "tax_set": {
            "title": title,
            "property_id": propertyId,
            "associated_rate_plan_ids": ratePlanIds,
            "taxes": taxIds,
            "currency": "IDR"
        }
    };
};

export const createHotelPolicyCreateRequest = (propertyId, title) => {
    return {
        "hotel_policy": {
            "property_id": propertyId,
            "title": title,
            "currency": "IDR",
            "is_adults_only": false,
            "max_count_of_guests": 6,
            //"checkin_time": "14:00",
            //"checkout_time": "11:00",
            "checkin_from_time":"14:00",
            "checkin_to_time":"19:00",
            "checkout_from_time":"08:00",
            "checkout_to_time":"11:00",
            "internet_access_type": "wifi",
            "internet_access_cost": null,
            "internet_access_coverage": "entire_property",
            "parking_type": "on_site",
            "parking_reservation": "needed",
            "parking_is_private": true,
            "pets_policy": "not_allowed",
            "pets_non_refundable_fee": "0.00",
            "pets_refundable_deposit": "0.00",
            "smoking_policy": "no_smoking"
        }
    };
};

export const createTaxCreateRequest = (propertyId, title) => {
    return {
        "tax": {
            "title": title,
            "logic": "percent",
            "type": "tax",
            "rate": "20.00",
            "is_inclusive": true,
            "property_id": propertyId,
            "skip_nights": 1,
            "max_nights": 10,
            "applicable_date_ranges": [{
                "after": "2024-01-01",
                "before": "2024-12-31"
            }]
        }
    };
};

export const createRoomTypeCreateRequest = (propertyId, photos) => {
    const photos_ = photos.map((photo, index) => {
        return {
            author      : photo.author,
            description : photo.description,
            kind        : "photo",  // photo | ad | menu
            position    : index,
            url         : photo.url,
        };
    });

    return {
        "room_type": {
            "property_id": propertyId,
            "title": "3-bed room villa",
            // Amount of rooms for sale of this type (i.e. how many 3-bedroom villas we have)
            "count_of_rooms": 1,
            "occ_adults": 6,
            "occ_children": 0,
            "occ_infants": 0,
            "default_occupancy": 6,
            "facilities": [],
            // "room" | "dorm"
            "room_kind": "room",
            // Only to be defined if room_kind == "dorm"
            "capacity": null,
            "content": {
                "description": "3-bedroom villa with pool & private chef",
                "photos": photos_
            }
        }
    };
};