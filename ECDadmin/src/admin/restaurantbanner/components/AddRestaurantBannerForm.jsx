import React, { useState } from 'react';
import {
  MenuItem,
  Select,
  Button,
  Paper
} from '@mui/material';
import { PhotoSizeSelectActual } from '@mui/icons-material';

import { useRestaurantBanner } from '../../api/restaurantbanner.js'
import { useRestaurantNameList } from '../../api/restaurant.js'; // use same hook as edit form
import { useCities } from '../../api/city.js';
import { useNavigate } from 'react-router-dom';

const AddRestaurantBannerForm = () => {
  const { addBanner, loading } = useRestaurantBanner();
  const { restaurants, loading: restaurantLoading } = useRestaurantNameList();
  const { cities, loading: cityLoading } = useCities();
  const navigate=useNavigate()

  const [preview, setPreview] = useState('');

  const [formData, setFormData] = useState({
    title:"",
    restaurant: '',
    city: '',
    status: '',
    bannerImage: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData(prev => ({ ...prev, bannerImage: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.restaurant || !formData.city) {
      console.error('Restaurant and City are required');
      return;
    }

    const payload = new FormData();
    payload.append('restaurant', formData.restaurant);
    payload.append("title", formData.title);
    payload.append('city', formData.city);
    payload.append('isActive', formData.status === 'active');
    payload.append('type', 'restaurant');
    payload.append('position', 1);

    if (formData.bannerImage) {
      payload.append('image', formData.bannerImage);
    }

    try {
      await addBanner(payload);
         navigate("/restaurant-banner")

      // reset
      setFormData({ restaurant: '', city: '', status: '', bannerImage: null });
      setPreview('');
    } catch (err) {
      console.error(err);
    }
  };

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
                <MenuItem value="" disabled>Select Restaurant</MenuItem>
                {restaurants?.map(r => (
                  <MenuItem key={r._id} value={r._id}>
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
                <MenuItem value="" disabled>Select Status</MenuItem>
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
    placeholder="Banner Title"
    className="bg-white border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-[#248C70]"
  />
</div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-500 font-medium">
                City
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
                <MenuItem value="" disabled>Select City</MenuItem>
                {cities?.map(city => (
                  <MenuItem key={city._id} value={city._id}>
                    {city.name}
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

                  className="bg-[#248C70] hover:bg-[#1c6d57] capitalize w-32 shadow-none py-2"
                >
                  Choose a file
                  <input type="file" hidden onChange={handleImageChange} />
                </Button>

                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300">
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
              Save
            </Button>
          </div>

        </form>
      </Paper>
    </div>
  );
};

export default AddRestaurantBannerForm;
