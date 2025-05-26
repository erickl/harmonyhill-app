import React, { useState, useRef, useEffect } from 'react';
import { storage } from '../firebase'; // Adjust path if your firebase.js is elsewhere
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { uploadPurchaseInvoice } from "../services/invoiceService";

// Helper function to access camera
const accessCamera = async (setVideoStream) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    setVideoStream(stream);
  } catch (error) {
    console.error('Error accessing camera:', error);
    alert('Error accessing camera: ' + error.message);
  }
};

// Function to upload image to Firebase Storage
const uploadImageToFirebase = async (imageDataURL, onProgress, onSuccess, onError) => {
  if (!imageDataURL) {
    onError('No image data to upload.');
    return;
  }

  const fileName = `receipts/test1.png`; // Create a unique filename
  
  try {
    onProgress('Uploading...');

    const downloadURL = await uploadPurchaseInvoice(fileName, imageDataURL);

    // const storageRef = ref(storage, fileName);
    // const snapshot = await uploadString(storageRef, imageDataURL, 'data_url');
    // onProgress('Processing...');

    // const downloadURL = await getDownloadURL(snapshot.ref);
    // onSuccess(downloadURL);

  } catch (error) {
    console.error("Error uploading image: ", error);
    onError(`Upload failed: ${error.message}`);
  }
};


function UploadReceiptScreen({ onClose }) {
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [videoStream, setVideoStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  const fileInputRef = useRef(null);


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

  // --- Handlers for Photo Album ---
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      setVideoStream(null);
      setUploadStatus('');
      setUploadedImageUrl('');
    }
  };

  const handleUploadFromFile = async () => {
    if (!previewImage || !selectedImageFile) {
        alert('Please select an image first.');
        return;
    }
    setUploadedImageUrl('');

    await uploadImageToFirebase(
      previewImage,
      (progressMessage) => setUploadStatus(progressMessage),
      (downloadURL) => {
        setUploadStatus('Upload successful!');
        setUploadedImageUrl(downloadURL);
        console.log('File available at', downloadURL);
      },
      (errorMessage) => setUploadStatus(errorMessage)
    );
  };


  // --- Handlers for Camera ---
  const handleOpenCamera = async () => {
    setPreviewImage(null);
    setSelectedImageFile(null);
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
      setPreviewImage(imageDataURL);
      setSelectedImageFile(null);

      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
      setUploadStatus('');
      setUploadedImageUrl('');
    }
  };

  const handleUploadCapturedPhoto = async () => {
    if (!previewImage) {
      alert('Please take a photo first.');
      return;
    }
    setUploadedImageUrl('');

    await uploadImageToFirebase(
      previewImage,
      (progressMessage) => setUploadStatus(progressMessage),
      (downloadURL) => {
        setUploadStatus('Upload successful!');
        setUploadedImageUrl(downloadURL);
        console.log('Captured image available at', downloadURL);
      },
      (errorMessage) => setUploadStatus(errorMessage)
    );
  };

  const handleCloseScreen = () => {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
    }
    if (onClose) {
        onClose();
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px' }}>
      <h2>Upload Receipt</h2>

      {/* Album Section */}
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
      {selectedImageFile && previewImage && (
        <button onClick={handleUploadFromFile} style={{ marginLeft: '10px' }}>
          Upload from Album
        </button>
      )}

      <hr style={{ margin: '20px 0' }}/>

      {/* Camera Section */}
      <button onClick={handleOpenCamera}>Open Camera</button>
      {videoStream && (
        <div style={{ marginTop: '10px' }}>
          <video ref={videoRef} autoPlay playsInline style={{ maxWidth: '100%', maxHeight: '300px', border: '1px solid black' }} />
          <button onClick={handleTakePhoto} style={{ display: 'block', marginTop: '5px' }}>Take Photo</button>
        </div>
      )}

      {/* Preview and Upload Captured Photo */}
      {previewImage && !videoStream && (
        <div style={{ marginTop: '20px' }}>
          <h3>Preview:</h3>
          <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', border: '1px solid grey' }} />
          {!selectedImageFile && (
            <button onClick={handleUploadCapturedPhoto} style={{ display: 'block', marginTop: '10px' }}>
              Upload Captured Photo
            </button>
          )}
        </div>
      )}

      {/* Hidden canvas for drawing the video frame */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

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

export default UploadReceiptScreen;