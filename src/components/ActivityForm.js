import React, { useState, useEffect } from 'react';
import "./ActivityForm.css";
import MyDatePicker from "./MyDatePicker.js";
import Dropdown from "./Dropdown.js";
import ProviderDropdown from "./ProviderDropdown.js";
import * as utils from "../utils.js";
import * as userService from "../services/userService.js";
import TextInput from './TextInput.js';
import { useNotification } from "../context/NotificationContext.js";
import { Checkbox, FormControlLabel } from '@mui/material';

export default function ActivityForm({ selectedActivity, formData, handleFormDataChange }) {
    const [teamMembers, setTeamMembers] = useState([]);

    const custom = selectedActivity ? selectedActivity.subCategory === "custom" || selectedActivity.custom === true : false;

    const { onError } = useNotification();

    const onProviderSelect = (provider) => {
        const name = provider ? provider.name : '';
        const price = provider ? provider.price : 0;
        handleFormDataChange("_batch", {
            "provider": name,
            "providerPrice": price,
        });
    }

    const onSetNeedsProviderChecked = (checked) => {
        handleFormDataChange("needsProvider", checked);
    }

    const onTeamMemberSelect = (teamMember) => {
        const name = teamMember ? teamMember.name : '';
        handleFormDataChange("assignedTo", name);
    }

    const statuses = {
        "pending guest confirmation": { "name": "Pending Guest Confirmation" },
        "guest confirmed": { "name": "Guest Confirmed" },
    };

    const onGuestConfirmed = (checked) => {
        if (checked) {
            if (formData.status === "pending guest confirmation") {
                handleFormDataChange("status", "guest confirmed");
            }
        } else {
            // If status is further along, e.g. "started" or "completed", no sense in letting it go back to "pending"
            if (formData.status === "guest confirmed") {
                handleFormDataChange("status", "pending guest confirmation");
            }
        }
    }

    // Transform object from {"Rena": 500000}  to  {"Rena - Rp 500000": {"name": Rena, "price": 500000}}
    const providers = selectedActivity ? Object.entries(selectedActivity.providerPrices).reduce((m, activity) => {
        const name = utils.capitalizeWords(activity[0]);
        //const price = utils.formatDisplayPrice(activity[1], true);
        m[`${name}`] = { "name": name, "price": activity[1] };
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

            <TextInput
                type="text"
                name="displayName"
                label={"Name"}
                value={formData.displayName}
                onChange={(e) => handleFormDataChange(e.target.name, e.target.value)}
            />

            <TextInput
                type="amount"
                name="customerPrice"
                label={"Customer Price"}
                value={formData.customerPrice}
                onChange={(e) => handleFormDataChange(e.target.name, e.target.value, "amount")}
            />

            <Dropdown
                current={formData.assignedTo}
                label={"Assign to team member"}
                options={teamMembers}
                onSelect={onTeamMemberSelect}
            />

            <FormControlLabel
                sx={{ display: 'flex', width: '100%', mt: 2 }}
                control={
                    <Checkbox
                        checked={formData["status"] !== "pending guest confirmation"}
                        onChange={(e) => {
                            onGuestConfirmed(e.target.checked);
                        }}
                    />
                }
                label="Guest confirmed?"
            />

            {/* (External) providers are not needed for activities organized by internal staff */}
            {(selectedActivity.internal !== true || custom === true) && (<>
                {formData.needsProvider !== false && (

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
                            <div className="last-child">
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
                )}

                <FormControlLabel
                    sx={{ display: 'flex', width: '100%', mt: 0, mb: 2 }}
                    control={
                        <Checkbox
                            checked={formData.needsProvider}
                            onChange={(e) => {
                                onSetNeedsProviderChecked(e.target.checked)
                            }}
                        />
                    }
                    label="Needs provider?"
                />
            </>)}

            <MyDatePicker
                name={"startingAt"}
                label="Start"
                date={formData.startingAt}
                time={formData.startingTime}
                onChange={handleFormDataChange}
            />

            <TextInput
                type="text"
                name="comments"
                label={"Comments"}
                value={formData.comments}
                onChange={(e) => handleFormDataChange(e.target.name, e.target.value)}
            />
        </div>
    );
}
