
import { defineSecret } from "firebase-functions/params";
const channexApiKey = defineSecret('CHANNEX_API_KEY');

const PROTOCOL = "https://";
const ENV = "staging";
const DOMAIN = "channex.io";
const PATH_PREFIX = "api/v1";
const CHANNEX_URL = `${PROTOCOL}${ENV}.${DOMAIN}/${PATH_PREFIX}`;

const GROUPS_API                = `${CHANNEX_URL}/groups`;
const PROPERTIES_API            = `${CHANNEX_URL}/properties`;
const RATE_PLANS_API            = `${CHANNEX_URL}/rate_plans`;
const CANCELLATION_POLICIES_API = `${CHANNEX_URL}/cancellation_policies`;
const TAX_SETS_API              = `${CHANNEX_URL}/tax_sets`;
const HOTEL_POLICIES_API        = `${CHANNEX_URL}/hotel_policies`;
const TAXES_API                 = `${CHANNEX_URL}/taxes`;
const ROOM_TYPES_API            = `${CHANNEX_URL}/room_types`;
const PROPERTY_FACILITIES_API   = `${CHANNEX_URL}/property_facilities`; 

export function createErrorResponse(statusCode, message) {
    return { 
        isOk : false,
        status: statusCode, 
        error: message
    };
}

const callChannex = async (method, api, body) => {
    const apiKey = channexApiKey.value();
    if(!apiKey) return {isOk : false, status : 500, body: {errors: "Cannot find API key"}};

    const request = {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "user-api-key": apiKey,
        },
    };

    if(body) request.body = JSON.stringify(body);

    const response = await fetch(api, request);
    const responseBody = await response.json();

    return {isOk : response.ok, status : response.status, body: responseBody};
};

export async function getFacilityOptions() {
    const response = await callChannex("GET", PROPERTY_FACILITIES_API);
    return response;
}

export async function getGroups() {
    return await callChannex("GET", GROUPS_API);
}

export async function getProperties() {
    return await callChannex("GET", PROPERTIES_API);
}

export async function createGroup(request) {
    const response = await callChannex("POST", GROUPS_API, request);
    return response;
}

export async function createProperty(request) {
    const response = await callChannex("POST", PROPERTIES_API, request);
    return response;
}

export async function createRoomType(request) {
    const response = await callChannex("POST", ROOM_TYPES_API, request);
    return response;
};

export async function createTax(request) {
    const response = await callChannex("POST", TAXES_API, request);
    return response;
}

export async function createRatePlan(request) {
    const response = await callChannex("POST", RATE_PLANS_API, request);
    return response;
}

export async function createCancellationPolicy(request) {
    const response = await callChannex("POST", CANCELLATION_POLICIES_API, request);
    return response;
}

export async function createTaxSet(request) {
    const response = await callChannex("POST", TAX_SETS_API, request);
    return response;
}

export async function createHotelPolicy(request) {
    const response = await callChannex("POST", HOTEL_POLICIES_API, request);
    return response;
}
