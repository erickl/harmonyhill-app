import React, { useState, useRef, useEffect } from 'react';
import { uploadPurchaseInvoice } from "../services/invoiceService";

export default function UploadReceiptScreen({ current, onUploadSuccess, resetTrigger }) {
    const [previewImage, setPreviewImage] = useState(current);
    const [previewImageFullScreen, setPreviewImageFullScreen] = useState(false);

    const [videoStream, setVideoStream] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [uploadStatus, setUploadStatus] = useState('');
    const [uploadedImageUrl, setUploadedImageUrl] = useState('');

    const fileInputRef = useRef(null);

    const toggleFullScreen = () => {
        setPreviewImageFullScreen(prev => !prev);
    };

    const onSetPreviewImage = (previewImage) => {
        setPreviewImage(previewImage);
    }

    const onSetFile = (file) => {
        onUploadSuccess(file);
    }

    const onError = (errorMessage) => {
        setUploadStatus(errorMessage);
    }

    const onSuccess = (downloadURL) => {
        setUploadStatus('Upload successful!');
        setUploadedImageUrl(downloadURL);
        console.log('File available at', downloadURL);
    }

    const onProgress = (progressMessage) => {
        setUploadStatus(progressMessage);
    }

    useEffect(() => {
        setPreviewImage(current);
    }, [current, resetTrigger]);

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
    const accessCamera = async (setVideoStream) => {
        try {
            //const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Using the back camera
            const stream = await navigator.mediaDevices.getUserMedia({ video: {facingMode: { exact: "environment" } }});
            setVideoStream(stream);
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Error accessing camera: ' + error.message);
        }
    };


    // --- Handlers for Photo Album ---
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            onSetFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                onSetPreviewImage(reader.result);   
            };
            reader.readAsDataURL(file);
            setVideoStream(null);
            setUploadStatus('');
            setUploadedImageUrl('');
        }
    };

    // --- Handlers for Camera ---
    const handleOpenCamera = async () => {
        onSetPreviewImage(null);
        setUploadStatus('');
        setUploadedImageUrl('');
        await accessCamera(setVideoStream);
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
            
            const file = dataURLtoFile(imageDataURL);
            onSetFile(file);

            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
                setVideoStream(null);
            }
            setUploadStatus('');
            setUploadedImageUrl('');
        }
    };

    function dataURLtoFile(dataURL, filename) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    const handleCloseScreen = () => {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            setVideoStream(null);
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px' }}>
            <h2>Upload Receipt</h2>

            {/* Preview and Upload Captured Photo */}
            {previewImage && !videoStream && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Preview:</h3>
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

            {videoStream && (
                <div style={{ marginTop: '10px' }}>
                    <video ref={videoRef} autoPlay playsInline style={{ maxWidth: '100%', maxHeight: '300px', border: '1px solid black' }} />
                    <button onClick={handleTakePhoto} style={{ display: 'block', marginTop: '5px' }}>Take Photo</button>
                </div>
            )}

            {/* Hidden canvas for drawing the video frame */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            { videoStream == null && (
                <button onClick={handleOpenCamera}>
                    Open Camera
                </button>
            )}
       
            <button onClick={() => fileInputRef.current.click()}>
                Select from Album
            </button>

            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
            />

            <hr style={{ margin: '20px 0' }} />

            {/* Upload Status */}
            {uploadStatus && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{uploadStatus}</p>}
            {uploadedImageUrl && (
                <p>
                    Image URL: <a href={uploadedImageUrl} target="_blank" rel="noopener noreferrer">{uploadedImageUrl}</a>
                </p>
            )}

            <button onClick={handleCloseScreen} style={{ marginTop: '20px', backgroundColor: '#f44336', color: 'white' }}>
                Close
            </button>
        </div>
    );
}
