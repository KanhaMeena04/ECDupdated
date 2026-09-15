// import React, { useState } from 'react';
// import { 
//   TextField, Select, MenuItem, FormControl, InputLabel, 
//   Checkbox, FormControlLabel, Button, IconButton, OutlinedInput,
//   InputAdornment, Divider
// } from '@mui/material';
// import { Camera, MapPin, Upload, ChevronUp } from 'lucide-react';
// import ImageUploadSection from './ImageUploadSection';
// import { useAddRestaurant } from '../../api/restaurant';
// import { useNavigate } from 'react-router-dom';
// const AddRestaurantForm = () => {
//   const [formData, setFormData] = useState({
//     restaurantName: '',
//     email: '',
//     password: '',
//     city: '',
//     area: '',
//     countryCode: '+1',
//     mobileNumber: '',
//     contactNumber: '',
//     deliveryTime: '',
//     address: '',
//     adminCommission: 10,
//     packagingCharge: '',
//     geofenceRadius: 8001,
//     deliveryType: { home: false, pickup: false, dining: false },
//     payment: 'Both',
//     status: 'Inactive',
//     freeDelivery: 'No',
//     cuisines: []
//   });

//   const cuisinesList = [
//     "Doner", "Asian", "Continental", "South Indian", 
//     "Italian", "Burger", "Mexican", "Local Dishes"
//   ];
// const navigate = useNavigate();

//   const { data, handleChange, handleSubmit, loading, error } = useAddRestaurant(
//     initialFormState,
//     () => {
//       console.log("Success!");
//       navigate("/restaurants"); // Navigate after success
//     }
//   );
//   return (
//     <div className="min-h-screen bg-gray-50 pb-10 font-sans text-gray-700">
//        <ImageUploadSection/>

//       <div className="mt-16 px-10 border-b border-gray-200 flex gap-6">
//         <button className="text-[#00a67e] border-b-2 border-[#00a67e] pb-2 font-medium flex items-center gap-1">
//           <span className="text-xs border border-[#00a67e] px-1 rounded">Aあ</span> English
//         </button>
//         <button className="text-gray-500 pb-2 font-medium flex items-center gap-1">
//            <span className="text-xs border border-gray-400 px-1 rounded">ع</span> Arabic
//         </button>
//       </div>

//       {/* Main Form Content */}
//       <form className="px-10 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
        
//         {/* Left Column */}
//         <div className="space-y-6">
//           <TextField fullWidth label="Restaurant Name" placeholder="Enter Restaurant Name" variant="outlined" size="small" />
//           <TextField fullWidth label="Email*" placeholder="Enter Email" variant="outlined" size="small" required />
//           <TextField fullWidth label="Password" type="password" placeholder="Password" variant="outlined" size="small" />
          
//           <FormControl fullWidth size="small">
//             <InputLabel>Select City*</InputLabel>
//             <Select label="Select City*">
//               <MenuItem value="city1">City 1</MenuItem>
//             </Select>
//           </FormControl>

//           <FormControl fullWidth size="small">
//             <InputLabel>Select Area*</InputLabel>
//             <Select label="Select Area*">
//               <MenuItem value="area1">Area 1</MenuItem>
//             </Select>
//           </FormControl>

//           <div className="flex gap-2">
//             <FormControl style={{ width: '120px' }} size="small">
//               <Select value={formData.countryCode}>
//                 <MenuItem value="+1">🇺🇸 +1</MenuItem>
//                 <MenuItem value="+91">🇮🇳 +91</MenuItem>
//               </Select>
//             </FormControl>
//             <TextField fullWidth label="Mobile Number*" placeholder="Phone number" variant="outlined" size="small" error helperText="The number field is required" />
//           </div>

//           <div className="flex gap-2">
//             <FormControl style={{ width: '120px' }} size="small">
//               <Select value={formData.countryCode}>
//                 <MenuItem value="+1">🇺🇸 +1</MenuItem>
//               </Select>
//             </FormControl>
//             <TextField fullWidth label="Contact Number*" placeholder="Phone number" variant="outlined" size="small" error helperText="The number field is required" />
//           </div>

