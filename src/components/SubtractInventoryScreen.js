import React, { useState, useEffect } from 'react';
import ButtonsFooter from "./ButtonsFooter.js";
import TextInput from "./TextInput.js";
import Dropdown from "./Dropdown.js";
import * as bookingService from "../services/bookingService.js";
import * as inventoryService from "../services/inventoryService.js"
import * as utils from "../utils.js";
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";

export default function SubtractInventoryScreen({onNavigate, item, onClose}) {
    const initialForm = {
        quantity : 0,
        booking  : null,
        type     : null,
    }

    const types = {
        "sale"    : { name : "sale"    },
        "lost"    : { name : "lost"    },
        "expired" : { name : "expired" },
        "broken"  : { name : "broken"  },
    };

    const [form,            setForm           ] = useState(initialForm);
    const [bookings,        setBookings       ] = useState([]);
    const [validated,       setValidated      ] = useState(false);
    const [validationError, setValidationError] = useState(null);

    const { onError } = useNotification();
    const { onSuccess } = useSuccessNotification();

    const onValidationError = (error) => {
        setValidationError(error);
    };

    const handleInputChange = (name, value, type) => {
        let nextFormData = {};
        
        if (name === "_batch" && typeof value === 'object' && value !== null) {
            nextFormData = ({ ...form, ...value });
        } else if(type === "amount") {
            nextFormData = { ...form, [name]: utils.cleanNumeric(value)};
        } else {
            nextFormData = { ...form, [name]: value };
        }
        
        if(!utils.isEmpty(nextFormData)) {
            setForm(nextFormData);
        }

        validateFormData(nextFormData);
    };

    const validateFormData = async (nextFormData) => {
        const validationResult = await inventoryService.validateSubtraction(nextFormData, onValidationError);

        setValidated(validationResult);

        if(validationResult === true) {
            setValidationError(null);
        }
    };

    const handleSubmit = async () => {
        try {
            if(!validated) {
                onError(`Not yet ready to submit. Missing obligatory data`);
                return;
            }
            
            const result = await inventoryService.subtract(form.booking, form.type, item.name, form.quantity, onError);
   
            if(result !== false) {
                setForm(initialForm);
                onSuccess();
                onClose();
            }
        } catch(e) {
            onError(`Submit error: ${e.message}`);
        }        
    };

    const onBookingSelect = (booking) => {
        handleInputChange("booking", booking);
    }

    const onTypeSelect = (type) => {
        const name = type ? type.name : '';
        handleInputChange("type", name);
    }

    useEffect(() => {
        const getBookings = async() => {
            const filter = { after: utils.today(-7) };
            const bookings_ = await bookingService.get(filter);
            const formattedBookings = bookings_.reduce((m, booking) => {
                const date = utils.to_ddMMM(booking.checkInAt);
                m[`${date}: ${booking.name}`] = booking;
                return m;
            }, {})
            setBookings(formattedBookings);
        };

        getBookings();

        validateFormData(initialForm);
    }, []);

    return (
        <div className="fullscreen">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Subtract Inventory: {item.name}</h2>
                </div>
            </div>

            <div className="card-content space-y-6">
                <div>
                    <TextInput 
                        type={"amount"}
                        name={"quantity"}
                        label={"Quantity"}
                        value={form.quantity}
                        onChange={(e) => handleInputChange("quantity", e.target.value, "amount")}
                    />
                </div>

                <div>
                    <Dropdown 
                        label={"Booking"}
                        current={form.booking ? form.booking.name : null}
                        options={bookings}
                        onSelect={onBookingSelect}
                    />
                </div>

                <div>
                    <Dropdown 
                        label={"Type"}
                        current={form.type}
                        options={types}
                        onSelect={onTypeSelect}
                    />
                </div>
            </div>

            {(validationError && <p className="validation-error">{validationError}</p>)}

            <ButtonsFooter 
                onCancel={onClose}
                onSubmit={handleSubmit}
                submitEnabled={validated}
            />
        </div>
    )
}
