import React from 'react';
import { TextField, Autocomplete, Button } from '@mui/material';
import { useAddBrand } from '../../api/brands.js';

const AddBrandForm = () => {
  const {
    formData,
    loading,
    error,
    handleChange,
    submitBrand,
  } = useAddBrand();

  const statusOptions = ['active', 'inactive'];

  const handleSubmit = (e) => {
    e.preventDefault();
    submitBrand();
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* Brand Name */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-500 text-sm font-medium">
              Brand Name
            </label>
            <TextField
              fullWidth
              placeholder="Brand Name"
              size="small"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-500 text-sm font-medium">
              Status
            </label>
            <Autocomplete
              options={statusOptions}
              value={formData.status}
              onChange={(e, value) => handleChange("status", value)}
              renderInput={(params) => (
                <TextField {...params} size="small" />
              )}
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        {/* Save Button */}
        <Button
          type="submit"
          disabled={loading}
          variant="contained"
          sx={{
            backgroundColor: '#248C70',
            paddingX: '32px',
            textTransform: 'none',
            fontWeight: 'bold',
            '&:hover': { backgroundColor: '#1c6d57' },
            boxShadow: 'none',
            borderRadius: '6px',
          }}
        >
          {loading ? "Saving..." : "Save"}
        </Button>

        <hr className="mt-8 border-gray-100" />
      </form>
    </div>
  );
};

export default AddBrandForm;
