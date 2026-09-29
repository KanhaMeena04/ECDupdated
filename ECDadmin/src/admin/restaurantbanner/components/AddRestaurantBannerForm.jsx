import React, { useState } from 'react';
import {
  MenuItem,
  Select,
  Button,
  Paper,
  CircularProgress
} from '@mui/material';
import { PhotoSizeSelectActual } from '@mui/icons-material';

import { useRestaurantBanner } from '../../api/restaurantbanner.js'
import { useRestaurantNameList } from '../../api/restaurant.js';
import { useCities } from '../../api/city.js';
import { useNavigate } from 'react-router-dom';

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';
const IMAGEKIT_PUBLIC_KEY = 'public_bndzwvE17qu6mX6x96Ak/PhnGY0=';
const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/ECDKART';

const AddRestaurantBannerForm = () => {
  const { addBanner, loading } = useRestaurantBanner();
  const { restaurants, loading: restaurantLoading } = useRestaurantNameList();
  const { cities, loading: cityLoading } = useCities();
  const navigate=useNavigate()

  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  // Upload image directly to ImageKit from browser (bypasses server file path issues)
  const uploadToImageKitDirect = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', `banner_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
      formData.append('publicKey', IMAGEKIT_PUBLIC_KEY);
      formData.append('folder', '/ecdkart/banners');

      const res = await fetch(IMAGEKIT_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`ImageKit upload failed: ${res.status}`);
      const data = await res.json();
      if (!data.url) throw new Error('No URL in ImageKit response');

      setUploadedImageUrl(data.url);
      setPreview(data.url);
      console.log('✅ ImageKit direct upload success:', data.url);
      return data.url;
    } catch (err) {
      console.error('❌ ImageKit direct upload failed:', err);
      // Fallback: use local preview and send file to server
      return null;
    } finally {
      setUploading(false);
    }
  };

  const [formData, setFormData] = useState({
    title: "",
    restaurant: "all",
    city: "all",
    status: "active",
    bannerImage: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately
    setPreview(URL.createObjectURL(file));
    // Upload directly to ImageKit from browser
    const ikUrl = await uploadToImageKitDirect(file);
    if (ikUrl) {
      // Uploaded to ImageKit — don't need to send file to server
      setFormData(prev => ({ ...prev, bannerImage: null, imageUrl: ikUrl }));
    } else {
      // Fallback: send file to server
      setFormData(prev => ({ ...prev, bannerImage: file, imageUrl: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const imageUrl = formData.imageUrl || uploadedImageUrl;

    if (!imageUrl && !formData.bannerImage && !formData.title) {
      alert('Please upload a banner image or enter a title');
      return;
    }

    const payload = new FormData();
    if (formData.restaurant && formData.restaurant !== 'all') {
      payload.append('restaurant', formData.restaurant);
    }
    payload.append("title", formData.title || "Promo Banner");
    if (formData.city && formData.city !== 'all') {
      payload.append('city', formData.city);
    }
    payload.append('isActive', formData.status === 'active' || formData.status === 'true' || formData.status === '');
    payload.append('type', (formData.restaurant && formData.restaurant !== 'all') ? 'restaurant' : 'static');
    payload.append('position', 1);

    if (imageUrl) {
      // Direct ImageKit URL — send as text, no file upload needed
      payload.append('image', imageUrl);
    } else if (formData.bannerImage) {
      payload.append('image', formData.bannerImage);
    }

    try {
      await addBanner(payload);
      alert('✅ Banner created successfully!');
      navigate("/restaurant-banner");
    } catch (err) {
      console.error('Error saving banner:', err);
      alert('Failed to save banner: ' + (err.response?.data?.message || err.message));
    }
  };

  const dynamicCityList = React.useMemo(() => {
    const citySet = new Set();
    if (Array.isArray(cities)) {
      cities.forEach(c => {
        const name = typeof c === 'string' ? c : (c.name || c.cityName);
        if (name && name.trim()) citySet.add(name.trim());
      });
    }
    if (Array.isArray(restaurants)) {
      restaurants.forEach(r => {
        if (r.city && r.city.trim()) citySet.add(r.city.trim());
      });
    }
    return Array.from(citySet);
  }, [cities, restaurants]);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <Paper className="p-8 rounded-lg shadow-sm max-w-6xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6"
        >

          {/* Left Column */}
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-500 font-medium">
                Restaurant
              </label>
              <Select
                name="restaurant"
                value={formData.restaurant}
                onChange={handleChange}
                displayEmpty
                size="small"
                className="bg-white"
                disabled={restaurantLoading}
              >
                <MenuItem value="all">🌐 All Restaurants (General Banner)</MenuItem>
                {restaurants?.map(r => (
                  <MenuItem key={r._id || r.id} value={r._id || r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-500 font-medium">
                Status
              </label>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                displayEmpty
                size="small"
                className="bg-white"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-500 font-medium">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Banner Title (e.g. Special Discount)"
                className="bg-white border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#248C70]"
              />
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-500 font-medium">
                City / Service Area
              </label>
              <Select
                name="city"
                value={formData.city}
                onChange={handleChange}
                displayEmpty
                size="small"
                className="bg-white"
                disabled={cityLoading}
              >
                <MenuItem value="all">📍 All Cities (All Service Areas)</MenuItem>
                {dynamicCityList.map((cityName, idx) => (
                  <MenuItem key={idx} value={cityName}>
                    {cityName}
                  </MenuItem>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-500 font-medium">
                Banner Image
              </label>
              <div className="flex flex-col gap-4">
                <Button
                  variant="contained"
                  component="label"
                  sx={{backgroundColor:"#248C70"}}
                  className="bg-[#248C70] hover:bg-[#1c6d57] capitalize w-40 shadow-none py-2"
                  disabled={uploading}
                >
                  {uploading ? (
                    <><CircularProgress size={16} sx={{color:'white', mr: 1}} /> Uploading...</>
                  ) : 'Choose a file'}
                  <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                </Button>

                {uploadedImageUrl && (
                  <p className="text-xs text-green-600 font-medium">
                    ✅ Uploaded to ImageKit successfully
                  </p>
                )}

                <div className="w-48 h-32 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300 overflow-hidden">
                  {preview ? (
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <PhotoSizeSelectActual className="text-gray-400 text-5xl" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 mt-4">
            <Button
              type="submit"
              disabled={loading}
              variant="contained"
              sx={{backgroundColor:"#248C70"}}
              className="bg-[#248C70] hover:bg-[#1c6d57] px-8 py-2 capitalize shadow-none text-md"
            >
              {loading ? 'Saving...' : 'Save Banner'}
            </Button>
          </div>

        </form>
      </Paper>
    </div>
  );
};

export default AddRestaurantBannerForm;
