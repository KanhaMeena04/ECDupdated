import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload } from 'lucide-react';

export default function ImageUploadSection({
  coverImage: propCover,
  profileImage: propProfile,
  onCoverChange,
  onProfileChange,
}) {
  const coverInputRef = useRef(null);
  const profileInputRef = useRef(null);
  
  // State to hold the preview URLs
  const [coverImage, setCoverImage] = useState(propCover || null);
  const [profileImage, setProfileImage] = useState(propProfile || null);

  useEffect(() => {
    if (propCover) setCoverImage(propCover);
  }, [propCover]);

  useEffect(() => {
    if (propProfile) setProfileImage(propProfile);
  }, [propProfile]);

  const handleFileChange = (event, setter, callback) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setter(base64);
        if (callback) callback(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative mb-20"> {/* Added margin bottom for the profile pic overlap */}
      
      {/* 1. Cover Photo Section */}
      <div 
        className="relative h-64 bg-gray-300 w-full flex items-end justify-end p-6 bg-cover bg-center rounded-2xl shadow-inner border border-gray-200 overflow-hidden"
        style={{ backgroundImage: coverImage ? `url(${coverImage})` : undefined }}
      >
        <input 
          type="file" 
          ref={coverInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={(e) => handleFileChange(e, setCoverImage, onCoverChange)}
        />
        
        <button 
          type="button"
          onClick={() => coverInputRef.current.click()}
          className="bg-[#00a67e] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#008f6d] transition-colors shadow-md z-10 cursor-pointer"
        >
          <Upload size={18} /> Update Cover Photo
        </button>

        {/* 2. Profile Photo (The Camera Box) */}
        <div 
          onClick={() => profileInputRef.current.click()}
          className="absolute left-10 -bottom-12 w-32 h-32 bg-gray-200 border-4 border-white rounded-md shadow-md flex items-center justify-center cursor-pointer overflow-hidden hover:opacity-90 transition-opacity z-20"
        >
          <input 
            type="file" 
            ref={profileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => handleFileChange(e, setProfileImage, onProfileChange)}
          />
          
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <Camera size={32} className="text-gray-400" />
          )}
          
          {/* Overlay on hover for Profile */}
          <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera size={24} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}