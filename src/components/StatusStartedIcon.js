export default function StatusStartedIcon({ size = 30, color = "green", onClick }) {
    const style = { 
        position      : "relative", 
        width         : size, 
        height        : size, 
        margin        : "0",
        top: -2
        //display       : "flex", 
        //flexDirection : "column", 
        //alignItems    : "center" 
    };

    const textStyle = {
        position: "absolute", 
        textAlign: "center", 
        fontSize: "0.5rem",
        margin: "0.1rem 0rem 0rem 0rem",
        top: 34
    };

    return (
        <div style={style} onClick={onClick}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {/* Circle outline */}
                <circle cx="12" cy="12" r="10" />

                {/* Half-filled part */}
                <path d="M12 2 A10 10 0 0 1 22 12 H12 Z" fill={color} />

                {/* Check mark */}
                <polyline points="9 12 11 14 15 10" stroke="black" strokeWidth="3" />
            </svg>
            {/* <p style={textStyle}></p> */}
        </div>
    );
};
