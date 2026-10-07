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
  Slider,
  Box,
} from "@mui/material";
import { 
  MapPin, Store, ShieldCheck, ListFilter, 
  AlertCircle, Save, ChevronRight, History 
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ImageUploadSection from "./ImageUploadSection";
import { useEditRestaurantProfile} from "../../api/restaurant"; 
import { useCuisine } from "../../api/cuisine";
import { useCities } from "../../api/city";
import GoogleServiceAreaMap, { parseGooglePlaceDetails } from "../../components/GoogleServiceAreaMap";

const EditRestaurantForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 

  const { data, handleChange, handleSubmit, loading, error } =
    useEditRestaurantProfile(id, () => {});

  const { cuisines, loading: cuisinesLoading } = useCuisine();
  const { cities } = useCities();

  const toggleCuisine = (value) => {
    const currentList = Array.isArray(data?.cuisine) ? data.cuisine : [];
    handleChange({
      target: {
        name: "cuisine",
        value: currentList.includes(value)
          ? currentList.filter((c) => c !== value)
          : [...currentList, value],
      },
    });
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CircularProgress sx={{ color: "#00a67e" }} />
      </div>
    );
  }

  const displayName = typeof data.name === 'object'
    ? (data.name?.en || Object.values(data.name)[0] || "")
    : (data.name || "");

  const safeCuisines = Array.isArray(data.cuisine) ? data.cuisine : [];

  const currentLat = data.latitude !== undefined && data.latitude !== ""
    ? Number(data.latitude)
    : (data.location?.coordinates?.[1] || 28.6139);

  const currentLng = data.longitude !== undefined && data.longitude !== ""
    ? Number(data.longitude)
    : (data.location?.coordinates?.[0] || 77.2090);

  const currentRadius = data.geofenceRadius !== undefined && data.geofenceRadius !== ""
    ? Number(data.geofenceRadius)
    : 10;

  const handleMapLocationSelect = (selectedLat, selectedLng, placeObj) => {
    const newLocation = { type: "Point", coordinates: [Number(selectedLng), Number(selectedLat)] };
    
    handleChange({ target: { name: "latitude", value: selectedLat } });
    handleChange({ target: { name: "longitude", value: selectedLng } });
    handleChange({ target: { name: "location", value: newLocation } });

    if (placeObj) {
      const parsed = parseGooglePlaceDetails(placeObj);
      if (parsed.address) handleChange({ target: { name: "address", value: parsed.address } });
      if (parsed.city) handleChange({ target: { name: "city", value: parsed.city } });
      if (parsed.area) handleChange({ target: { name: "area", value: parsed.area } });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans text-gray-700">
      {/* Dynamic Header for Edit Mode */}
      <div className="bg-[#00a67e] pt-10 pb-20 px-10">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs separator={<ChevronRight size={14} className="text-emerald-200" />} className="mb-4">
            <Typography className="text-emerald-100 text-sm cursor-pointer hover:underline" onClick={() => navigate("/restaurants")}>Restaurants</Typography>
            <Typography className="text-white text-sm font-bold">Edit Details</Typography>
          </Breadcrumbs>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-white text-3xl font-extrabold flex items-center gap-3">
              <Store size={32} /> {displayName || "Edit Restaurant"}
            </h1>
            <div className="flex items-center gap-3">
              <Button
                variant="contained"
                onClick={() => navigate(`/edit-restaurant-menu/${id}`)}
                sx={{
                  backgroundColor: "#ffffff",
                  color: "#00a67e",
                  fontWeight: "bold",
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 3,
                  py: 1,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  "&:hover": { backgroundColor: "#f0fdf4" }
                }}
              >
                🍽️ Manage / Add Menu
              </Button>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg border border-white/30 text-white text-sm flex items-center gap-2">
                <History size={16} /> Live DB Synced
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="-mt-12 max-w-7xl mx-auto px-4 md:px-10">
        <ImageUploadSection
          coverImage={data?.bannerImage || data?.coverImage}
          profileImage={data?.image || data?.logo || data?.profileImage || data?.profilePic}
          onCoverChange={(base64) => {
            handleChange({ target: { name: "bannerImage", value: base64 } });
          }}
          onProfileChange={(base64) => {
            handleChange({ target: { name: "image", value: base64 } });
            handleChange({ target: { name: "logo", value: base64 } });
            handleChange({ target: { name: "profileImage", value: base64 } });
          }}
          isEdit={true}
        />

        <Paper elevation={0} className="mt-8 rounded-2xl border border-gray-100 overflow-hidden shadow-xl">
          {error && (
            <div className="mx-8 mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="text-sm font-semibold">Update Failed: {error}</p>
            </div>
          )}

          <form className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-10" onSubmit={(e) => e.preventDefault()}>
            
            {/* LEFT COLUMN: Business Identity */}
            <div className="space-y-8">
              <section>
                <div className="flex items-center gap-2 text-gray-400 font-black text-[11px] uppercase tracking-[2px] mb-6">
                   Information Details
                </div>
                <div className="grid gap-6">
                  <TextField 
                    fullWidth 
                    variant="filled" 
                    label="Restaurant Name" 
                    name="name" 
                    value={displayName} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (typeof data.name === 'object') {
                        handleChange({ target: { name: "name", value: { ...data.name, en: val } } });
                      } else {
                        handleChange({ target: { name: "name", value: val } });
                      }
                    }} 
                    size="small" 
                  />
                  <TextField fullWidth variant="filled" label="Brand Name" name="brand" value={data.brand || ""} onChange={handleChange} size="small" />
                </div>
              </section>
              
              <Divider />
              
              <section>
                <div className="flex items-center gap-2 text-gray-400 font-black text-[11px] uppercase tracking-[2px] mb-6">
                   Legal Owner Contact
                </div>
                <div className="grid gap-6">
                  <TextField fullWidth label="Owner Full Name" name="ownerName" value={data.ownerName || ""} onChange={handleChange} size="small" />
                  <div className="grid grid-cols-2 gap-4">
                    <TextField fullWidth label="Email Address" name="ownerEmail" value={data.ownerEmail || data.email || ""} onChange={handleChange} size="small" />
                    <TextField fullWidth label="Mobile Number" name="ownerMobile" value={data.ownerMobile || data.contactNumber || ""} onChange={handleChange} size="small" />
                  </div>
                  <TextField fullWidth label="Update Password" type="password" name="ownerPassword" value={data.ownerPassword || ""} onChange={handleChange} size="small" placeholder="Leave blank to keep current" />
                </div>
              </section>

              <section className="bg-emerald-50/30 p-5 rounded-xl border border-emerald-100/50">
                <div className="flex items-center gap-2 text-emerald-700 font-black text-[11px] uppercase tracking-[2px] mb-4">
                   <ShieldCheck size={14} /> Revenue Settings
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <TextField fullWidth label="Packaging Fee (%)" name="packagingCharge" value={data.packagingCharge || ""} onChange={handleChange} size="small" />
                  <TextField fullWidth label="Admin Comm (%)" name="adminCommission" value={data.adminCommission || ""} onChange={handleChange} size="small" />
                </div>
              </section>

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
                          checked={safeCuisines.includes(item)} 
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

            {/* RIGHT COLUMN: Operational Map & Settings */}
            <div className="space-y-8">
              <section>
                <div className="flex items-center gap-2 text-gray-400 font-black text-[11px] uppercase tracking-[2px] mb-6">
                   Global Logistics & Service Radius
                </div>
                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormControl fullWidth size="small">
                      <InputLabel>Operational City</InputLabel>
                      <Select 
                        label="Operational City" 
                        name="city" 
                        value={data.city || (typeof cities[0] === 'object' ? cities[0]?.name : cities[0]) || "Sohna"} 
                        onChange={handleChange}
                      >
                        {data.city && !cities.some(c => (typeof c === 'object' ? c.name : c) === data.city) && (
                          <MenuItem value={data.city}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                              <span className="font-medium text-gray-800">{data.city}</span>
                            </Box>
                          </MenuItem>
                        )}
                        {cities && cities.map((cityItem, idx) => {
                          const cityName = typeof cityItem === 'object' ? cityItem.name : cityItem;
                          const isAvailable = typeof cityItem === 'object' ? (cityItem.isServiceAvailable || cityItem.hasService) : false;
                          return (
                            <MenuItem key={cityItem._id || idx} value={cityName}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                                <span className="font-medium text-gray-800">{cityName}</span>
                                {isAvailable ? (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full border border-emerald-300 flex items-center gap-1">
                                    📍 Services Available
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded-full border border-gray-200">
                                    Haryana City
                                  </span>
                                )}
                              </Box>
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                    <TextField fullWidth label="Zone Area" name="area" value={data.area || ""} onChange={handleChange} size="small" />
                  </div>
                  <TextField fullWidth label="Full Physical Address" name="address" value={data.address || ""} onChange={handleChange} size="small" multiline rows={2} />
                  
                  {/* Coordinates & Custom Manual Location Input */}
                  <div className="grid grid-cols-2 gap-4">
                    <TextField
                      fullWidth
                      label="Latitude (°N)"
                      name="latitude"
                      value={currentLat}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleChange({ target: { name: "latitude", value: val } });
                        handleChange({ target: { name: "location", value: { type: "Point", coordinates: [Number(currentLng), Number(val) || 0] } } });
                      }}
                      size="small"
                    />
                    <TextField
                      fullWidth
                      label="Longitude (°E)"
                      name="longitude"
                      value={currentLng}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleChange({ target: { name: "longitude", value: val } });
                        handleChange({ target: { name: "location", value: { type: "Point", coordinates: [Number(val) || 0, Number(currentLat)] } } });
                      }}
                      size="small"
                    />
                  </div>

                  {/* Service Delivery Geofence Radius */}
                  <Box className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <div className="flex justify-between items-center mb-2">
                      <Typography className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                        📍 Service Area Delivery Radius
                      </Typography>
                      <Typography className="text-sm font-extrabold text-[#00a67e]">
                        {currentRadius} KM
                      </Typography>
                    </div>
                    <Slider
                      value={currentRadius}
                      min={1}
                      max={50}
                      step={1}
                      onChange={(e, val) => handleChange({ target: { name: "geofenceRadius", value: val } })}
                      sx={{ color: '#00a67e' }}
                    />
                    <Typography className="text-[11px] text-gray-500 font-medium">
                      Drag slider to expand or reduce the delivery radius circle on the map.
                    </Typography>
                  </Box>
                </div>
              </section>

              {/* REAL GOOGLE MAP CONTAINER WITH SEARCH & AUTO DETECT */}
              <Box className="rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md">
                <Typography className="p-2.5 bg-emerald-700 text-white text-xs font-bold flex items-center gap-2">
                  <MapPin size={16} /> Drag Marker or Search to Pin Exact Restaurant Coordinates
                </Typography>
                <Box className="p-3 bg-white">
                  <GoogleServiceAreaMap
                    lat={currentLat}
                    lng={currentLng}
                    radiusKm={currentRadius}
                    onLocationSelect={handleMapLocationSelect}
                  />
                </Box>
              </Box>
            </div>
          </form>

          {/* Menu Master & Quick Add Banner */}
          <div className="mx-8 mb-6 p-6 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-emerald-900 flex items-center gap-2">
                🍔 Menu Master & Bulk Menu Upload
              </h3>
              <p className="text-xs text-emerald-700 font-medium mt-1">
                Add, edit, bulk import or manage pre-approved menu items for this restaurant.
              </p>
            </div>
            <Button
              variant="contained"
              onClick={() => navigate(`/edit-restaurant-menu/${id}`)}
              sx={{
                backgroundColor: "#00a67e",
                color: "#ffffff",
                fontWeight: "bold",
                textTransform: "none",
                borderRadius: "10px",
                px: 4,
                py: 1.5,
                fontSize: "14px",
                "&:hover": { backgroundColor: "#008f6d" }
              }}
            >
              Open Full Menu Manager
            </Button>
          </div>

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