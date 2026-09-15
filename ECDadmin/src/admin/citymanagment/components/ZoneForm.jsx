// import React, { useState, useEffect } from 'react';
// import { 
//   TextField, 
//   Switch, 
//   FormControlLabel, 
//   Button, 
//   Paper, 
//   Typography,
//   Divider,
//   Grid
// } from '@mui/material';
// import { MapPin, Save, Trash2 } from 'lucide-react';

// const ZoneForm = ({ existingZone, onSave }) => {
//   // ✅ Correct initial state
//   const [formData, setFormData] = useState({
//     name: '',
//     country: '',
//     isActive: true,
//     isDefault: false,
//     meta: ''
//   });

//   // ✅ FIX: use existingZone (NOT existingCity)
//   useEffect(() => {
//     if (existingZone) {
//       setFormData({
//         name: existingZone.name || '',
//         country: existingZone.country || '',
//         isActive: existingZone.isActive ?? true,
//         isDefault: existingZone.isDefault ?? false,
//         meta: existingZone.meta || ''
//       });
//     }
//   }, [existingZone]);

//   const handleChange = (e) => {
//     const { name, value, checked, type } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSave(formData);
//   };

//   return (
//     <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
//       <Paper elevation={2} className="max-w-4xl mx-auto overflow-hidden rounded-lg">

//         {/* Header */}
//         <div className="bg-[#991b1b] p-4 text-white flex justify-between items-center">
//           <Typography variant="h6" className="font-semibold flex items-center gap-2">
//             <MapPin size={20} /> Edit City Details
//           </Typography>
//           <Button 
//             variant="outlined" 
//             color="inherit" 
//             size="small"
//             className="border-white/50 hover:bg-white/10"
//           >
//             Video Tutorial
//           </Button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6 space-y-6">
//           <Grid container spacing={3}>

//             {/* City Name */}
//             <Grid item xs={12} md={6}>
//               <Typography className="text-sm font-medium text-gray-600 mb-1">
//                 City Name
//               </Typography>
//               <TextField
//                 fullWidth
//                 name="name"
//                 size="small"
//                 value={formData.name}
//                 onChange={handleChange}
//                 placeholder="e.g. Velachery, Chennai"
//               />
//             </Grid>

//             {/* Country */}
//             <Grid item xs={12} md={6}>
//               <Typography className="text-sm font-medium text-gray-600 mb-1">
//                 Country
//               </Typography>
//               <TextField
//                 fullWidth
//                 name="country"
//                 size="small"
//                 value={formData.country}
//                 onChange={handleChange}
//                 placeholder="e.g. India"
//               />
//             </Grid>

//             {/* Toggles */}
//             <Grid item xs={12}>
//               <Divider className="my-2" />
//               <div className="flex flex-col sm:flex-row gap-6 mt-4">

//                 <FormControlLabel
//                   control={
//                     <Switch
//                       name="isActive"
//                       checked={formData.isActive}
//                       onChange={handleChange}
//                       sx={{
//                         '& .Mui-checked': { color: '#991b1b' },
//                         '& .Mui-checked + .MuiSwitch-track': {
//                           backgroundColor: '#991b1b'
//                         }
//                       }}
//                     />
//                   }
//                   label="Active Status"
//                 />

//                 <FormControlLabel
//                   control={
//                     <Switch
//                       name="isDefault"
//                       checked={formData.isDefault}
//                       onChange={handleChange}
//                       sx={{
//                         '& .Mui-checked': { color: '#991b1b' },
//                         '& .Mui-checked + .MuiSwitch-track': {
//                           backgroundColor: '#991b1b'
//                         }
//                       }}
//                     />
//                   }
//                   label="Set as Default City for Country"
//                 />

//               </div>
//             </Grid>

//             {/* Map Placeholder */}
//             <Grid item xs={12}>
//               <Typography className="text-sm font-medium text-gray-600 mb-2">
//                 Search In Map
//               </Typography>
//               <div className="h-48 bg-gray-200 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center">
//                 <span className="text-gray-400 font-medium">
//                   Map Interface Integration
//                 </span>
//               </div>
//             </Grid>
//           </Grid>

//           {/* Footer */}
//           <div className="flex justify-between items-center pt-6 border-t">
//             <Button
//               variant="text"
//               color="error"
//               startIcon={<Trash2 size={18} />}
//             >
//               Delete City
//             </Button>

//             <div className="flex gap-3">
//               <Button variant="outlined">Cancel</Button>
//               <Button
//                 type="submit"
//                 variant="contained"
//                 startIcon={<Save size={18} />}
//                 style={{ backgroundColor: '#991b1b' }}
//               >
//                 Save Changes
//               </Button>
//             </div>
//           </div>

//         </form>
//       </Paper>
//     </div>
//   );
// };

