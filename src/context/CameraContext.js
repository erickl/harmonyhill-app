import React, { createContext, useState, useContext } from "react";
import UploadPhotoScreen from "../components/UploadPhotoScreen.js";

const CameraContext = createContext();

export function CameraProvider({ children }) {
    const [photo, setPhoto] = useState(null);
    const [open, setOpen] = useState(false);
    const [onConfirmPhoto, setOnConfirmPhoto] = useState(null);

    const handleChange = (photo) => {
        setPhoto(photo);
    }
    
    const hidePopup = () => {
        setOpen(false);
    }

    const onOpenCamera = (onConfirmPhoto) => {
        setOnConfirmPhoto(onConfirmPhoto);
        setOpen(true);
    }

    return (
        <CameraContext.Provider value={{ onOpenCamera }}>
            {children}
            {open && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <UploadPhotoScreen 
                            current={photo} 
                            onUploadSuccess={(photo) => handleChange(photo)}
                            resetTrigger={null}
                            onClose={hidePopup}
                        />

                        <button onClick={() => {
                            if(onConfirmPhoto) onConfirmPhoto(photo);
                            hidePopup();
                        }}>
                            Use Photo
                        </button>
                    </div>
                </div>
            )}
        </CameraContext.Provider>
    );
}

export function useCameraModal() {
    return useContext(CameraContext);
}
