import { createContext, useState, useContext } from "react";
import { MinibarTableModal } from "../components/MinibarTableModal.js";

const MinibarTableContext = createContext();

export function MinibarTableProvider({ children }) {
    const [input, setInput] = useState(null);
    
    const onDisplayMinibarTable = async (title, activity, headers, items, onSubmit) => {
        setInput({
            title    : title,
            activity : activity,
            headers  : headers,
            items    : items,
            onSubmit : onSubmit,
            onHide   : hidePopup,
        });
    }
 
    const hidePopup = () => {
        setInput(null);
    }

    return (
        <MinibarTableContext.Provider value={{ onDisplayMinibarTable }}>
            {children}
            {input && (
                <MinibarTableModal {...input} />
            )}
        </MinibarTableContext.Provider>
    );
}

export function useMinibarTableModal() {
    return useContext(MinibarTableContext);
}
