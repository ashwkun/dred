import React, { useState, useEffect, useRef } from 'react';
import { BiCamera } from 'react-icons/bi';
import { createWorker } from 'tesseract.js';

function CardScannerComponent({ onScanComplete }) {
  const [isScanning, setIsScanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMirror, setIsMirror] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [useFrontCamera, setUseFrontCamera] = useState(false);
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
      const permission = await navigator.permissions.query({ name: 'camera' })
        .catch(() => ({ state: 'prompt' }));

      if (permission.state === 'denied') {
        alert('Camera access is blocked. Please allow camera access in your browser settings.');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: useFrontCamera ? 'user' : 'environment' }
      });
      
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
      let stream = null;
      const constraints = [
        { video: { facingMode: useFrontCamera ? 'user' : 'environment' } }
      ];

      for (const constraint of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          if (stream) break;
        } catch (err) {
          console.log('Trying next constraint:', err);
        }
      }

      if (!stream) {
        throw new Error('Could not initialize any camera');
      }

      streamRef.current = stream;
      setIsScanning(true);
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));

      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      const video = videoRef.current;
      video.srcObject = stream;

      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Video initialization timeout'));
        }, 10000);

        const handleError = (error) => {
          clearTimeout(timeoutId);
          reject(new Error('Video error: ' + (error?.message || 'Unknown error')));
        };

        const handleSuccess = () => {
          clearTimeout(timeoutId);
          resolve();
        };

        video.onloadedmetadata = () => {
          video.play().then(handleSuccess).catch(handleError);
        };

        video.onerror = handleError;
      });

    } catch (error) {
      console.error('Camera initialization error:', error);
      handleCameraError(error);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsScanning(false);
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
    let worker = null;
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      worker = await createWorker();
      
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ ',
        preserve_interword_spaces: '1',
      });

      const { data: { text } } = await worker.recognize(canvas);
      console.log('Recognized text:', text);

      const cardNumber = text.match(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/)?.[0]?.replace(/[\s-]/g, '');
      const expiry = text.match(/(0[1-9]|1[0-2])[/\s]?(2[3-9]|[3-9][0-9])/)?.[0];
      const name = text.match(/[A-Z]+ [A-Z]+/)?.[0];

      if (cardNumber) {
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
      if (worker) {
        await worker.terminate();
      }
      setIsProcessing(false);
    }
  };

  const debugCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      console.log('Available cameras:', cameras);
      
      if (videoRef.current) {
        console.log('Video element state:', {
          readyState: videoRef.current.readyState,
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
          error: videoRef.current.error
        });
      }
      
      if (streamRef.current) {
        const tracks = streamRef.current.getVideoTracks();
        console.log('Stream tracks:', tracks.map(t => ({
          label: t.label,
          enabled: t.enabled,
          state: t.readyState,
          settings: t.getSettings()
        })));
      }
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

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
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 mb-4">
        <button
          type="button"
          onClick={handleStartScanner}
          className="w-full bg-white/10 hover:bg-white/20
            rounded-xl py-4 flex items-center justify-center gap-3
            text-white font-medium transition-all duration-200"
        >
          <BiCamera className="w-5 h-5" />
          Scan Card
        </button>
        <p className="text-white/40 text-xs text-center mt-3">
          Quickly add card by scanning with your phone's camera
        </p>
      </div>

      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full rounded-xl bg-black ${isScanning ? 'block' : 'hidden'}`}
          style={{ 
            transform: isMirror ? 'scaleX(-1)' : 'none',
            maxHeight: '80vh',
            objectFit: 'cover',
            minHeight: '300px'
          }}
        />

        {isScanning && (
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <div className="flex justify-center gap-4">
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
                onClick={() => {
                  setUseFrontCamera(!useFrontCamera);
                  stopScanner();
                  handleStartScanner();
                }}
                className="p-3 rounded-full bg-white/10 backdrop-blur-sm
                  text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 10l4.553-4.553a1 1 0 00-1.414-1.414L15 8.586V3a1 1 0 00-2 0v6a1 1 0 001 1h6a1 1 0 000-2h-4.586zM9 14l-4.553 4.553a1 1 0 001.414 1.414L9 15.414V21a1 1 0 002 0v-6a1 1 0 00-1-1H3a1 1 0 000 2h4.586z" />
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
            <div className="text-center">
              <p className="text-white/60 text-sm">
                {isInitializing ? 'Initializing camera...' : 
                 isProcessing ? 'Processing card...' : 
                 'Position your card within the frame'}
              </p>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={debugCamera}
          className="absolute top-4 left-4 p-2 bg-white/10 rounded-lg text-white/60
            hover:text-white text-xs"
        >
          Debug Camera
        </button>
      )}
    </div>
  );
}

export default CardScannerComponent; 