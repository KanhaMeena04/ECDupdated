import React from 'react';
import { 
  TextField, 
  Button, 
  MenuItem, 
  Select, 
  FormControl 
} from '@mui/material';
import { useAddAddons } from '../../api/addons.js';
import { useRestaurantNameList } from '../../api/restaurant.js';

const AddonForm = () => {
  const { formData, handleChange, submitAddon, loading, error } = useAddAddons();

  // 🔥 Correct hook for this use-case
  const { restaurants = [], loading: restaurantLoading } = useRestaurantNameList();

  const handleSubmit = (e) => {
    e.preventDefault();
    submitAddon();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-sm rounded-lg mt-10">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Restaurant */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-600 text-sm font-medium">Restaurant</label>
          <FormControl fullWidth size="small">
            <Select
              name="restaurant"
              value={formData.restaurant}
              onChange={handleChange}
              displayEmpty
              disabled={restaurantLoading}
            >
              <MenuItem value="" disabled>
                {restaurantLoading ? 'Loading restaurants...' : 'Select Restaurants'}
              </MenuItem>

              {restaurants.map((res) => (
                <MenuItem key={res._id} value={res._id}>
                  {res.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-600 text-sm font-medium">Name</label>
          <TextField
            size="small"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
          />
        </div>

        {/* Price */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-600 text-sm font-medium">Price</label>
          <TextField
            size="small"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            placeholder="Price"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          className="bg-[#00a689] hover:bg-[#008d74] capitalize px-8 py-2"
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </form>
    </div>
  );
};

export default AddonForm;
