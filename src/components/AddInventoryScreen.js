import React, { useState, useEffect } from 'react';
import ButtonsFooter from "./ButtonsFooter.js";
import TextInput from "./TextInput.js";
import Dropdown from "./Dropdown.js";
import * as expenseService from "../services/expenseService.js";
import * as inventoryService from "../services/inventoryService.js"
import * as utils from "../utils.js";
import { useNotification } from "../context/NotificationContext.js";
import { useSuccessNotification } from "../context/SuccessContext.js";
import ItemsCountList from './ItemCountList.js';

export default function AddInventoryScreen({onNavigate, inventory, onClose}) {
    const initialQuantities = inventory.reduce((map, item) => {
        map[item.name] = 0;
        return map;
    }, {});

    const initialForm = {
        quantities : initialQuantities,
        expense  : null,
    }

    const [form,            setForm           ] = useState(initialForm);
    const [expenses,        setExpenses       ] = useState([]);
    const [validated,       setValidated      ] = useState(false);
    const [validationError, setValidationError] = useState(null);

    const { onError } = useNotification();
    const { onSuccess } = useSuccessNotification();

    const onValidationError = (error) => {
        setValidationError(error);
        return false;
    };

    const handleInputQuantity = (name, value) => {
        const cleanedValue = utils.cleanNumeric(value);
        const nextQuantities = ({ ...form.quantities, [name] : cleanedValue });
        handleInputChange("quantities", nextQuantities);
    }

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
        const validationResult = await inventoryService.validateRefill(nextFormData, onValidationError);

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
            
            const result = await inventoryService.refillMany(form.expense, form.quantities, onError);
   
            if(result !== false) {
                setForm(initialForm);
                onSuccess();
                onClose();
            }
        } catch(e) {
            onError(`Submit error: ${e.message}`);
        }        
    };

    const onExpenseSelect = (expense) => {
        //const expenseId = expense ? expense.id : '';
        handleInputChange("expense", expense);
    }

    useEffect(() => {
        const getExpenses = async() => {
            const filter = { after: utils.today(-7) };
            const expenses_ = await expenseService.get(filter);
            const formattedExpenses = expenses_.reduce((m, expense) => {
                const date = utils.to_ddMMM(expense.purchasedAt);
                m[`${date}: ${expense.description}`] = expense;
                return m;
            }, {})
            setExpenses(formattedExpenses);
        };

        getExpenses();

        validateFormData(initialForm);
    }, []);

    return (
        <div className="fullscreen">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Add Inventory</h2>
                </div>
            </div>

            <div className="card-content space-y-6">
                {form.expense && (
                    <img 
                        src={form.expense.photoUrl}
                        alt="Expense Receipt Preview"
                    />
                )}
                
                <div>
                    <Dropdown 
                        label={"Expense"}
                        current={form.expense ? form.expense.description : null}
                        options={expenses}
                        onSelect={onExpenseSelect}
                    />
                </div>

                {form.expense && (
                    <ItemsCountList 
                        quantities={form.quantities} 
                        onChangeCount={handleInputQuantity}
                    />
                )}
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
