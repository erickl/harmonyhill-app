import "./AlertCircle.css";
import { Alert } from "../services/activityService.js";
import * as utils from "../utils.js";

export default function AlertCircle({status, message, onClick}) {

    let symbol = "!";

    const size = 2;

    const common = {
        width           : `${size}rem`,
        height          : `${size}rem`,
        borderRadius    : "50%",
        display         : "flex",
        alignItems      : "center",
        justifyContent  : "center",
        fontSize        : "1rem",
        fontWeight      : "bold",
    };

    let specific = {};
    
    switch(status) {
        case Alert.ATTENTION : {
            const color = "black";
            specific = {
                border : `3px solid ${color}`,
                color : color,
            };
            break;
        }
        case Alert.URGENT : {
            const color = "#FF7A00";
            specific = {
                border : `3px solid ${color}`,
                color : color,
            };
            break;
        }
        case Alert.EMERGENCY: {
            specific = {
                backgroundColor : "red",
                color : "white",
            };
            break;
        }
        case Alert.NONE: {
            symbol = "";
            break;
        }
        
        default : { break; }
    }

    const style = { ...common, ...specific };
    
    return (
        <div className="alert-symbol" onClick={onClick}>
            <div style={style}>{symbol}</div>
            {message && (<p className="alert-message">{utils.capitalizeWords(message)}</p>)}
        </div>
    );
};
