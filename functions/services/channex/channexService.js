import * as utils from "@harmonyhill/shared/utils.js";
import { makeAdapter } from "../../db-adapter.js";
import * as client from "./channexClient.js";
import * as mappers from "./channexMappers.js";

/**
 * Get the facilities in Channex's library, which can assigned to a property
 */
export async function getFacilityOptions() {
    return await client.getFacilityOptions();
}

export async function getGroup(groupName) {
    const response = await getGroups({name: groupName});
    const groups = response.body.data;
    if(isArray(groups) && groups.length > 0) {
        response.body = groups[0];
    }
    return response;
}

export async function getGroups(filter) {
    const response = await client.getGroups();
    if(!response.isOk) return response;

    if(utils.exists(filter, "name")) {
        response.body.data = response.body.data.filter((property) => property.attributes.title === filter.name);
    }

    return response;
}

export async function getProperty(propertyName) {
    const response = await getProperties({name: propertyName});
    const properties = response.body.data;
    if(isArray(properties) && properties.length > 0) {
        response.body = properties[0];
    }
    return response;
}

export async function getProperties(filter) {
    const response = await client.getProperties();
    if(!response.isOk) return response;

    if(utils.exists(filter, "name")) {
        response.body.data = response.body.data.filter((property) => property.attributes.title === filter.name);
    }

    return response;
}

export async function createGroup(groupName) {
    const request = mappers.createGroupCreateRequest(groupName);
    const response = await client.createGroup(request);
    return response;
}

export async function createProperty(propertyName, groupId, facilities) {
    const request = await mappers.createPropertyCreateRequest(propertyName, groupId, facilities);
    if(propertyCreateRequest === false) {
        return client.createErrorResponse(500, "Cannot create property create request");
    }

    const response = await client.createProperty(request);
    return response;
}

export async function createRoomType(propertyId) {
    const adapter = await makeAdapter();
    const hhPoolSidePhotoUrl = await adapter.getFile("resources/property_photos/harmony_hill/hh-pool-side-1.jpeg");
    const photos = [{
        "author": "Harmony Hill",
        "description": "Pool View",
        "url": hhPoolSidePhotoUrl
    }];

    const request = mappers.createRoomTypeCreateRequest(propertyId, photos);
    const response = await client.createRoomType(request);
    return response;
}
  
export async function createTax(propertyId, title) {
    const request = mappers.createTaxCreateRequest(propertyId, title);
    const response = await client.createTax(request);
    return response; 
}

export async function createHotelPolicy(propertyId, title) {
    const request = mappers.createHotelPolicyCreateRequest(propertyId, title);
    const response = await client.createHotelPolicy(request);
    return response
}

export async function createTaxSet(propertyId, ratePlanIds, taxIds, title) {
    const request = mappers.createTaxSetCreateRequest(propertyId, ratePlanIds, taxIds, title);
    const response = await client.createTaxSet(request);
    return response;
}

export async function createCancellationPolicy(propertyId, title) {
    const request = mappers.createCancellationPolicyCreateRequest(propertyId, title);
    const response = await client.createCancellationPolicy(request);
    return response;
}

export async function createRatePlan(propertyId, roomTypeId, taxSetId, cancellationPolicyId, title) {
    const request = mappers.createRatePlanCreateRequest(propertyId, roomTypeId, taxSetId, cancellationPolicyId, title);
    const response = await client.createRatePlan(request);
    return response;
}

export async function getPropertyDetails(propertyName) {
    const adapter = await makeAdapter();
    const properties = adapter.get("properties", ["name", "==", propertyName]);
    if(!properties || properties.length === 0) return false;
    return properties[0];
}
