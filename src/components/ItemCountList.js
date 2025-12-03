import TextInput from "./TextInput.js";
import * as utils from "../utils.js";

/**
 * quantities is a map with item names as keys and their quantities as values, 
 * i.e {"Item Name 1" : 0, "Item Name 2 : 1", ...}
 * 
 * onChangeCount a callback which takes 2 parameters: item name and new quantity 
 */
export default function ItemsCountList({quantities, onChangeCount}) {
    if(utils.isEmpty(quantities)) {
        return <div></div>;
    }

    return (
        <div className="card-content space-y-6">
            {Object.entries(quantities).map(([name, quantity]) => {
                return (
                    <div>
                        <TextInput 
                            type={"amount"}
                            name={name}
                            label={name}
                            value={quantity}
                            onChange={(e) => onChangeCount(e.target.name, e.target.value)}
                        />
                    </div>
                );
            })}
        </div>
    );
}
