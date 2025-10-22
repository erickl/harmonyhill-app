/*
 * state = missing|unwanted
 */
export default function CommissionIcon({size = 2, state}) {
    let overlaySymbol = "";
    if(state === "missing") overlaySymbol = "?";
    else if(state === "unwanted") overlaySymbol = "❌";

    const style = {
        position: "relative",
        //display: "flex",
        display: "inline-block",
        flexDirection: "column",
        alignItems: "center",
        fontSize: `${size}rem`,
    };

    const symbolStyle = {
        fontSize: `${size/2}rem`,
    };

    const overlayStyle = {
        position: "absolute",
        color : "red",
        fontWeight: "bold",
        fontSize: `${size * 0.65}rem`,
        top: "1.1rem",
        left: "-0.2rem",
    };

   return (
        <div style={style}>
            <span role="img" aria-label="money bag">💰</span>
                <span
                    style={{
                        position: "absolute",
                        top: 9,
                        left: -5,
                        background: "gold",
                        color: "black",
                        borderRadius: "50%",
                        padding: "2px 5px",
                        fontSize: "0.6rem",
                        fontWeight: "bold",
                    }}
                >
                    %
            </span>
            <div style={overlayStyle}>
                {overlaySymbol}
            </div>
        </div>
    );
};
