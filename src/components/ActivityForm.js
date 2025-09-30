import React, { useState, useEffect } from 'react';
import "./ActivityForm.css";
import MyDatePicker from "./MyDatePicker.js";
import Dropdown from "./Dropdown.js";
import ProviderDropdown from "./ProviderDropdown.js";
import * as utils from "../utils.js";
import * as userService from "../services/userService.js";
import ErrorNoticeModal from './ErrorNoticeModal.js';
import TextInput from './TextInput.js';
import { useNotification } from "../context/NotificationContext.js";

export default function ActivityForm({ selectedActivity, formData, handleFormDataChange }) {
    const [teamMembers,   setTeamMembers  ] = useState([]   );
    const [errorMessage,  setErrorMessage ] = useState(null );
    const [needsProvider, setNeedsProvider] = useState(formData?.needsProvider);

    const custom = selectedActivity ? selectedActivity.subCategory === "custom" || selectedActivity.custom === true : false;
            
    const { onError } = useNotification();

    const onProviderSelect = (provider) => {
        const name = provider ? provider.name : '';
        const price = provider ? provider.price : 0;
        handleFormDataChange("_batch", {
            "provider"      : name,
            "providerPrice" : price,
        });
    }

    const onSetNeedsProviderChecked = (checked) => {
        setNeedsProvider(checked);
        handleFormDataChange("needsProvider", checked);
    }

    const onTeamMemberSelect = (teamMember) => {
        const name = teamMember ? teamMember.name : '';
        handleFormDataChange("assignedTo", name);
    }

    const onStatusSelect = (status) => {
        let name = status ? status.name : null;
        name = utils.isString(name) ? name.toLowerCase() : null;
        handleFormDataChange("status", name);
    }

    // Transform object from {"Rena": 500000}  to  {"Rena - Rp 500000": {"name": Rena, "price": 500000}}
    const providers = selectedActivity ? Object.entries(selectedActivity.providerPrices).reduce((m, activity) => {
        const name = utils.capitalizeWords(activity[0]);
        //const price = utils.formatDisplayPrice(activity[1], true);
        m[`${name}`] = { "name" : name, "price" : activity[1] };
        return m;
    }, {}) : [];

    useEffect(() => {
        const fetchTeamMembers = async () => {
            const teamMembers = await userService.getUsers();
            const formattedTeamMembers = teamMembers.reduce((m, teamMember) => {
                m[teamMember.name] = teamMember;
                return m;
            }, {})
            setTeamMembers(formattedTeamMembers);
        };

        fetchTeamMembers();
    }, []);

    const statuses = {
        "requested" : {"name" : "requested"},
        "confirmed" : {"name" : "confirmed"},
    };

    return (
        <div className='card-content'>
            <h3>Confirm Purchase Details:</h3>
            
            {selectedActivity.description && (
                <div>
                    <h4 style={{ marginBottom: '0.25rem' }}>Description</h4>
                    <p style={{ marginTop: '0' }}>{selectedActivity.description}</p>
                </div>
            )}

            {selectedActivity.instructions && (
                <div>
                    <h4 style={{ marginBottom: '0.25rem' }}>Instructions</h4>
                    <p style={{ marginTop: '0' }}>{selectedActivity.instructions}</p>
                </div>
            )}
            
            <div className="purchase-form-group">
                <label htmlFor="displayName">Name:</label>
                <div className="display-name-input-wrapper">
                    <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        // Apply formatting here for display inside the input
                        value={formData.displayName}
                        onChange={(e) => handleFormDataChange(e.target.name, e.target.value)}
                        className="input"
                    />
                </div>
            </div>

            <div className="purchase-form-group">
                <label htmlFor="purchasePrice">Price:</label>
                <div className="price-input-wrapper"> {/* Wrapper for "Rp" and input */}
                    <span className="currency-prefix">{utils.getCurrency()}</span>
                    <input
                        type="text" // Changed from "number" to "text"
                        id="purchasePrice"
                        name="customerPrice"
                        // Apply formatting here for display inside the input
                        value={utils.formatDisplayPrice(formData.customerPrice)}
                        onChange={(e) => handleFormDataChange(e.target.name, e.target.value, "amount")}
                        className="input"
                    />
                </div>
            </div>

            <div className="purchase-form-group">
                <Dropdown 
                    current={formData.assignedTo} 
                    label={"Assign to team member"} 
                    options={teamMembers} 
                    onSelect={onTeamMemberSelect}
                />
            </div>

            <div className="purchase-form-group">
                <Dropdown 
                    current={formData.status} 
                    label={"Status"} 
                    options={statuses} 
                    onSelect={onStatusSelect}
                />
            </div>

            {/* (External) providers are not needed for activities organized by internal staff */}
            { selectedActivity.internal !== true && (<> 
                <div className="purchase-form-group">
                    <div className="provider-row">
                        <div className="provider-name">
                            <TextInput
                                type="text"
                                name="provider"
                                label={"Provider"}
                                value={formData.provider}
                                onChange={(e) => handleFormDataChange(e.target.name, e.target.value)}
                            />
                        </div>

                        <div className="provider-price">
                            <TextInput
                                type="amount"
                                name="providerPrice"
                                label={"Provider Price"}
                                value={formData.providerPrice}
                                onChange={(e) => handleFormDataChange(e.target.name, e.target.value, "amount")}
                            />
                        </div>

                        {!utils.isEmpty(providers) && (
                            <div className="last-chile">
                                <ProviderDropdown 
                                    currentName={formData.provider} 
                                    currentPrice={formData.providerPrice} 
                                    label={"Providers"} 
                                    options={providers} 
                                    onSelect={onProviderSelect}
                                />
                            </div>
                        )}
                    </div>                
                </div>

                { custom && (
                    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                            type="checkbox"
                            checked={needsProvider}
                            onChange={(e) => onSetNeedsProviderChecked(e.target.checked)}
                        />
                        <span>Needs provider?</span>
                    </label>
                )}
            </>)}
            <div className="purchase-form-group">
                <MyDatePicker 
                    name={"startingAt"} 
                    date={formData.startingAt} 
                    time={formData.startingTime} 
                    onChange={handleFormDataChange} 
                />
            </div>
            <div className="purchase-form-group">
                <label htmlFor="purchaseComments">Comments:</label>
                <textarea
                    id="purchaseComments"
                    name="comments"
                    value={formData.comments}
                    onChange={(e) => handleFormDataChange(e.target.name, e.target.value)}
                    rows="3"
                    className="input"
                ></textarea>
            </div>
        </div>
    );
}