//           <FormControl fullWidth size="small">
//             <InputLabel>Estimated Delivery Time(Mins)*</InputLabel>
//             <Select label="Estimated Delivery Time(Mins)*">
//               <MenuItem value={30}>30 Mins</MenuItem>
//               <MenuItem value={45}>45 Mins</MenuItem>
//             </Select>
//           </FormControl>

//           <TextField fullWidth label="Packaging Charge(%)*" variant="outlined" size="small" />
//           <TextField fullWidth label="Geofence Radius" defaultValue="8001" variant="outlined" size="small" />

//           <div>
//             <p className="text-sm font-medium mb-2 text-gray-600">Delivery Type*</p>
//             <div className="flex flex-col">
//               <FormControlLabel control={<Checkbox size="small" />} label="Home Delivery" />
//               <FormControlLabel control={<Checkbox size="small" />} label="Pickup" />
//               <FormControlLabel control={<Checkbox size="small" />} label="Dining" />
//             </div>
//           </div>
//         </div>

//         {/* Right Column */}
//         <div className="space-y-6">
//           <TextField fullWidth label="Address*" placeholder="Enter Address" variant="outlined" size="small" />
          
//           {/* Mock Map Placeholder */}
//           <div className="w-full h-[300px] bg-blue-50 border rounded relative overflow-hidden">
//              <img 
//                src="https://maps.googleapis.com/maps/api/staticmap?center=Chennai&zoom=13&size=600x300&key=YOUR_KEY" 
//                alt="Map" 
//                className="w-full h-full object-cover grayscale-[0.5]"
//              />
//              <div className="absolute top-2 left-2 flex gap-1 bg-white p-1 rounded shadow-sm">
//                 <button className="px-3 py-1 bg-gray-100 text-sm font-bold border-r">Map</button>
//                 <button className="px-3 py-1 text-sm">Satellite</button>
//              </div>
//              <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-600" fill="currentColor" size={32} />
//           </div>

//           <TextField fullWidth label="Admin Commission %" defaultValue="10" variant="outlined" size="small" />
          
//           <FormControl fullWidth size="small">
//             <InputLabel>Payment*</InputLabel>
//             <Select label="Payment*" defaultValue="Both">
//               <MenuItem value="Both">Both</MenuItem>
//               <MenuItem value="Online">Online</MenuItem>
//               <MenuItem value="COD">Cash on Delivery</MenuItem>
//             </Select>
//           </FormControl>

//           <FormControl fullWidth size="small">
//             <InputLabel>Status*</InputLabel>
//             <Select label="Status*" defaultValue="Inactive">
//               <MenuItem value="Active">Active</MenuItem>
//               <MenuItem value="Inactive">Inactive</MenuItem>
//             </Select>
//           </FormControl>

//           <FormControl fullWidth size="small">
//             <InputLabel>Free Delivery*</InputLabel>
//             <Select label="Free Delivery*" defaultValue="No">
//               <MenuItem value="Yes">Yes</MenuItem>
//               <MenuItem value="No">No</MenuItem>
//             </Select>
//           </FormControl>

//           <TextField fullWidth label="Restaurant Free Delivery Contribution %" defaultValue="0" variant="outlined" size="small" />

//           <div>
//             <p className="text-sm font-medium mb-2 text-gray-600">Cuisines*</p>
//             <div className="grid grid-cols-2 gap-x-4 max-h-48 overflow-y-auto border p-3 rounded bg-white">
//               {cuisinesList.map((item) => (
//                 <FormControlLabel key={item} control={<Checkbox size="small" />} label={item} />
//               ))}
//             </div>
//           </div>
//         </div>
//       </form>

//       <button
//         onClick={handleSubmit}
//         disabled={loading}
//         className={`mt-6 w-full flex items-center justify-center gap-2 px-6 py-2 rounded text-white transition-all
//           ${loading ? "bg-gray-400" : "bg-[#00a67e] hover:bg-[#008f6d]"}`}
//       >
//         {loading ? (
//           "Adding..."
//         ) : (
//           <>
//             <Plus size={18} /> Add Restaurant
//           </>
//         )}
//       </button>

