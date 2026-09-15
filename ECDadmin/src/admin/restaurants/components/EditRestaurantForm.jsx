import React from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Breadcrumbs,
  Typography,
} from "@mui/material";
import { 
  MapPin, Store, User, ShieldCheck, Globe, ListFilter, 
  AlertCircle, Save, ChevronRight, History 
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ImageUploadSection from "./ImageUploadSection";
import { useEditRestaurantProfile} from "../../api/restaurant"; 
import { useCuisine } from "../../api/cuisine";
import { useCities } from "../../api/city";

const EditRestaurantForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 

  const { data, handleChange, handleSubmit, loading, error } =
    useEditRestaurantProfile(id, () => {
      
    });

  const { cuisines, loading: cuisinesLoading, error: cuisinesError } = useCuisine();
  const {cities}=useCities()
  const toggleCuisine = (value) => {
    handleChange({
      target: {
        name: "cuisine",
        value: data.cuisine.includes(value)
          ? data.cuisine.filter((c) => c !== value)
          : [...data?.cuisine, value],
      },
    });
  };


  if (loading || !data || !data.name) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <CircularProgress />
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans text-gray-700">
      {/* Dynamic Header for Edit Mode */}
      <div className="bg-[#00a67e] pt-10 pb-20 px-10">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs separator={<ChevronRight size={14} className="text-emerald-200" />} className="mb-4">
            <Typography className="text-emerald-100 text-sm cursor-pointer hover:underline" onClick={() => navigate("/restaurants")}>Restaurants</Typography>
            <Typography className="text-white text-sm font-bold">Edit Details</Typography>
          </Breadcrumbs>
          <div className="flex justify-between items-center">
            <h1 className="text-white text-3xl font-extrabold flex items-center gap-3">
              <Store size={32} /> {data?.name?.en || "Loading Restaurant..."}
            </h1>
            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg border border-white/30 text-white text-sm flex items-center gap-2">
              <History size={16} /> Last Updated: Dec 31, 2025
            </div>
          </div>
        </div>
      </div>

      <div className="-mt-12 max-w-7xl mx-auto px-4 md:px-10">
        {/* Reuse your existing Image Section */}
        <ImageUploadSection  className="bg-[#fe3f3f]" isEdit={true} />

        <Paper elevation={0} className="mt-8 rounded-2xl border border-gray-100 overflow-hidden shadow-xl">
          {error && (
            <div className="mx-8 mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="text-sm font-semibold">Update Failed: {error}</p>
            </div>
          )}

          <form className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10">
            
            {/* LEFT COLUMN: Business Identity */}
            <div className="space-y-8">
              <section>
                <div className="flex items-center gap-2 text-gray-400 font-black text-[11px] uppercase tracking-[2px] mb-6">
                   Information Details
                </div>
                <div className="grid gap-6">
                  <TextField fullWidth variant="filled" label="Restaurant Name" name="name.en" value={data.name.en} onChange={handleChange} size="small" />
                  <TextField fullWidth variant="filled" label="Brand Name" name="brand" value={data.brand} onChange={handleChange} size="small" />
                </div>
              </section>
              
              <Divider />
              
              <section>
                <div className="flex items-center gap-2 text-gray-400 font-black text-[11px] uppercase tracking-[2px] mb-6">
                   Legal Owner Contact
                </div>
                <div className="grid gap-6">
                  <TextField fullWidth label="Owner Full Name" name="ownerName" value={data.ownerName} onChange={handleChange} size="small" />
                  <div className="grid grid-cols-2 gap-4">
                    <TextField fullWidth label="Email Address" name="ownerEmail" value={data.ownerEmail} onChange={handleChange} size="small" />
                    <TextField fullWidth label="Mobile Number" name="ownerMobile" value={data.ownerMobile} onChange={handleChange} size="small" />
                  </div>
                  <TextField fullWidth label="Update Password" type="password" name="ownerPassword" value={data.ownerPassword} onChange={handleChange} size="small" placeholder="Leave blank to keep current" />
                </div>
              </section>

              <section className="bg-emerald-50/30 p-5 rounded-xl border border-emerald-100/50">
                <div className="flex items-center gap-2 text-emerald-700 font-black text-[11px] uppercase tracking-[2px] mb-4">
                   <ShieldCheck size={14} /> Revenue Settings
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <TextField fullWidth label="Packaging Fee (%)" name="packagingCharge" value={data.packagingCharge} onChange={handleChange} size="small" />
                  <TextField fullWidth label="Admin Comm (%)" name="adminCommission" value={data.adminCommission} onChange={handleChange} size="small" />
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN: Operational Map & Settings */}
            <div className="space-y-8">
              <section>
                <div className="flex items-center gap-2 text-gray-400 font-black text-[11px] uppercase tracking-[2px] mb-6">
                   Global Logistics
                </div>
                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormControl fullWidth size="small">
                      <InputLabel>Operational City</InputLabel>
                      <Select label="Operational City" name="city" value={data.city} onChange={handleChange}>
                        {
                          cities.map((city)=>(
                            <>
                            <MenuItem value="city1">{city}</MenuItem>

                            </>
                          )) 
                        }
                      </Select>
                    </FormControl>
                    <TextField fullWidth label="Zone Area" name="area" value={data.area} onChange={handleChange} size="small" />
                  </div>
                  <TextField fullWidth label="Full Physical Address" name="address" value={data.address} onChange={handleChange} size="small" />
                </div>
              </section>

              <div className="group relative rounded-2xl overflow-hidden border-4 border-white shadow-lg h-[240px]">
                <img
                  src="https://maps.googleapis.com/maps/api/staticmap?center=40.712776,-74.005974&zoom=13&size=600x300&style=feature:all|element:labels|visibility:on"
                  alt="Map"
                  className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-all"></div>
                <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600 drop-shadow-md" size={40} />
                <div className="absolute bottom-4 right-4 bg-white px-3 py-1.5 rounded-lg shadow-xl text-[10px] font-bold text-gray-600 border border-gray-100">
                  CLICK MAP TO UPDATE COORDINATES
                </div>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                     <ListFilter size={14} /> Cuisine Catalog
                  </p>
                  {cuisinesLoading && <CircularProgress size={16} color="inherit" />}
                </div>
                <div className="grid grid-cols-2 gap-x-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {cuisines?.map((item) => (
                    <FormControlLabel
                      key={item}
                      control={
                        <Checkbox 
                          checked={data.cuisine.includes(item)} 
                          onChange={() => toggleCuisine(item)} 
                          size="small" 
                          sx={{ color: '#00a67e', '&.Mui-checked': { color: '#00a67e' } }} 
                        />
                      }
                      label={<span className="text-[13px] font-medium text-gray-600">{item}</span>}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-4 px-2">
                    <FormControl fullWidth size="small">
                     <InputLabel>Delivery Type</InputLabel>
                     <Select
                       name="deliveryType"
                       value={data.deliveryType || ""}
                       label="Delivery Type"
                       onChange={handleChange}
                     >
                       <MenuItem value="Home Delivery">Home Delivery</MenuItem>
                       <MenuItem value="Pickup">Pickup</MenuItem>
                       <MenuItem value="Dining">Dining</MenuItem>
                     </Select>
                </FormControl>

              </div>
            </div>
          </form>

          {/* Sticky-feel Footer */}
          <div className="bg-gray-100/50 p-8 border-t border-gray-200 flex justify-between items-center">
            <Typography className="text-gray-400 text-xs italic font-medium">
              * Ensure all mandatory fields marked are verified before saving changes.
            </Typography>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              variant="contained"
              startIcon={!loading && <Save size={18} />}
              className="h-12 px-10 rounded-xl shadow-emerald-200 shadow-lg"
              sx={{ 
                backgroundColor: '#00a67e', 
                textTransform: 'none', 
                fontSize: '16px',
                fontWeight: '800',
                '&:hover': { backgroundColor: '#008f6d', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)' },
              }}
            >
              {loading ? "Saving Changes..." : "Update Restaurant"}
            </Button>
          </div>
        </Paper>
      </div>
    </div>
  );
};

export default EditRestaurantForm;