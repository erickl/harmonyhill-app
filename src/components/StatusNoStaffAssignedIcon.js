import { User } from "lucide-react";
    
export default function StatusNoStaffAssignedIcon({ size = 24, color = "gray" }) {
    const style = { 
        position      : "relative", 
        width         : size, 
        height        : size, 
        margin        : "0",
        top: -14
        //display       : "flex", 
        //flexDirection : "column", 
        //alignItems    : "center" 
    };

    const symbolStyle = { 
        position: "absolute", 
        left: 7.5,
        top: 0, 
        color: "red",
    }

    const textStyle = {
        position: "absolute", 
        textAlign: "center", 
        fontSize: "0.5rem",
        margin: "0.1rem 0rem 0rem 0rem",
        top: 34
    };

    return (
        <div style={style}>
            <User size={size} color={color} margins={0} />
            <p style={symbolStyle}>{"?"}</p>
        </div>
    )
};