//       {/* Floating Action Button */}
//       <div className="fixed bottom-6 right-6">
//         <button className="bg-[#00a67e] text-white p-3 rounded shadow-lg hover:scale-110 transition-transform">
//           <ChevronUp />
//         </button>
//       </div>
      
//       <footer className="px-10 mt-10 text-xs text-gray-400">
//         COPYRIGHT © 2025 <span className="text-[#00a67e]">Bytesflow Technologies</span>, All rights Reserved
//       </footer>
//     </div>
//   );
// };

// export default AddRestaurantForm;
// import React from 'react';
// import { 
//   TextField, FormControl, InputLabel, Select, MenuItem, 
//   FormControlLabel, Checkbox 
// } from "@mui/material";
// import { Plus, MapPin, ChevronUp } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import ImageUploadSection from "./ImageUploadSection";
// import { useAddRestaurant } from '../../api/restaurant.js';
// import { initialRestaurantFormState } from '../../data/restaurantData';

// const AddRestaurantForm = () => {
//   const navigate = useNavigate();

  // 1. Define the Initial Object structure
  // const initialFormState = {
  //   restaurantName: 'Restorant',
  //   email: 'mail@.com',
  //   password: '1234',
  //   city: 'inodre',
  //   area: 'indore',
  //   countryCode: '+1',
  //   mobileNumber: '1257896453',
  //   contactNumber: '',
  //   deliveryTime: '',
  //   address: '',
  //   adminCommission: 10,
  //   packagingCharge: '',
  //   geofenceRadius: 8001,
  //   deliveryType: { home: false, pickup: false, dining: false },
  //   payment: 'Both',
  //   status: 'Inactive',
  //   freeDelivery: 'No',
  //   cuisines: []
  // };

//   const cuisinesList = [
//     "Doner", "Asian", "Continental", "South Indian", 
//     "Italian", "Burger", "Mexican", "Local Dishes"
//   ];

//   // 2. Initialize the Hook with the state object
//   const { data, handleChange, handleSubmit, loading, error } = useAddRestaurant(
//     initialRestaurantFormState,
//     () => {
//       alert("Restaurant Added Successfully!");
//       navigate("/restaurants");
//     }
//   );

//   // 3. Helper for handling Checkboxes (Cuisines & Delivery Type)
//   const handleCheckboxChange = (category, value) => {
//     if (category === 'cuisines') {
//       const updatedCuisines = data.cuisines.includes(value)
//         ? data.cuisines.filter(c => c !== value)
//         : [...data.cuisines, value];
      
//       // Simulate event for handleChange or use a custom update
//       handleChange({ target: { name: 'cuisines', value: updatedCuisines } });
//     } else {
//       const updatedDelivery = { ...data.deliveryType, [value]: !data.deliveryType[value] };
//       handleChange({ target: { name: 'deliveryType', value: updatedDelivery } });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 pb-10 font-sans text-gray-700">
//       <ImageUploadSection />

//       {/* Language Toggle */}
//       <div className="mt-16 px-10 border-b border-gray-200 flex gap-6">
//         <button type="button" className="text-[#00a67e] border-b-2 border-[#00a67e] pb-2 font-medium flex items-center gap-1">
//           <span className="text-xs border border-[#00a67e] px-1 rounded">Aあ</span> English
//         </button>
//         <button type="button" className="text-gray-500 pb-2 font-medium flex items-center gap-1">
//           <span className="text-xs border border-gray-400 px-1 rounded">ع</span> Arabic
//         </button>
//       </div>

//       {error && <div className="mx-10 mt-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">{error}</div>}

//       <form className="px-10 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
        
