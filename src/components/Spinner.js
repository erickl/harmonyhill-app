import "./Spinner.css";

export default function Spinner({size}) {
    size = size ? size : 32;
    const style = {
        "border": "4px solid rgba(0, 0, 0, 0.1)",
        "borderLeftColor": "#09f",
        "borderRadius": "50%",
        "width": `${size}px`,
        "height": `${size}px`,
        "animation": "spin 1s linear infinite",
        "margin": "auto",
    }

    return <div style={style}/>;
}
