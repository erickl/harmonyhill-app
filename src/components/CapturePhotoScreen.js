import React, { useState, useRef, useEffect } from 'react';
import { useNotification } from "../context/NotificationContext.js";
import { XIcon } from 'lucide-react';
import { RefreshCw, Camera, FolderOpen} from 'lucide-react';
import Spinner from './Spinner.js';

export default function CapturePhotoScreen({ instructions, onCaptureSuccess, onConfirmPhoto, useCamera, useAlbum, onClose }) {
    const [previewImage, setPreviewImage] = useState(null);
    const [previewImageFullScreen, setPreviewImageFullScreen] = useState(false);
    const [videoStream, setVideoStream] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const { onError } = useNotification();

    const toggleFullScreen = () => {
        setPreviewImageFullScreen(prev => !prev);
    };

    const onSetPreviewImage = (previewImage) => {
        setPreviewImage(previewImage);
        onCaptureSuccess(previewImage);
    }

    const onConfirm = (photo) => {
        onConfirmPhoto(photo);
    }

    useEffect(() => {
        handleOpenCamera();
    }, []);

    useEffect(() => {
        if (videoStream && videoRef.current) {
            videoRef.current.srcObject = videoStream;
        }
        return () => {
            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [videoStream]);

    // Helper function to access camera
    const tryAccessCamera = async (setVideoStream) => {
        try {
            // Attempt 1: Strict 'exact' environment mode, using the back camera
            const stream = await navigator.mediaDevices.getUserMedia({ video: {facingMode: { exact: "environment" } }});
            setVideoStream(stream);
        } catch (e) {
            await tryAccessLessStrictBackCamera(setVideoStream);
        }
    };

    const tryAccessLessStrictBackCamera = async(setVideoStream) => {
        try {
            // Attempt 2: Non-exact environment mode
            let stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            setVideoStream(stream);
        } catch (e) {
            await tryAccessAnyCamera(setVideoStream);
        }
    }

    const tryAccessAnyCamera = async(setVideoStream) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setVideoStream(stream);
        } catch (e) {
            onError(`Error accessing camera: ${e.message}`);
        }
    }

    // --- Handlers for Photo Album ---
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onSetPreviewImage(reader.result);   
            };
            reader.readAsDataURL(file);
            setVideoStream(null);
        }
    };

    // --- Handlers for Camera ---
    const handleOpenCamera = async () => {
        onSetPreviewImage(null);
        await tryAccessCamera(setVideoStream);
    };

    const handleTakePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

            const imageDataURL = canvas.toDataURL('image/png');
            onSetPreviewImage(imageDataURL);

            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
                setVideoStream(null);
            }
        }
    };

    const handleCloseScreen = () => {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            setVideoStream(null);
        }
        if(onClose) onClose();
    };

    return (
        <div style={{ display:"flex", flexDirection:"column"}}>
            <div style={{ display:"flex", flexDirection:"row", justifyContent: 'space-between', width: '100%'}}>
                <XIcon 
                    size={30}
                    style={{ color:'#f44336'}}
                    onClick={handleCloseScreen}
                />
                

                { videoStream == null && useCamera && (<>
                    <RefreshCw 
                        size={30}
                        style={{ }}
                        onClick={handleOpenCamera}
                    />
                </>)}
            </div>

            {instructions && (
                <div style={{ marginTop: '0.5rem' }}>
                    <span>{instructions}</span>
                </div>
            )}

            {/* Preview and Upload Captured Photo */}
            {previewImage && !videoStream && (
                <div style={{ marginTop: '0.5rem' }}>
                    <img 
                        src={previewImage} 
                        alt="Preview" 
                        style={{ 
                            cursor: "pointer",
                            maxWidth: previewImageFullScreen ? "100vw" : "100%",
                            maxHeight: previewImageFullScreen ? "100vh" : "300px", 
                            border: '1px solid grey' 
                        }} 
                        onClick={toggleFullScreen}
                    />
                </div>
            )}

            {/* Hidden canvas for drawing the video frame */}
            <canvas ref={canvasRef} style={{  marginTop: '2rem', display: 'none' }} />
            
            {videoStream && (
                <video 
                    ref={videoRef} autoPlay playsInline 
                    style={{ marginTop: '2rem', maxWidth: '100%', maxHeight: '300px', border: '1px solid black' }} 
                />
            )}

            {!videoStream && !previewImage && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', maxWidth: '100%', height: '300px', border: '1px solid black' }} >
                    <Spinner size={40}/>
                </div>
            )}

            <div style={{
                display: "flex",
                flexDirection: "row",
                gap: "10px", // Adds space between buttons
                justifyContent: "center", 
                marginTop: "15px" 
            }}>
                {!previewImage && videoStream && (
                    <button 
                        onClick={handleTakePhoto} 
                        style={{ 
                            padding: '10px 15px', 
                            border: '1px solid #007bff', 
                            borderRadius: '5px',
                            backgroundColor: '#007bff',
                            cursor: 'pointer' 
                        }}
                    >
                        <Camera />
                    </button>
                )}

                { !previewImage && useAlbum && (
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        style={{ 
                            padding: '10px 15px', 
                            border: '1px solid #007bff', 
                            borderRadius: '5px',
                            backgroundColor: '#007bff',
                            cursor: 'pointer' 
                        }}
                    >
                        <FolderOpen />
                    </button>
                )}

                { previewImage && (
                    <button 
                        onClick={() => {
                            onConfirm(previewImage);
                            handleCloseScreen();
                        }}
                        style={{ 
                            padding: '10px 15px', 
                            border: '1px solid #007bff', 
                            borderRadius: '5px',
                            backgroundColor: '#007bff',
                            cursor: 'pointer' 
                        }}
                    >
                        Use
                    </button>
                )}
            </div>

            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
            />
        </div>
    );
}
