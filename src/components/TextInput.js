import * as utils from "../utils.js";
import "./TextInput.css";

export default function TextInput({type, name, label, value, onChange}) {
    let baseType = "text";
    let formattedValue = value;
    if(utils.isEmpty(name) && !utils.isEmpty(label)) {
        name = label.trim().toLowerCase();
    }
    let formattedLabel = label ? label : utils.capitalizeWords(name);

    if(type === "amount") {
        baseType = "text";
        formattedValue = utils.formatDisplayPrice(value);
    }

    else if(type === "price") {
        baseType = "text";
        formattedValue = utils.formatDisplayPrice(value);
        formattedLabel = `${label} (${utils.getCurrency()})`
    }

    const onChangeInternal = (e) => {
        let value = e.target.value;
        if(type === "amount" || type === "price") {
            value = utils.cleanNumeric(value);
        }
        if(onChange) onChange(e.target.name, value, type);
    }

    return (
        <div className="floating-label-input">
            <input
                id={name}
                name={name}
                type={baseType}
                value={formattedValue}
                onChange={onChangeInternal}
                placeholder=" " 
            />
            <label htmlFor="name">{formattedLabel}</label>
        </div>
    );
}
