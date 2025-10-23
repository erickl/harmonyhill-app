export default function AwaitGuestConfirmIcon({}) {
    const size = 1.5;

    const circleStyle = {
        position : "relative", 
        width: `${size}rem`,
        height: `${size}rem`,
        border: "0.22rem dashed orange",
        borderRadius: "50%",
        display: "inline-block",
        verticalAlign: "middle",
    };

    const checkMarkStyle = {
        position: "absolute",
        top: -25,
        right: -12,
        color: "#FFA500",
        fontSize: "3rem",
        opacity: "0.4",
        filter: "blur(0.9px)",   
    };

    return (
        <div style={circleStyle}>
            <div style={checkMarkStyle}>✓</div>
        </div>
    );
}
