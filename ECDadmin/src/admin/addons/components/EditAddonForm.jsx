import React, { useEffect, useState } from 'react';
import { 
  TextField, 
  Button 
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

import { useAddonById, useEditAddon } from '../../api/addons.js';

const EditAddonForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { addon, loading: fetching, error: fetchError } = useAddonById(id);
  const { editAddon, loading, error } = useEditAddon();

  const [formData, setFormData] = useState({
    restaurantName: '',
    name: '',
    price: '',
  });

  /** ✅ Prefill once addon loads */
  useEffect(() => {
    if (!addon) return;

    setFormData({
      restaurantName:
        typeof addon.restaurant === 'object'
          ? addon.restaurant?.name?.en || addon.restaurant?.name
          : '—',
      name: addon.name ?? '',
      price: addon.price ?? '',
    });
  }, [addon]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await editAddon(id, {
      name: formData.name.trim(),
      price: Number(formData.price),
    });

    navigate('/addons');
  };

  if (fetching) {
    return <p className="text-center mt-10">Loading addon...</p>;
  }

  if (fetchError) {
    return <p className="text-center mt-10 text-red-500">{fetchError}</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-sm rounded-lg mt-10">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* ✅ Restaurant (READ ONLY) */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-600 text-sm font-medium">Restaurant</label>
          <TextField
            size="small"
            value={formData.restaurantName}
            disabled
          />
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
          {loading ? 'Updating...' : 'Update'}
        </Button>
      </form>
    </div>
  );
};

export default EditAddonForm;
