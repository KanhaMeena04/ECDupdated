import React, { useState } from 'react';
import { TextField, Button, InputAdornment, IconButton } from '@mui/material';
import { Save, Edit2, X, Utensils } from 'lucide-react';

const EditFoodQuantity = ({ initialQuantity = 10, unit = "kg", onSave }) => {
  // Hooks for state management
  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [tempValue, setTempValue] = useState(initialQuantity);

  const handleSave = () => {
    setQuantity(tempValue);
    setIsEditing(false);
    if (onSave) onSave(tempValue);
  };

  const handleCancel = () => {
    setTempValue(quantity);
    setIsEditing(false);
  };

  return (
    <div className="p-6 max-w-sm bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Utensils size={18} className="text-emerald-500" />
          <span className="text-sm font-semibold text-gray-700">Food Quantity</span>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-emerald-600 hover:text-emerald-700 p-1 rounded-full hover:bg-emerald-50"
          >
            <Edit2 size={16} />
          </button>
        )}
      </div>

      {!isEditing ? (
        /* Display Mode */
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-800">{quantity}</span>
          <span className="text-gray-500 font-medium">{unit}</span>
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-4">
          <TextField
            fullWidth
            type="number"
            size="small"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            autoFocus
            InputProps={{
              endAdornment: <InputAdornment position="end">{unit}</InputAdornment>,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#e5e7eb' },
                '&:hover fieldset': { borderColor: '#10b981' },
                '&.Mui-focused fieldset': { borderColor: '#10b981' },
              }
            }}
          />
          
          <div className="flex gap-2">
            <Button
              variant="contained"
              fullWidth
              startIcon={<Save size={16} />}
              onClick={handleSave}
              sx={{ 
                backgroundColor: '#10b981', 
                textTransform: 'none',
                '&:hover': { backgroundColor: '#059669' } 
              }}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancel}
              sx={{ textTransform: 'none', minWidth: 'fit-content' }}
            >
              <X size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditFoodQuantity;