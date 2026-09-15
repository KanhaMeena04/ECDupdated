import React, { useState, useEffect } from 'react';
import {
  MenuItem,
  Select,
  Button,
  Paper
} from '@mui/material';
import { PhotoSizeSelectActual } from '@mui/icons-material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useRestaurantBanner } from '../../api/restaurantbanner.js';
import { useRestaurantNameList } from '../../api/restaurant.js';
import { useCities } from '../../api/city.js';

const EditRestaurantBannerForm = () => {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const { editBanner, getBannerById } = useRestaurantBanner();
  const { restaurants, loading: restaurantLoading } = useRestaurantNameList();
  const { cities, loading: cityLoading } = useCities();

  const [formData, setFormData] = useState({
    restaurant: '',
    city: '',
    status: 'inactive',
    bannerImage: null
  });

  const [preview, setPreview] = useState('');
  const [initialized, setInitialized] = useState(false);

  /* ================= PREFILL ================= */
  useEffect(() => {
    const hydrate = async () => {
      try {
        let banner = state;

        if (!banner) {
          banner = await getBannerById(id);
        }

        if (!banner) {
          navigate('/restaurant-banner', { replace: true });
          return;
        }

        setFormData({
          restaurant: banner.restaurant?._id || '',
          city: banner.city?._id || '',
          status: banner.isActive ? 'active' : 'inactive',
          bannerImage: null
        });

        setPreview(banner.image || '');
        setInitialized(true);
      } catch {
        navigate('/restaurant-banner', { replace: true });
      }
    };

    if (!initialized && id) hydrate();
  }, [id, state, getBannerById, navigate, initialized]);

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

    const payload = new FormData();
    payload.append('restaurant', formData.restaurant);
    payload.append('city', formData.city);
    payload.append('isActive', formData.status === 'active');

    if (formData.bannerImage) {
      payload.append('image', formData.bannerImage);
    }

    await editBanner(id, payload);
    navigate('/restaurant-banner');
  };

  if (!initialized) return null;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <Paper className="p-8 rounded-lg shadow-sm max-w-6xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6"
        >

          {/* LEFT */}
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-500 font-medium">Restaurant</label>
              <Select
                name="restaurant"
                value={formData.restaurant}
                onChange={handleChange}
                size="small"
                className="bg-white"
                disabled={restaurantLoading}
              >
                {restaurants.map(rest => (
                  <MenuItem key={rest._id} value={rest._id}>
                    {rest.name}
                  </MenuItem>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-500 font-medium">Status</label>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                size="small"
                className="bg-white"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-500 font-medium">City</label>
              <Select
                name="city"
                value={formData.city}
                onChange={handleChange}
                size="small"
                className="bg-white"
                disabled={cityLoading}
              >
                {cities.map(city => (
                  <MenuItem key={city._id} value={city._id}>
                    {city.name}
                  </MenuItem>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-500 font-medium">Banner Image</label>

              <div className="flex flex-col gap-4">
                <Button
                  variant="contained"
                  component="label"
                  sx={{ backgroundColor: '#248C70' }}
                  className="capitalize w-32 shadow-none py-2"
                >
                  Change Image
                  <input type="file" hidden onChange={handleImageChange} />
                </Button>

                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center border overflow-hidden">
                  {preview ? (
                    <img src={preview} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <PhotoSizeSelectActual className="text-gray-400 text-5xl" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-2 mt-4">
            <Button
              type="submit"
              variant="contained"
              sx={{ backgroundColor: '#248C70' }}
              className="px-8 py-2 capitalize shadow-none"
            >
              Update
            </Button>
          </div>

        </form>
      </Paper>
    </div>
  );
};

export default EditRestaurantBannerForm;
