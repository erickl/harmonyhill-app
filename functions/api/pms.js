import { onRequest } from "firebase-functions/v2/https"; 
import * as channexService from "../services/channex/channexService.js";
import { defineSecret } from "firebase-functions/params";

const channexApiKey = defineSecret('CHANNEX_API_KEY');

// http://localhost:5001/harmonyhill-1/us-central1/pms-facilities
export const facilities = onRequest({secrets:[channexApiKey]}, async (req, res) => {
    return await channexService.getFacilityOptions();
});

// http://localhost:5001/harmonyhill-1/us-central1/pms-get-properties
// export const properties = onRequest({secrets:[channexApiKey]}, async (req, res) => {
//     const resp = await callChannex("GET", `${channexUrl}/properties`);
//     return true;
// });

// http://localhost:5001/harmonyhill-1/us-central1/pms-createProperty
//res.status(200).json({test:"done"}); return;
export const createProperty = onRequest({secrets:[channexApiKey]}, async (req, res) => { 
    try {
        // Return response ID if successful, otherwise respond error and end it
        const endOrContinue = (resp) => {
            if(!resp || !resp.body) throw new Error("Missing response data");

            if(!resp.isOk || !resp.body.data || !resp.body.data.id) {
                res.status(resp.status).json(resp.body);
                return false;
            }
            return resp.body.data.id;
        };

        // Create group, if it doesn't already exist. One group can hold many properties
        const groupName = "Harmony Hill Group";
        const propertyName = "Harmony Hill";
        
        const groupResponse = await channexService.getGroup(groupName);
        const group = groupResponse.body;
        let groupId = null;
        if(!group) {
            const groupCreateResponse = await channexService.createGroup(groupName);
            const groupId = endOrContinue(groupCreateResponse);
            if(groupId === false) return false;
        } else {
            groupId = group.id;
        }

        // Todo: we should get the whole list?
        const parkingFacility = {
            "attributes": {
                "id": "cfd17530-e04f-423a-9851-2981a225ab14",
                "title": "Accessible parking",
                "category": "food_and_drink"
            },
            "id": "cfd17530-e04f-423a-9851-2981a225ab14",
            "type": "facility",
        };
        const facilities = await channexService.getFacilityOptions();

        // Check if the property already exists
        const propertyResp = await channexService.getProperty(propertyName);
        const result = endOrContinue(propertyResp);
        if(result === false) return false;
        const property = result.body;

        // If it doesn't already exist, create the new property
        if(!property) {
            const propertyCreateResp = await channexService.createProperty(propertyName, groupId, [parkingFacility.id]);
            const propertyId = endOrContinue(propertyCreateResp);
            if(propertyId === false) return false;
        } else {
            res.status(500).json({error: `Property ${propertyName} already exists`});
            return false;
        }

        const roomTypeCreateResp = await channexService.createRoomType(propertyId);
        const roomTypeId = endOrContinue(roomTypeCreateResp);
        if(roomTypeId === false) return false;

        const taxCreateResp = await channexService.createTax(propertyId, "VAT");
        const taxId = endOrContinue(taxCreateResp);
        if(taxId === false) return false;

        const taxSetCreateResp = await channexService.createTaxSet(propertyId, [], [{id: taxId}], "Tax Set 1");
        const taxSetId = endOrContinue(taxSetCreateResp);
        if(taxSetId === false) return false;

        const cancellationPolicyResp = await channexService.createCancellationPolicy(propertyId, "Standard Cancellation Policy");
        const cancellationPolicyId = endOrContinue(cancellationPolicyResp);
        if(cancellationPolicyId === false) return false;

        const ratePlanResp = await channexService.createRatePlan(propertyId, roomTypeId, taxSetId, cancellationPolicyId, "Standard Rate");
        const ratePlanId = endOrContinue(ratePlanResp);
        if(ratePlanId === false) return false;

        const hotelPolicyCreateResp = await channexService.createHotelPolicy(propertyId, "Standard Policy");
        const hotelPolicyId = endOrContinue(hotelPolicyCreateResp);
        if(hotelPolicyId === false) return false;

        const resp = {
            message : "Property created"
        };

        res.status(200).json(resp);
        return true;
    } catch (error) {
        console.error("Request failed:", error);
        res.status(500).json({error: error.message});
        return false;
    }
});
