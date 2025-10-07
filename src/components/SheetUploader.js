import React, { useEffect, useState } from "react";
import { useGoogleApi } from "../hooks/useGoogleApi";
import { GoogleOAuthProvider } from "@react-oauth/google";
import * as utils from "../utils.js";
import { useNotification } from "../context/NotificationContext.js";
import { Upload } from 'lucide-react';
import { useFilters } from "../context/FilterContext.js";

// https://console.cloud.google.com/auth/overview?project=harmonyhill-1

const CLIENT_ID = `${process.env.REACT_APP_OAUTH2_CLIENT_ID}.apps.googleusercontent.com`;
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

const SPREADSHEET_ID = `${process.env.REACT_APP_SHEET_ID}`;

export default function SheetUploader({onExportRequest, filterHeaders}) {
    const googleLoaded = useGoogleApi();
    const [accessToken, setAccessToken] = useState(null);
    const {onError} = useNotification();
    const {onFilter, getFilters} = useFilters();

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
        await uploadData(rows, token);
    } 

    // Note: 'values' is a key word for the google sheets API. Keep the name
    const uploadData = async (values, token) => {
        const requestBody = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            // example: const rows = [["Name", "name@example.com", "data"]];
            body: JSON.stringify({values}),
        }

        // the range or sheet name you want to append to
        const range = "Sheet1!A1";

        const sheetApiEndpoint = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED`;
        
        try {
            const response = await fetch(sheetApiEndpoint, requestBody);
            const result = await response.json();
            
            if(utils.exists(result, "error")) {
                const error = result.error;
                onError(`Error calling Google Sheet API: ${error.message} (${error.code})`);
            } else {
                //onSuccess(`Success! ${JSON.stringify(result)}`);
                return true;
            }
        } catch (err) {
            onError(`Unexpected error uploading to sheet: ${err.message}`);
        }
    };

    return (
        <GoogleOAuthProvider clientId={`${CLIENT_ID}.apps.googleusercontent.com`}>
            <div style={{margin:"1rem"}}>
                <Upload onClick={handleExportClick}/>
            </div>
        </GoogleOAuthProvider>
    );
}
