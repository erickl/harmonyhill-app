import "./StatusCircle.css";
import * as ActivityStatus from "../models/ActivityStatus.js";
import StatusNoStaffAssignedIcon from "./StatusNoStaffAssignedIcon.js";
import StatusStartedIcon from "./StatusStartedIcon.js";
import GenericStatusIcon from "./GenericStatusIcon.js";
import InvoiceIcon from "./InvoiceIcon.js";
import CommissionIcon from "./CommissionIcon.js";
import ProviderIcon from "./ProviderIcon.js";
import StartingTimeMissingIcon from "./StartingTimeMissingIcon.js";
import AwaitGuestConfirmIcon from "./AwaitGuestConfirmIcon.js";
import * as utils from "../utils.js";

export default function StatusCircle({status, message, onClick}) {
    let icon = null;

    if(ActivityStatus.PendingGuestConfirmation.equals(status)) {
        icon = <AwaitGuestConfirmIcon />;
    } else if(ActivityStatus.BookProvider.equals(status)) {
        // todo: maybe we need a different symbol for this. Used to be <ProviderIcon />, but it's not really clear
        icon = <StatusNoStaffAssignedIcon />; 
    } else if(ActivityStatus.AssignStaff.equals(status)) {
        icon = <StatusNoStaffAssignedIcon />; 
    } else if(ActivityStatus.StaffNotConfirmed.equals(status)) {
        // todo: maybe we need a different symbol for this
        icon = <StatusNoStaffAssignedIcon />; 
    } else if(ActivityStatus.DetailsMissing.equals(status)) {
        icon = null;  //<GenericStatusIcon specific={{border : `3px solid black`,color : "black",}} />;   
    } else if(ActivityStatus.GoodToGo.equals(status)) {
        icon = <GenericStatusIcon 
            specific={{
                border : `3px solid green`,
                color : "green",
            }} 
            symbol={"✓"} 
        />;
    } else if(ActivityStatus.Started.equals(status)) {
        return <StatusStartedIcon onClick={onClick}/>;
    } else if(ActivityStatus.Completed.equals(status)) {
        icon = <GenericStatusIcon 
            specific={{
                backgroundColor : `green`,
                color : "white",
            }} 
            symbol={"✓"} 
        />;
    } else if(ActivityStatus.AwaitingCommission.equals(status)) {
        icon = <CommissionIcon state={"missing"}/>;
    } else if(ActivityStatus.RemoveCommission.equals(status)) {
        icon = <CommissionIcon state={"unwanted"}/>;
    } else if(ActivityStatus.AwaitingExpense.equals(status)) {
        icon = <InvoiceIcon state={"missing"}/>;
    } else if(ActivityStatus.RemoveExpense.equals(status)) {
        icon = <InvoiceIcon state={"unwanted"}/>;
    }
    
    return (
        <div onClick={onClick}>
            {icon}
            {message && (<p className="status-message">{utils.capitalizeWords(message)}</p>)}
        </div>
    );
};
