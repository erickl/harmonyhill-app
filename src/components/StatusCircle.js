import "./StatusCircle.css";
import { Status } from "../services/activityService";
import StatusNoStaffAssignedIcon from "./StatusNoStaffAssignedIcon";
import StatusStartedIcon from "./StatusStartedIcon";
import * as utils from "../utils";

export default function StatusCircle({status, message, onClick}) {
    let symbol = "!";

    const common = {
        width           : "1.5rem",
        height          : "1.5rem",
        borderRadius    : "50%",
        display         : "flex",
        alignItems      : "center",
        justifyContent  : "center",
        fontSize        : "1rem",
        fontWeight      : "bold",
    };   
    
    let specific = {};
    
    switch(status) {
        case Status.PENDING_GUEST_CONFIRM : {
            const color = "black";
            specific = {
                border : `3px solid ${color}`,
                color : color,
            };
            break;
        }
        case Status.PLEASE_BOOK: {
            const color = "black";
            specific = {
                border : `3px solid ${color}`,
                color : color,
            };
            break;
        }
        case Status.ASSIGN_STAFF: {
            return <StatusNoStaffAssignedIcon />
        }
        case Status.STAFF_NOT_CONFIRM: {
            const color = "black";
            specific = {
                border : `3px solid ${color}`,
                color : color,
            };
            break;
        }
        case Status.DETAILS_MISSING: {
            const color = "black";
            specific = {
                border : `3px solid ${color}`,
                color : color,
            };
            break;
        }
        case Status.GOOD_TO_GO : {
            symbol = "✓";
            const color = "green";
            specific = {
                border : `3px solid ${color}`,
                color : color,
            };
            break;
        }
        case Status.STARTED: {
            return <StatusStartedIcon onClick={onClick}/>
        }
        case Status.COMPLETED : {
            symbol = "✓";
            specific = {
                backgroundColor : `green`,
                color : "white",
            };
            break;
        }
        case Status.AWAIT_COMMISSION: {
            const color = "black";
            specific = {
                border : `3px solid ${color}`,
                color : color,
            };
            break;
        }
        case Status.REMOVE_COMMISSION: {
            const color = "black";
            specific = {
                border : `3px solid ${color}`,
                color : color,
            };
            break;
        }
        case Status.AWAIT_EXPENSE: {
            const color = "black";
            specific = {
                border : `3px solid ${color}`,
                color : color,
            };
            break;
        }
        case Status.REMOVE_EXPENSE: {
            const color = "black";
            specific = {
                border : `3px solid ${color}`,
                color : color,
            };
            break;
        }
        case Status.NONE: {
            symbol = "";
            break;
            // specific = {
            //     border: "none",
            // }
        }
        
        default : {}
    }

    const style = { ...common, ...specific };
    
    return (
        <div className="status-symbol" onClick={onClick}>
            <div style={style}>{symbol}</div>
            <p className="status-message">{utils.capitalizeWords(message)}</p>
        </div>
    );
};
