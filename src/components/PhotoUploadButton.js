import React, { useState, useEffect } from 'react';
import { useCameraModal } from '../context/CameraContext.js';
import { useSuccessNotification } from "../context/SuccessContext.js";
import { useImageCarousel } from '../context/ImageCarouselContext.js';
import { useNotification } from "../context/NotificationContext.js";
import Spinner from './Spinner.js';
import { motion } from "framer-motion";
import * as storageDao from "../daos/storageDao.js";
import { Camera, Image } from 'lucide-react';
import "./PhotoUploadButton.css";

export default function PhotoUploadButton({path, photos, instructions, onUpload, enableUpload, isRequired}) {
    const [photos_, setPhotos] = useState(photos);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [animateButton, setAnimateButton] = useState(isRequired);

    const { onOpenCamera } = useCameraModal();
    const { onSuccess } = useSuccessNotification();
    const { onDisplayImages } = useImageCarousel();
    const { onError } = useNotification();

    useEffect(() => {
        // If photos are still required, animate the button to lead the user to use it
        const photosDone = !isRequired || photos_.length > 0;
        setAnimateButton(!photosDone);
    }, [photos_]);

    const uploadPhoto = async(photo) => {
        const filename = `${path}/${Date.now()}`;
        const options = {maxSize : 0.15};
        const url = await storageDao.upload(filename, photo, options, onError);
        return {filename: filename, url: url};
    }

    const onConfirmPhoto = async (photo) => {
        try {
            setPhotoUploading(true);

            const fileData = await uploadPhoto(photo);
            const result = await onUpload(fileData);
            
            if (result !== false) {
                let newPhotos = [...photos_, result];
                setPhotos(newPhotos);
                onSuccess();
            }
            
        } finally {
            setPhotoUploading(false);
        }
    }

    const animation = animateButton ? { scale: [1, 1.1, 1], opacity: [1, 0.5, 1] } : {};
    const transition = animateButton ? { duration: 1.5, ease: "easeInOut", repeat: Infinity } : {};

    return (
        <div className="main-style">
            {!photoUploading && enableUpload && (
                <div className="footer-icon">
                    <motion.div
                        animate={animation}
                        transition={transition}
                    >
                        <Camera
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenCamera(instructions, true, false, () => onConfirmPhoto);
                            }}
                        />
                    </motion.div>
                    <p>Take photo</p>
                </div>
            )}

            {!photoUploading && photos_.length > 0 && (
                <div className="footer-icon">
                    <Image
                        onClick={async (e) => {
                            e.stopPropagation();
                            onDisplayImages(photos_);
                        }}
                    />
                    <p>See photos</p>
                </div>
            )}

            {photoUploading && (
                <div className="footer-icon">
                    <Spinner size={15} />
                    <p>Uploading...</p>
                </div>
            )}
        </div>
    );
}