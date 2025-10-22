import "./StatusCircle.css";
import { Status } from "../services/activityService.js";
import StatusNoStaffAssignedIcon from "./StatusNoStaffAssignedIcon.js";
import StatusStartedIcon from "./StatusStartedIcon.js";
import GenericStatusIcon from "./GenericStatusIcon.js";
import InvoiceIcon from "./InvoiceIcon.js";
import CommissionIcon from "./CommissionIcon.js";
import ProviderIcon from "./ProviderIcon.js";
import * as utils from "../utils.js";

export default function StatusCircle({status, message, onClick}) {
    let icon = null;
    
    switch(status) {
        case Status.PENDING_GUEST_CONFIRM : {
            icon = <GenericStatusIcon specific={{
                border : `3px solid black`,
                color : "black",
            }}/>
            break;
        }
        case Status.PLEASE_BOOK: {
            icon = <ProviderIcon />;
            break;
        }
        case Status.ASSIGN_STAFF: {
            return <StatusNoStaffAssignedIcon />;
        }
        case Status.STAFF_NOT_CONFIRM: {
            icon = <GenericStatusIcon specific={{
                border : `3px solid black`,
                color : "black",
            }} />;
            break;
        }
        case Status.DETAILS_MISSING: {
            icon = <GenericStatusIcon specific={{
                border : `3px solid black`,
                color : "black",
            }} />;
            break;
        }
        case Status.GOOD_TO_GO : {
            icon = <GenericStatusIcon 
                specific={{
                    border : `3px solid green`,
                    color : "green",
                }} 
                symbol={"✓"} 
            />;
            break;
        }
        case Status.STARTED: {
            return <StatusStartedIcon onClick={onClick}/>;
        }
        case Status.COMPLETED : {
            icon = <GenericStatusIcon 
                specific={{
                    backgroundColor : `green`,
                    color : "white",
                }} 
                symbol={"✓"} 
            />;
            break;
        }
        case Status.AWAIT_COMMISSION: {
            icon = <CommissionIcon state={"missing"}/>;
            break;
        }
        case Status.REMOVE_COMMISSION: {
            icon = <CommissionIcon state={"unwanted"}/>;
            break;
        }
        case Status.AWAIT_EXPENSE: {
            icon = <InvoiceIcon state={"missing"}/>;
            break;
        }
        case Status.REMOVE_EXPENSE: {
            icon = <InvoiceIcon state={"unwanted"}/>;
            break;
        }
        case Status.NONE: {
            break;
        }
        
        default : { break; }
    }
    
    return (
        <div onClick={onClick}>
            {icon}
            {message && (<p className="status-message">{utils.capitalizeWords(message)}</p>)}
        </div>
    );
};
