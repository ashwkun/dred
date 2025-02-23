import React, { useState, useEffect, useRef } from 'react';
import { BiCamera } from 'react-icons/bi';
import { createWorker } from 'tesseract.js';

function CardScannerComponent({ onScanComplete }) {
  const [isScanning, setIsScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMirror, setIsMirror] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const checkCameraPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera API is not supported in your browser');
      return false;
    }

    try {
      // First check if we have permission
      const permission = await navigator.permissions.query({ name: 'camera' })
        .catch(() => ({ state: 'prompt' })); // Fallback if permissions API not supported

      if (permission.state === 'denied') {
        alert('Camera access is blocked. Please allow camera access in your browser settings.');
        return false;
      }

      // Try to get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
        }
      });
      
      // If successful, stop the test stream
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission check error:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert(`Camera access was denied. Please follow these steps:
1. Click the camera icon in your browser's address bar
2. Select "Allow" for camera access
3. Refresh the page and try again`);
      } else {
        alert('Error accessing camera: ' + error.message);
      }
      return false;
    }
  };

  const handleStartScanner = async () => {
    const hasPermission = await checkCameraPermission();
    if (hasPermission) {
      startScanner();
    }
  };

  const startScanner = async () => {
    setIsInitializing(true);
    try {
      // Try with simpler constraints first
      const constraints = {
        video: {
          facingMode: 'environment', // Try environment first
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          aspectRatio: { ideal: 16/9 }
        }
      };

      let stream;
      try {
        // Try environment camera first
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.log('Falling back to basic video constraints:', err);
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      if (!stream || !stream.getVideoTracks().length) {
        throw new Error('Failed to get video stream');
      }

      // Get video track for debugging
      const videoTrack = stream.getVideoTracks()[0];
      console.log('Using camera:', videoTrack.label);
      console.log('Camera settings:', videoTrack.getSettings());

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play()
              .then(resolve)
              .catch(e => {
                console.error('Video play error:', e);
                resolve();
              });
          };
        });
      }
      setIsScanning(true);
    } catch (error) {
      handleCameraError(error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCameraError = (error) => {
    console.error('Camera error:', error);
    let message = 'Failed to access camera. ';
    
    switch (error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        message = 'Camera permission denied. Please enable camera access and refresh the page.';
        break;
      case 'NotFoundError':
        message = 'No camera found on your device.';
        break;
      case 'NotReadableError':
        message = 'Camera is in use by another application.';
        break;
      default:
        message += error.message;
    }
    
    alert(message);
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsProcessing(true);
    try {
      // Capture frame from video
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      // Process with Tesseract
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      const { data: { text } } = await worker.recognize(canvas);
      await worker.terminate();

      // Process the text to extract card details
      const cardNumber = text.match(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/)?.[0]?.replace(/[\s-]/g, '');
      const expiry = text.match(/(0[1-9]|1[0-2])[/\s]?(2[3-9]|[3-9][0-9])/)?.[0];
      const name = text.match(/[A-Z]+ [A-Z]+/)?.[0];

      if (cardNumber) {
        // Detect card type based on first digit
        const firstDigit = cardNumber[0];
        let detectedCardType = '';
        if (firstDigit === '4') detectedCardType = 'Visa';
        else if (firstDigit === '5') detectedCardType = 'Mastercard';
        else if (firstDigit === '3') detectedCardType = 'American Express';
        
        onScanComplete({
          number: cardNumber,
          expiry: expiry || '',
          name: name || '',
          type: detectedCardType
        });
        stopScanner();
      } else {
        alert('Could not detect card details clearly. Please try again.');
      }
    } catch (error) {
      console.error('Error processing card:', error);
      alert('Error processing card. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (!isMobile) return null;

  return (
    <div className="mb-6">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <button
          onClick={handleStartScanner}
          className="w-full bg-white/10 hover:bg-white/20
            rounded-xl py-4 flex items-center justify-center gap-3
            text-white font-medium transition-all duration-200"
        >
          <BiCamera className="w-5 h-5" />
          Scan Card with Camera
        </button>
        <p className="text-white/40 text-xs text-center mt-3">
          Quickly add card by scanning with your phone's camera
        </p>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 bg-black/90 z-50
          flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            {isInitializing ? (
              <div className="w-full aspect-video rounded-xl bg-black/50 
                flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white 
                  rounded-full animate-spin" />
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full rounded-xl bg-black"
                style={{ 
                  transform: isMirror ? 'scaleX(-1)' : 'none',
                  maxHeight: '80vh',
                  objectFit: 'cover'
                }}
                onError={(e) => console.error('Video error:', e)}
              />
            )}
            <div className="absolute inset-0 border-2 border-white/20 rounded-xl">
              <div className="absolute inset-x-8 top-1/4 bottom-1/4 border-2 border-white/40 rounded-lg" />
            </div>
            
            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
              <button
                onClick={() => setIsMirror(!isMirror)}
                className="p-3 rounded-full bg-white/10 backdrop-blur-sm
                  text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
              <button
                onClick={stopScanner}
                className="p-3 rounded-full bg-white/10 backdrop-blur-sm
                  text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <button
                onClick={captureImage}
                disabled={isProcessing}
                className="p-3 rounded-full bg-white/10 backdrop-blur-sm
                  text-white/60 hover:text-white transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-white/60 text-sm">
              {isInitializing ? 'Initializing camera...' : 
               isProcessing ? 'Processing card...' : 
               'Position your card within the frame'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardScannerComponent; 