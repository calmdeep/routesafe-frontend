// App.js - Professional Human-Designed UI
import React, { useState, useRef, useEffect } from 'react';
import { Upload, AlertTriangle, MapPin, Loader2, CheckCircle, Camera, Menu, X, User, Settings, LogOut, FileText, Bell, Shield } from 'lucide-react';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            setLocation({
              lat: latitude,
              lon: longitude,
              address: data.display_name || 'Location detected',
              city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
              state: data.address?.state || 'Unknown'
            });
          } catch (error) {
            setLocation({
              lat: latitude,
              lon: longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              city: 'Unknown',
              state: 'Unknown'
            });
          }
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Location error:', error);
          setLocation({
            lat: null,
            lon: null,
            address: 'Location access denied',
            city: 'Unknown',
            state: 'Unknown'
          });
          setLoadingLocation(false);
        }
      );
    }
  };

  const verifyImageContent = async (imageData) => {
    try {
      const response = await fetch('https://routesafe-backend.onrender.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Verification error:', error);
      return { isValid: false, reason: 'Connection error' };
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target.result;
        
        setVerifying(true);
        const verification = await verifyImageContent(imageData);
        setVerifying(false);

        if (verification.isValid) {
          setImage(imageData);
          setResult(null);
        } else {
          alert(`❌ Invalid Image!\n\n${verification.reason}\n\nPlease upload a clear image of a road or street.`);
          e.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const detectPotholes = async () => {
    if (!image) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('https://routesafe-backend.onrender.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: image,
          location: location
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        if (data.hasPotholes && data.detections.length > 0) {
          drawAnnotations(data.detections);
        }
      } else {
        alert('Error: ' + data.error);
      }

    } catch (error) {
      console.error('Detection error:', error);
      alert('Error connecting to server. Make sure Flask backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const drawAnnotations = (detections) => {
    const img = new Image();
    img.src = image;
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      const maxWidth = 900;
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      detections.forEach((det, idx) => {
        const color = det.severity === 'HIGH' ? '#dc2626' : 
                     det.severity === 'MEDIUM' ? '#ea580c' : '#16a34a';
        
        const boxHeight = 50;
        const boxWidth = 240;
        const x = 15 + (idx % 2) * 260;
        const y = 15 + Math.floor(idx / 2) * 60;
        
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, boxWidth, boxHeight);
        
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`#${det.id}: ${det.severity}`, x + 10, y + 22);
        ctx.font = '13px Arial';
        ctx.fillText(`${det.damageType} • ${(det.confidence * 100).toFixed(0)}%`, x + 10, y + 40);
      });
    };
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'HIGH': return 'bg-red-600';
      case 'MEDIUM': return 'bg-orange-600';
      case 'LOW': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getSeverityBg = (severity) => {
    switch(severity) {
      case 'HIGH': return 'bg-red-50 border-red-200';
      case 'MEDIUM': return 'bg-orange-50 border-orange-200';
      case 'LOW': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                Route<span className="text-orange-500">Safe</span>
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition">
                <Bell className="w-5 h-5" />
              </button>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition"
                >
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-900 font-medium">User</span>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <button className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-500" />
                      My Profile
                    </button>
                    <button className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-500" />
                      My Reports
                    </button>
                    <button className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition flex items-center gap-3">
                      <Settings className="w-4 h-4 text-gray-500" />
                      Settings
                    </button>
                    <div className="border-t border-gray-200"></div>
                    <button className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition flex items-center gap-3">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-600 hover:text-gray-900 p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-3 space-y-1">
              <button className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                My Profile
              </button>
              <button className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-500" />
                My Reports
              </button>
              <button className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition flex items-center gap-3">
                <Bell className="w-4 h-4 text-gray-500" />
                Notifications
              </button>
              <button className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition flex items-center gap-3">
                <Settings className="w-4 h-4 text-gray-500" />
                Settings
              </button>
              <button className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-3">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Road Damage Detection</h1>
          <p className="text-gray-600 mt-1">Upload a road image to detect potholes and damages</p>
        </div>

        {/* Location Card */}
        {location && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-semibold text-sm">Current Location</p>
                <p className="text-gray-600 text-xs truncate">{location.address}</p>
                {location.lat && location.lon && (
                  <p className="text-blue-600 text-xs mt-1">
                    {location.city}, {location.state} • {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Image</h2>
            <div
              onClick={() => !verifying && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-gray-300 rounded-lg p-8 sm:p-12 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all ${verifying ? 'opacity-50 cursor-wait' : ''}`}
            >
              {verifying ? (
                <div className="py-12">
                  <Loader2 className="w-24 h-24 text-orange-500 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-900 text-xl font-bold">Verifying Image...</p>
                  <p className="text-gray-600 text-sm mt-2">Checking if this is a road image</p>
                </div>
              ) : image ? (
                <div>
                  <img src={image} alt="Road" className="max-h-60 sm:max-h-80 mx-auto rounded-lg mb-4 shadow-md border border-gray-200" />
                  <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 font-medium text-sm">Valid road image</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">Click to change</p>
                </div>
              ) : (
                <div className="py-8 sm:py-12">
                  <Upload className="w-16 sm:w-24 h-16 sm:h-24 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-900 text-xl sm:text-2xl mb-2 font-bold">Click to Upload</p>
                  <p className="text-gray-600 text-sm sm:text-base">JPG or PNG • Max 10MB</p>
                  <p className="text-orange-600 text-xs mt-3 font-medium">⚠️ Only road/street images accepted</p>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={verifying}
            />

            <button
              onClick={detectPotholes}
              disabled={!image || loading || verifying}
              className="w-full mt-6 px-6 py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Analyzing Road...
                </>
              ) : (
                <>
                  <Camera className="w-6 h-6" />
                  Detect Damage
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Detection Results</h2>
            
            {result ? (
              <div className="space-y-4">
                {/* Status Card */}
                <div className={`${result.hasPotholes ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border-2 rounded-lg p-4`}>
                  <div className="flex items-center gap-3">
                    {result.hasPotholes ? (
                      <AlertTriangle className="w-7 h-7 text-red-600" />
                    ) : (
                      <CheckCircle className="w-7 h-7 text-green-600" />
                    )}
                    <div>
                      <p className={`${result.hasPotholes ? 'text-red-600' : 'text-green-600'} font-bold text-lg`}>
                        {result.hasPotholes ? 'Damage Detected' : 'Road Clear'}
                      </p>
                      <p className="text-gray-900 text-2xl font-bold">
                        {result.totalPotholes} Issue{result.totalPotholes !== 1 ? 's' : ''} Found
                      </p>
                    </div>
                  </div>
                </div>

                {/* Road Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-gray-600 text-xs mb-1">Road Type</p>
                    <p className="text-gray-900 font-bold text-sm">{result.roadType}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-gray-600 text-xs mb-1">Condition</p>
                    <p className={`font-bold text-sm ${
                      result.roadCondition === 'Excellent' || result.roadCondition === 'Good' ? 'text-green-600' :
                      result.roadCondition === 'Fair' ? 'text-orange-600' : 'text-red-600'
                    }`}>{result.roadCondition}</p>
                  </div>
                </div>

                {/* Detections List */}
                {result.detections && result.detections.length > 0 && (
                  <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2">Detected Issues:</h3>
                    {result.detections.map((det) => (
                      <div key={det.id} className={`${getSeverityBg(det.severity)} border rounded-lg p-3`}>
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-gray-900 font-bold text-sm">Issue #{det.id}</span>
                          <span className={`${getSeverityColor(det.severity)} px-2 py-1 rounded text-white text-xs font-bold`}>
                            {det.severity}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div>
                            <span className="text-gray-600">Type:</span>
                            <span className="text-gray-900 ml-1 font-medium">{det.damageType}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Size:</span>
                            <span className="text-gray-900 ml-1 font-medium">{det.estimatedSize}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Confidence:</span>
                            <span className="text-gray-900 ml-1 font-medium">{(det.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        <p className="text-gray-700 text-xs">{det.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-12 sm:p-20 text-center border border-gray-200">
                <Camera className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 text-sm sm:text-base">Upload an image to see results</p>
              </div>
            )}
          </div>
        </div>

        {/* Annotated Image */}
        {result && result.hasPotholes && result.detections.length > 0 && (
          <div className="mt-6 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Visual Detection Map</h2>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <canvas ref={canvasRef} className="max-w-full mx-auto rounded-lg" />
            </div>
            <p className="text-gray-600 text-sm mt-3 text-center">
              Colored boxes indicate detected issues with severity levels
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
