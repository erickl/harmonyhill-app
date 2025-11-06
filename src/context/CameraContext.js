import React, { createContext, useState, useContext } from "react";
import CapturePhotoScreen from "../components/CapturePhotoScreen.js";

const CameraContext = createContext();

export function CameraProvider({ children }) {
    const [photo, setPhoto] = useState(null);
    const [useCamera, setUseCamera] = useState(false);
    const [useAlbum, setUseAlbum] = useState(false);
    const [open, setOpen] = useState(false);
    const [onConfirmPhoto, setOnConfirmPhoto] = useState(null);

    const handleChange = (photo) => {
        setPhoto(photo);
    }
    
    const hidePopup = () => {
        setOpen(false);
    }

    const onOpenCamera = (useCamera, useAlbum, onConfirmPhoto) => {
        setUseAlbum(useAlbum);
        setUseCamera(useCamera);
        setOnConfirmPhoto(onConfirmPhoto);
        setOpen(true);
    }

    return (
        <CameraContext.Provider value={{ onOpenCamera }}>
            {children}
            {open && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <CapturePhotoScreen 
                            useCamera={useCamera}
                            useAlbum={useAlbum}
                            onConfirmPhoto={onConfirmPhoto}
                            onCaptureSuccess={(photo) => handleChange(photo)}
                            onClose={hidePopup}
                        />
                    </div>
                </div>
            )}
        </CameraContext.Provider>
    );
}

export function useCameraModal() {
    return useContext(CameraContext);
}
