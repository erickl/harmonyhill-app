export default function GenericStatusIcon({specific, symbol = "!" }) {
    const symbolStyle = { 
        display: "flex",
        flexDirection: "column",
        alignItems: "center", 
    };

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

    const style = { ...common, ...specific };

    return (
        <div style={symbolStyle}>
            <div style={style}>{symbol}</div>
        </div>
    );
};