// export default ZoneForm;


import React, { useState } from 'react';
import { 
  TextField, MenuItem, Select,
  Button, Paper, Typography, Grid
} from '@mui/material';
import { Trash2, Plus, Save } from 'lucide-react';

const ZoneForm = () => {
  const [zoneData, setZoneData] = useState({
    name: 'Velachery, Chennai',
    status: 'Active',
    charges: [
      {
        minCharge: 0,
        maxCharge: 10,
        price: 40,
        type: 'Rate'
      }
    ]
  });

  /* ---------------- handlers ---------------- */

  const updateField = (field, value) => {
    setZoneData(prev => ({ ...prev, [field]: value }));
  };

  const updateCharge = (index, field, value) => {
    const updated = [...zoneData.charges];
    updated[index][field] = value;
    setZoneData(prev => ({ ...prev, charges: updated }));
  };

  const addChargeRow = () => {
    setZoneData(prev => ({
      ...prev,
      charges: [
        ...prev.charges,
        { minCharge: 0, maxCharge: 0, price: 0, type: 'Rate' }
      ]
    }));
  };

  const deleteChargeRow = (index) => {
    setZoneData(prev => ({
      ...prev,
      charges: prev.charges.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('ZONE DATA:', zoneData);
    // API call goes here
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen font-sans">
      <Paper elevation={0} className="p-6 rounded-lg border border-gray-200">

        <form className="space-y-8" onSubmit={handleSubmit}>

          {/* Row 1: Zone Name and Status */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography className="text-sm font-medium text-gray-500 mb-1">
                Zone Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={zoneData.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography className="text-sm font-medium text-gray-500 mb-1">
                Status
              </Typography>
              <Select
                fullWidth
                size="small"
                value={zoneData.status}
                onChange={(e) => updateField('status', e.target.value)}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </Grid>
          </Grid>

          {/* Delivery Charges */}
          {zoneData.charges.map((row, index) => (
            <div key={index} className="space-y-2">
              <Typography className="text-sm font-medium text-gray-500">
                Zone Delivery Charge
              </Typography>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Minimum"
                    size="small"
                    type="number"
                    value={row.minCharge}
                    onChange={(e) =>
                      updateCharge(index, 'minCharge', Number(e.target.value))
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Maximum"
                    size="small"
                    type="number"
                    value={row.maxCharge}
                    onChange={(e) =>
                      updateCharge(index, 'maxCharge', Number(e.target.value))
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Price"
                    size="small"
                    type="number"
                    value={row.price}
                    onChange={(e) =>
                      updateCharge(index, 'price', Number(e.target.value))
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={2}>
                  <Select
                    fullWidth
                    size="small"
                    value={row.type}
                    onChange={(e) =>
                      updateCharge(index, 'type', e.target.value)
                    }
                  >
                    <MenuItem value="Rate">Rate</MenuItem>
                    <MenuItem value="Flat">Flat</MenuItem>
                  </Select>
                </Grid>

                <Grid item xs={12} sm={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<Trash2 size={16} />}
                    onClick={() => deleteChargeRow(index)}
                    className="border-red-300 text-red-600 hover:bg-red-50 normal-case"
                  >
                    Delete
                  </Button>
                </Grid>
              </Grid>
            </div>
          ))}

          {/* Add New Row */}
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={addChargeRow}
            className="bg-[#0d9488] hover:bg-[#0f766e] normal-case"
            style={{ backgroundColor: '#0d9488' }}
          >
            Add New
          </Button>

          {/* Map Search Section — UNCHANGED */}
          <div className="space-y-2 pt-4">
            <Typography className="text-sm font-medium text-gray-500">
              Search In Map
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Search In Map"
              variant="outlined"
            />
          </div>

          {/* Map Integration Area — UNCHANGED */}
          <div className="relative">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                className="text-[#0d9488] text-sm font-semibold hover:underline"
              >
                Delete Polygons
              </button>
            </div>

            <div className="w-full h-[400px] bg-gray-200 rounded border border-gray-300 overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Chennai&zoom=12&size=1200x400&key=YOUR_KEY')] bg-cover bg-center opacity-80" />

              <div className="absolute top-4 left-4 flex shadow-md rounded overflow-hidden">
                <button className="bg-white px-4 py-1 text-sm font-bold border-r">
                  Map
                </button>
                <button className="bg-gray-50 px-4 py-1 text-sm text-gray-600">
                  Satellite
                </button>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save size={18} />}
              className="bg-[#0d9488] hover:bg-[#0f766e] px-8 py-2 normal-case"
              style={{ backgroundColor: '#0d9488' }}
            >
              Save
            </Button>
          </div>

        </form>
      </Paper>
    </div>
  );
};

export default ZoneForm;
