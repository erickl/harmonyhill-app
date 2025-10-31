import React, { useEffect, useState } from "react";
import { useGoogleApi } from "../hooks/useGoogleApi.js";
import { GoogleOAuthProvider } from "@react-oauth/google";
import * as utils from "../utils.js";
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js"; 
import { Upload } from 'lucide-react';
import { useFilters } from "../context/FilterContext.js";

// https://console.cloud.google.com/auth/overview?project=harmonyhill-1

// Data uploaded to:
const TO_DATA_URL = `https://docs.google.com/spreadsheets/d/1hX74179qK7E_SOjuTqcPRc5_RX2KhkAp_jn9bZp5EGI/edit?gid=0#gid=0`;

const CLIENT_ID = `${process.env.REACT_APP_OAUTH2_CLIENT_ID}.apps.googleusercontent.com`;
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
const BASE_API = `https://sheets.googleapis.com/v4/spreadsheets`;

const SPREADSHEET_ID = `${process.env.REACT_APP_SHEET_ID}`;

export default function SheetUploader({label, onExportRequest, filterHeaders}) {
    const googleLoaded = useGoogleApi();
    const [accessToken, setAccessToken] = useState(null);
    const {onError} = useNotification();
    const {onFilter} = useFilters();
    const {onSuccess} = useSuccessNotification();

    const isTokenExpired = (token) => {
        try {
            const [, payload] = token.split(".");
            const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
            const now = Math.floor(Date.now() / 1000);
            return decoded.exp < now;
        } catch (e) {
            return true; // if can't decode, treat as expired
        }
    };

    const getRequestAccessToken = () => {
        return new Promise((resolve, reject) => {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (response) => {
                    console.log(response);
                    if(response.error) {
                        reject(response.error);
                    }
                    else if (response.access_token) {
                        resolve(response.access_token);
                    }
                },
            });

            // request a token without showing a popup if the user already granted consent before, 
            // otherwise fallback to the login prompt
            tokenClient.requestAccessToken({ prompt: "" });
        })
    }

    const auth = async () => { 
        if (accessToken && !isTokenExpired(accessToken)) {
            return accessToken;
        }

        let token = null;
        try {
            token = null;//localStorage.getItem("google_access_token");
            if(!token) {
                if (!googleLoaded) {
                    alert("Google login not ready yet");
                    return null;
                }
                token = await getRequestAccessToken();  
            }
            //if(token is error) todo...
            setAccessToken(token);
            localStorage.setItem("google_access_token", token);
        } catch(e) {
            onError(`Error getting oauth2 token: ${e.message}`);
        }
        
        return token;
    }

    const handleExportClick = async () => {
        const onFilterValuesSubmit = (filterValues) => {
            handleUploadClick(filterValues);
        };
        onFilter(filterHeaders, onFilterValuesSubmit);
    } 

    const handleUploadClick = async (filterValues) => {
        const rows = await onExportRequest(filterValues);
        const token = await auth();
        const result = await uploadData(rows, token);
        if(result) {
            onSuccess(`See data here: ${TO_DATA_URL}`);
        }
    } 

    // Note: 'values' is a key word for the google sheets API. Keep the name
    const uploadData = async (values, token) => {
        // the range or sheet name you want to append to
        const sheetName = `${label} ${utils.to_ddMMM_HHmm()}`;
        const range = `${sheetName}!A1`;

        const sheetExists = await ensureSheetExists(token, range);
        if(!sheetExists) {
            return;
        }

        const requestBody = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            // example: const rows = [["Name", "name@example.com", "data"]];
            body: JSON.stringify({values}),
        }

        const sheetApiEndpoint = `${BASE_API}/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED`;
        
        try {
            const response = await fetch(sheetApiEndpoint, requestBody);
            const result = await response.json();
            
            if(utils.exists(result, "error")) {
                const error = result.error;
                onError(`Error calling Google Sheet API: ${error.message} (${error.code})`);
            } else {
                return true;
            }
        } catch (err) {
            onError(`Unexpected error uploading to sheet: ${err.message}`);
        }
    };

    /**
     * Ensures a sheet exists within a Google Spreadsheet 
     * If the sheet does not exist, it is created first.
     * @param {string} token The bearer token for authorization.
     * @param {string} targetRange The A1 notation range, e.g., "Sheet3!A1"..
     * @returns {Promise<boolean>} Resolves to true on success, false otherwise.
     */
    async function ensureSheetExists(token, targetRange) {
        // --- Configuration ---
        const sheetName = targetRange.split('!')[0];

        const authHeaders = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };

        // Helper to perform fetch requests
        const fetchApi = async (url, config) => {
            try {
                const response = await fetch(url, config);
                const result = await response.json();
                
                // Check for API-specific error structure
                if (result && result.error) {
                    const error = result.error;
                    throw new Error(`Google Sheet API Error: ${error.message} (${error.code})`);
                }
                return result;
            } catch (err) {
                onError(`${err.message}`);
                return false;
            }
        };

        // 1. CHECK FOR SHEET EXISTENCE
        try {
            const metadataUrl = `${BASE_API}/${SPREADSHEET_ID}?fields=sheets.properties.title`;
            const metadata = await fetchApi(metadataUrl, { method: "GET", headers: authHeaders });

            const sheetExists = metadata.sheets.some(
                sheet => sheet.properties.title === sheetName
            );

            if (!sheetExists) {
                console.log(`Sheet "${sheetName}" not found. Creating new sheet...`);

                // 2. CREATE SHEET IF IT DOES NOT EXIST
                const batchUpdateUrl = `${BASE_API}/${SPREADSHEET_ID}:batchUpdate`;
                const createSheetRequestBody = {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetName,
                                // Optional: set initial grid size
                                gridProperties: {
                                    rowCount: 1000, 
                                    columnCount: 26 
                                }
                            }
                        }
                    }]
                };

                await fetchApi(batchUpdateUrl, {
                    method: "POST",
                    headers: authHeaders,
                    body: JSON.stringify(createSheetRequestBody),
                });
                
                console.log(`Sheet "${sheetName}" created successfully.`);

                return true;
            }  
        } catch (e) {
            // Handle error during check or create phase
            onError(`Failure during sheet check/create: ${e.message}`);
            return false;
        }
    }

    return (
        <GoogleOAuthProvider clientId={`${CLIENT_ID}.apps.googleusercontent.com`}>
            <div style={{margin:"1rem", display:"flex", flexDirection: "column", alignItems: "center"}}>
                <Upload onClick={handleExportClick} />
                {label && (<span>{label}</span>)}
            </div>
        </GoogleOAuthProvider>
    );
}
