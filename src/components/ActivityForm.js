import React, { useState, useEffect } from 'react';
import "./ActivityForm.css";
import MyDatePicker from "./MyDatePicker.js";
import Dropdown from "./Dropdown.js";
import * as utils from "../utils.js";
import * as userService from "../services/userService.js";
import ErrorNoticeModal from './ErrorNoticeModal.js';

export default function ActivityForm({ selectedActivity, formData, handleFormDataChange, custom }) {
    const [teamMembers, setTeamMembers] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);
            
    const onError = (errorMessage) => {
        setErrorMessage(errorMessage);
    }

    const onProviderSelect = (provider) => {
        const name = provider ? provider.name : '';
        handleFormDataChange("provider", name);
    }

    const onTeamMemberSelect = (teamMember) => {
        const name = teamMember ? teamMember.name : '';
        handleFormDataChange("assignedTo", name);
    }

    // Transform object from {"Rena": 500000}  to  {"Rena - Rp 500000": {"name": Rena, "price": 500000}}
    const providers = selectedActivity ? Object.entries(selectedActivity.providerPrices).reduce((m, activity) => {
        const name = utils.capitalizeWords(activity[0]);
        const price = utils.formatDisplayPrice(activity[1], true);
        m[`${name} - ${price}`] = { "name" : name, "price" : activity[1] };
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

    const fixedCustomerPrice = selectedActivity && utils.isAmount(selectedActivity.customerPrice) ? selectedActivity.customerPrice : 0;
    const customPrice = custom && utils.isAmount(formData.customerPrice) ? formData.customerPrice : fixedCustomerPrice;

    return (
        <div>
            <h3>Confirm Purchase Details:</h3>
            <form>
                <div className="purchase-form-group">
                    <label htmlFor="purchasePrice">Price:</label>
                    <div className="price-input-wrapper"> {/* Wrapper for "Rp" and input */}
                        <span className="currency-prefix">{utils.getCurrency()}</span>
                        <input
                            type="text" // Changed from "number" to "text"
                            id="purchasePrice"
                            name="customerPrice"
                            // Apply formatting here for display inside the input
                            value={utils.formatDisplayPrice(customPrice)}
                            onChange={(e) => handleFormDataChange(e.target.name, e.target.value, "amount")}
                            className="input"
                        />
                    </div>
                </div>
                <div className="purchase-form-group">
                    <Dropdown label={"Assign to team member"} options={teamMembers} onSelect={onTeamMemberSelect}/>
                </div>
                { custom === true ? (
                    // For a custom activity, there are no determined set of providers
                    <div className="purchase-form-group">
                        <label htmlFor="provider">Provider:</label>
                        <div className="provider-input-wrapper">
                            <input
                                type="text"
                                id="provider"
                                name="provider"
                                // Apply formatting here for display inside the input
                                value={formData.provider}
                                onChange={(e) => handleFormDataChange(e.target.name, e.target.value)}
                                className="input"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="purchase-form-group">
                        <Dropdown label={"Select a provider"} options={providers} onSelect={onProviderSelect}/>
                    </div>
                )}
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
            </form>

            {errorMessage && (
                <ErrorNoticeModal 
                    error={errorMessage}
                    onClose={() => setErrorMessage(null) }
                />
            )}
        </div>
    );
}
