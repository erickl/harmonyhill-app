export default function StatusCircle({status}) {

    let symbol = "!";

    const common = {
        width           : "40px",
        height          : "40px",
        borderRadius    : "50%",
        display         : "flex",
        alignItems      : "center",
        justifyContent  : "center",
        fontSize        : "22px",
        fontWeight      : "bold",
    };

    let specific = {};
    
    switch(status) {
        case Status.GOOD_TO_GO : {
            symbol = "✓";
            const color = "green";
            specific = {
                border : `3px solid ${color}`,
                color : color,
            };
            break;
        }
        case Status.COMPLETED : {
            symbol = "✓";
            specific = {
                backgroundColor : `green`,
                color : "white",
            };
            break;
        }
        case Status.ATTENTION : {
            const color = "black";
            specific = {
                border : `3px solid ${color}`,
                color : color,
            };
            break;
        }
        case Status.URGENT : {
            const color = "#FF7A00";
            specific = {
                border : `3px solid ${color}`,
                color : color,
            };
            break;
        }
        case Status.EMERGENCY: {
            specific = {
                backgroundColor : "red",
                color : "white",
            };
            break;
        }
        
        default : {}
    }

    const style = { ...common, ...specific };
    
    return (
        <div style={style}>{symbol}</div>
    );
};

export const Status = Object.freeze({
    GOOD_TO_GO : "Good To Go",
    COMPLETED  : "Completed",
    ATTENTION  : "Attention",
    URGENT     : "Urgent",
    EMERGENCY  : "Emergency",
});