//         {/* Left Column */}
//         <div className="space-y-6">
//           <TextField 
//             fullWidth label="Restaurant Name" name="restaurantName" 
//             value={data.restaurantName} onChange={handleChange} 
//             variant="outlined" size="small" 
//           />
//           <TextField 
//             fullWidth label="Email*" name="email" 
//             value={data.email} onChange={handleChange} 
//             variant="outlined" size="small" required 
//           />
//           <TextField 
//             fullWidth label="Password" name="password" type="password" 
//             value={data.password} onChange={handleChange} 
//             variant="outlined" size="small" 
//           />
          
//           <FormControl fullWidth size="small">
//             <InputLabel>Select City*</InputLabel>
//             <Select label="Select City*" name="city" value={data.city} onChange={handleChange}>
//               <MenuItem value="city1">City 1</MenuItem>
//               <MenuItem value="city2">City 2</MenuItem>
//             </Select>
//           </FormControl>

//           <div className="flex gap-2">
//             <FormControl style={{ width: '120px' }} size="small">
//               <Select name="countryCode" value={data.countryCode} onChange={handleChange}>
//                 <MenuItem value="+1">🇺🇸 +1</MenuItem>
//                 <MenuItem value="+91">🇮🇳 +91</MenuItem>
//               </Select>
//             </FormControl>
//             <TextField 
//               fullWidth label="Mobile Number*" name="mobileNumber"
//               value={data.mobileNumber} onChange={handleChange}
//               variant="outlined" size="small" 
//             />
//           </div>

//           <TextField 
//             fullWidth label="Packaging Charge(%)*" name="packagingCharge"
//             value={data.packagingCharge} onChange={handleChange}
//             variant="outlined" size="small" 
//           />

//           <div>
//             <p className="text-sm font-medium mb-2 text-gray-600">Delivery Type*</p>
//             <div className="flex flex-col">
//               <FormControlLabel 
//                 control={<Checkbox checked={data.deliveryType.home} onChange={() => handleCheckboxChange('delivery', 'home')} size="small" />} 
//                 label="Home Delivery" 
//               />
//               <FormControlLabel 
//                 control={<Checkbox checked={data.deliveryType.pickup} onChange={() => handleCheckboxChange('delivery', 'pickup')} size="small" />} 
//                 label="Pickup" 
//               />
//             </div>
//           </div>
//         </div>

//         {/* Right Column */}
//         <div className="space-y-6">
//           <TextField 
//             fullWidth label="Address*" name="address"
//             value={data.address} onChange={handleChange}
//             variant="outlined" size="small" 
//           />
          
//           {/* Map Placeholder */}
//           <div className="w-full h-[300px] bg-blue-50 border rounded relative overflow-hidden">
//              <img src="https://maps.googleapis.com/maps/api/staticmap?center=40.712776,-74.005974&zoom=13&size=600x300" alt="Map" className="w-full h-full object-cover grayscale-[0.5]" />
//              <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-600" size={32} />
//           </div>

//           <FormControl fullWidth size="small">
//             <InputLabel>Status*</InputLabel>
//             <Select label="Status*" name="status" value={data.status} onChange={handleChange}>
//               <MenuItem value="Active">Active</MenuItem>
//               <MenuItem value="Inactive">Inactive</MenuItem>
//             </Select>
//           </FormControl>

//           <div>
//             <p className="text-sm font-medium mb-2 text-gray-600">Cuisines*</p>
//             <div className="grid grid-cols-2 gap-x-4 max-h-48 overflow-y-auto border p-3 rounded bg-white">
//               {cuisinesList.map((item) => (
//                 <FormControlLabel 
//                   key={item} 
//                   control={<Checkbox checked={data.cuisines.includes(item)} onChange={() => handleCheckboxChange('cuisines', item)} size="small" />} 
//                   label={item} 
//                 />
//               ))}
//             </div>
//           </div>
//         </div>
//       </form>

//       {/* Submit Button */}
//       <div className="px-10 pb-10">
//         <button
//           onClick={handleSubmit}
//           disabled={loading}
//           className={`mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 rounded text-white font-bold transition-all
//             ${loading ? "bg-gray-400" : "bg-[#00a67e] hover:bg-[#008f6d] shadow-lg"}`}
//         >
//           {loading ? "Adding..." : <> Add Restaurant</>}
//         </button>
//       </div>

