import TextInput from "./TextInput.js";
import * as utils from "../utils.js";

/**
 * quantities is a map with item names as keys and their quantities as values, 
 * i.e {"Item Name 1" : 0, "Item Name 2 : 1", ...}
 * 
 * onChangeCount a callback which takes 2 parameters: item name and new quantity 
 */
export default function ItemsCountList({quantities, onChangeCount}) {
    const rowStyle = {
        display : "flex",
        alignItems: "center",
        maxWidth: "fit-content",
        gap: "1rem",
    };

    const buttonStyle = {
        width: "2rem",
        height: "2rem",
        borderRadius: "50%",
        border: "1px solid #ccc",
        background: "green",
        display: "flex",
        alignItems: "center",
        fontWeight: "bold",
        justifyContent: "center",
        fontSize: "1.5rem",
        lineHeight: "0",  
        cursor: "pointer",
        padding: 0,    
    };

    const plusButtonStyle = {...buttonStyle, background: "green"};
    const minusButtonStyle = {...buttonStyle, background: "red"};

    if(utils.isEmpty(quantities)) {
        return <div></div>;
    }

    return (
        <div className="card-content space-y-6"> 
            {Object.entries(quantities).map(([name, quantity]) => {
                return (
                    <div style={rowStyle}>
                        <TextInput 
                            type={"amount"}
                            name={name}
                            label={name}
                            value={quantity}
                            onChange={(e) => onChangeCount(e.target.name, e.target.value)}
                        />
                        <button
                            style={minusButtonStyle}
                            key={`${name}-decrement`}
                            //className="button activity-button"
                            onClick={() => {
                                onChangeCount(name, quantity-1)
                            }}
                        >
                            -
                        </button>
                        <button
                            style={plusButtonStyle}
                            key={`${name}-increment`}
                            //className="button activity-button"
                            onClick={() => {
                                onChangeCount(name, quantity+1)
                            }}
                        >
                            +
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
