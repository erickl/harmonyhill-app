import "./TextInput.css";

export default function TextInput({type, name, label, value, onChange}) {
    return (
        <div className="floating-label-input">
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder=" " 
            />
            <label htmlFor="name">{label}</label>
        </div>
    );
}