//       <footer className="px-10 mt-10 text-xs text-gray-400">
//         COPYRIGHT © 2025 <span className="text-[#00a67e]">Bytesflow Technologies</span>, All rights Reserved
//       </footer>
//     </div>
//   );
// };

// export default AddRestaurantForm;
import React from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ImageUploadSection from "./ImageUploadSection";
import { useAddRestaurant } from "../../api/restaurant";
import { initialRestaurantFormState } from "../../data/restaurantData.js";

const cuisinesList = [
  "Doner",
  "Asian",
  "Continental",
  "South Indian",
  "Italian",
  "Burger",
  "Mexican",
  "Local Dishes",
];

const AddRestaurantForm = () => {
  const navigate = useNavigate();

  const { data, handleChange, handleSubmit, loading, error } =
    useAddRestaurant(initialRestaurantFormState, () => {
      alert("Restaurant Added Successfully!");
      navigate("/restaurants");
    });

  /* -------------------- HELPERS -------------------- */

  const toggleCuisine = (value) => {
    handleChange({
      target: {
        name: "cuisine",
        value: data.cuisine.includes(value)
          ? data.cuisine.filter((c) => c !== value)
          : [...data.cuisine, value],
      },
    });
  };

  const toggleDeliveryType = (value) => {
    handleChange({
      target: {
        name: "deliveryType",
        value: data.deliveryType.includes(value)
          ? data.deliveryType.filter((d) => d !== value)
          : [...data.deliveryType, value],
      },
    });
  };

  /* -------------------- UI -------------------- */

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans text-gray-700">
      <ImageUploadSection />

      {/* Language Toggle */}
      <div className="mt-16 px-10 border-b border-gray-200 flex gap-6">
        <button className="text-[#00a67e] border-b-2 border-[#00a67e] pb-2 font-medium flex items-center gap-1">
          <span className="text-xs border border-[#00a67e] px-1 rounded">Aあ</span>
          English
        </button>
        <button className="text-gray-500 pb-2 font-medium flex items-center gap-1">
          <span className="text-xs border border-gray-400 px-1 rounded">ع</span>
          Arabic
        </button>
      </div>

      {error && (
        <div className="mx-10 mt-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}

      <form className="px-10 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <TextField
            fullWidth
            label="Restaurant Name"
            name="name.en"
            value={data.name.en}
            onChange={handleChange}
            size="small"
          />

          <TextField
            fullWidth
            label="Brand"
            name="brand"
            value={data.brand}
            onChange={handleChange}
            size="small"
          />

          <TextField
            fullWidth
            label="Owner Name"
            name="ownerName"
            value={data.ownerName}
            onChange={handleChange}
            size="small"
          />

          <TextField
            fullWidth
            label="Owner Email"
            name="ownerEmail"
            value={data.ownerEmail}
            onChange={handleChange}
            size="small"
          />

          <TextField
            fullWidth
            label="Owner Password"
            type="password"
            name="ownerPassword"
            value={data.ownerPassword}
            onChange={handleChange}
            size="small"
          />

          <TextField
            fullWidth
            label="Owner Mobile"
            name="ownerMobile"
            value={data.ownerMobile}
            onChange={handleChange}
            size="small"
          />

          <FormControl fullWidth size="small">
            <InputLabel>City</InputLabel>
            <Select
              label="City"
              name="city"
              value={data.city}
              onChange={handleChange}
            >
              <MenuItem value="city1">City 1</MenuItem>
              <MenuItem value="city2">City 2</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Area"
            name="area"
            value={data.area}
            onChange={handleChange}
            size="small"
          />

          <TextField
            fullWidth
            label="Packaging Charge (%)"
            name="packagingCharge"
            value={data.packagingCharge}
            onChange={handleChange}
            size="small"
          />

          <TextField
            fullWidth
            label="Admin Commission (%)"
            name="adminCommission"
            value={data.adminCommission}
            onChange={handleChange}
            size="small"
          />

          <div>
            <p className="text-sm font-medium mb-2 text-gray-600">
              Delivery Type
            </p>
            <FormControlLabel
              control={
                <Checkbox
                  checked={data.deliveryType.includes("home")}
                  onChange={() => toggleDeliveryType("home")}
                  size="small"
                />
              }
              label="Home Delivery"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={data.deliveryType.includes("pickup")}
                  onChange={() => toggleDeliveryType("pickup")}
                  size="small"
                />
              }
              label="Pickup"
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <TextField
            fullWidth
            label="Restaurant Email"
            name="email"
            value={data.email}
            onChange={handleChange}
            size="small"
          />

          <TextField
            fullWidth
            label="Contact Number"
            name="contactNumber"
            value={data.contactNumber}
            onChange={handleChange}
            size="small"
          />

          <TextField
            fullWidth
            label="Address"
            name="address"
            value={data.address}
            onChange={handleChange}
            size="small"
          />

          {/* Map Placeholder */}
          <div className="w-full h-[300px] bg-blue-50 border rounded relative overflow-hidden">
            <img
              src="https://maps.googleapis.com/maps/api/staticmap?center=40.712776,-74.005974&zoom=13&size=600x300"
              alt="Map"
              className="w-full h-full object-cover grayscale-[0.5]"
            />
            <MapPin
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-600"
              size={32}
            />
          </div>

          <TextField
            fullWidth
            label="Delivery Time (mins)"
            name="deliveryTime"
            value={data.deliveryTime}
            onChange={handleChange}
            size="small"
          />

          <TextField
            fullWidth
            label="Geofence Radius (meters)"
            name="geofenceRadius"
            value={data.geofenceRadius}
            onChange={handleChange}
            size="small"
          />

          <FormControl fullWidth size="small">
            <InputLabel>Payment Methods</InputLabel>
            <Select
              label="Payment Methods"
              name="paymentMethods"
              value={data.paymentMethods}
              onChange={handleChange}
            >
              <MenuItem value="Both">Both</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Online">Online</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={data.isFreeDelivery}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "isFreeDelivery",
                      value: e.target.checked,
                    },
                  })
                }
              />
            }
            label="Free Delivery"
          />

          {data.isFreeDelivery && (
            <TextField
              fullWidth
              label="Free Delivery Contribution"
              name="freeDeliveryContribution"
              value={data.freeDeliveryContribution}
              onChange={handleChange}
              size="small"
            />
          )}

          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              name="isActive"
              value={data.isActive}
              onChange={handleChange}
            >
              <MenuItem value={true}>Active</MenuItem>
              <MenuItem value={false}>Inactive</MenuItem>
            </Select>
          </FormControl>

          <div>
            <p className="text-sm font-medium mb-2 text-gray-600">Cuisines</p>
            <div className="grid grid-cols-2 gap-x-4 max-h-48 overflow-y-auto border p-3 rounded bg-white">
              {cuisinesList.map((item) => (
                <FormControlLabel
                  key={item}
                  control={
                    <Checkbox
                      checked={data.cuisine.includes(item)}
                      onChange={() => toggleCuisine(item)}
                      size="small"
                    />
                  }
                  label={item}
                />
              ))}
            </div>
          </div>
        </div>
      </form>

      {/* SUBMIT */}
      <div className="px-10 pb-10">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`mt-6 w-full px-6 py-3 rounded text-white font-bold transition-all ${
            loading
              ? "bg-gray-400"
              : "bg-[#00a67e] hover:bg-[#008f6d] shadow-lg"
          }`}
        >
          {loading ? "Adding..." : "Add Restaurant"}
        </button>
      </div>

      <footer className="px-10 mt-10 text-xs text-gray-400">
        COPYRIGHT © 2025{" "}
        <span className="text-[#00a67e]">Bytesflow Technologies</span>, All rights
        Reserved
      </footer>
    </div>
  );
};

export default AddRestaurantForm;
