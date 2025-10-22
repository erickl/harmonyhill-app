export default function ProviderIcon({size = 2}) {

    const style = {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    };

    const symbolStyle = {
        fontSize: `${size}rem`,
    };

    const overlayStyle = {
        position: "absolute",
        color : "red",
        fontWeight: "bold",
        fontSize: `${size * 0.65}rem`,
        top: "0.5rem",
    };

    return (
        <div style={style}>
            <div style={symbolStyle}>
                {"👤"}
            </div>
            <div style={overlayStyle}>{"?"}</div>
        </div>
    );
}
