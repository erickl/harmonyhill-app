import * as utils from "../utils.js";
import "./TextInput.css";

export default function TextInput({type, name, label, value, onChange}) {
    let baseType = "text";
    let formattedValue = value;
    if(utils.isEmpty(name) && !utils.isEmpty(label)) {
        name = label.trim().toLowerString();
    }
    let formattedLabel = label ? label : utils.capitalizeWords(name);

    if(type === "amount") {
        baseType = "text";
        formattedValue = utils.formatDisplayPrice(value);
        formattedLabel = `${label} (${utils.getCurrency()})`
    }

    return (
        <div className="floating-label-input">
            <input
                id={name}
                name={name}
                type={baseType}
                value={formattedValue}
                onChange={onChange}
                placeholder=" " 
            />
            <label htmlFor="name">{formattedLabel}</label>
        </div>
    );
}
