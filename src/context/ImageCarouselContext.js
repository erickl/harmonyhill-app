import React, { createContext, useState, useContext, useEffect } from "react";
import "../components/ImageCarouselModal.css";
import { ArrowBigLeftIcon, ArrowBigRightIcon } from 'lucide-react';
import * as utils from "../utils.js";
import {getPhotoUrl} from "../daos/storageDao.js";

const ImageCarouselContext = createContext();

export function ImageCarouselProvider({ children }) {

    const [images, setImages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentImage, setCurrentImage] = useState(null);

    const onDisplayImages = (inputImages) => {
        setImages(inputImages ? inputImages : []);
        if(inputImages && inputImages.length > 0) {
            setCurrentImage(inputImages[0]);
        } 
    }
    
    const hidePopup = () => {
       setImages([]);
       setCurrentImage(null);
       setCurrentIndex(0);
    }

    const onShowNext = () => {
        setCurrentIndex((currentIndex + 1) % images.length);
    }

    const onShowPrevious = () => {
        setCurrentIndex((Math.abs(currentIndex - 1)) % images.length);
    }

    useEffect(() => {
        const getCurrentImage = async() => {
            if(images && images.length > currentIndex) {
                const current = images[currentIndex];
                setCurrentImage(current);
            }
        }
        getCurrentImage();
    }, [currentIndex]);
    
    return (
        <ImageCarouselContext.Provider value={{ onDisplayImages }}>
            {children}
            {images && images.length > 0 && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <h2>{"Browse Photos"}</h2>
                        {currentImage && (<>
                            <p>Uploaded by {utils.capitalizeWords(currentImage.createdBy)}, {utils.to_ddMMM_HHmm(currentImage.createdAt)}</p>
                            <div className="carousel-image-box">
                                {!utils.isEmpty(currentImage.url) ? (
                                    <img src={currentImage.url} alt="activity-image" />
                                ) : (
                                    <div className="image-placeholder" />
                                )}
                            </div>
                            <div className="img-carousel-nav-controls">
                                <ArrowBigLeftIcon onClick={(e) => {
                                    e.stopPropagation();
                                    onShowPrevious();
                                }}/>
                                <h2>{currentIndex+1}/{images.length}</h2>
                                <ArrowBigRightIcon onClick={(e) => {
                                    e.stopPropagation();
                                    onShowNext();
                                }}/>
                            </div>
                            <button onClick={() => hidePopup()}>Close</button>
                        </>)}
                    </div>
                </div>
            )}
        </ImageCarouselContext.Provider>
    );
}

export function useImageCarousel() {
    return useContext(ImageCarouselContext);
}
