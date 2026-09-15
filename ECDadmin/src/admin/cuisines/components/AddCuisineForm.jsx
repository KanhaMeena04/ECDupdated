import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import { useCuisine } from '../../api/cuisine.js';
import { useNavigate } from 'react-router-dom';

const AddCuisineForm = () => {
  const [name, setName] = useState("");
  const { addCuisine, loading } = useCuisine();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addCuisine({ name });
    navigate("/cuisines");
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off">
        <div className="mb-6">
          <label className="block text-gray-500 text-sm font-medium mb-2">
            Cuisine Name
          </label>
          <TextField
            fullWidth
            placeholder="Cuisine Name"
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          variant="contained"
          sx={{
            backgroundColor: '#248C70',
            textTransform: 'none',
            fontWeight: '600',
            '&:hover': { backgroundColor: '#1c6d57' },
          }}
        >
          Save
        </Button>
      </Box>
    </div>
  );
};

export default AddCuisineForm;
