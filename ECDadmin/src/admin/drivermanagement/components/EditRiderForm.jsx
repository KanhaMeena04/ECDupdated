// import React from "react";
// import {
//   TextField,
//   Button,
//   Grid,
//   Typography,
//   MenuItem,
//   Divider,
//   Avatar,
//   Card,
//   CardContent,
// } from "@mui/material";
// import {
//   Person,
//   DirectionsBike,
// } from "@mui/icons-material";

// import { useRestaurantNameList } from "../../api/restaurant";
// import { useCities } from "../../api/city";
// import { useZones } from "../../api/zone";

// const EditRiderForm = ({
//   formData,
//   handleChange,
//   handleNestedChange,
//   nextStep,
//   isEdit,
// }) => {
//   const { restaurants = [], loading: rLoading }=useRestaurantNameList();
//   const { cities = [], loading: cLoading } = useCities();
//   const { zones = [], loading: zLoading } = useZones();

//   if (!formData) return null;

//   return (
//     <div className="min-h-screen bg-gray-50 p-6 md:p-10">
//       <div className="max-w-6xl mx-auto">

//         <header className="mb-8">
//           <Typography variant="h4" className="font-bold text-slate-800">
//             Edit Rider
//           </Typography>
//           <Typography variant="body1" className="text-slate-500">
//             Update rider account and work assignment.
//           </Typography>
//         </header>

//         <form
//           onSubmit={(e) => {
//             e.preventDefault();
//             nextStep();
//           }}
//         >
//           <Grid container spacing={4}>

//             {/* ================= LEFT ================= */}
//             <Grid item xs={12} md={7}>
//               <Card className="h-full">
//                 <CardContent className="p-6">
//                   <div className="flex items-center gap-2 mb-4">
//                     <Person className="text-blue-500" />
//                     <Typography variant="h6">
//                       Account Information
//                     </Typography>
//                   </div>

//                   <Grid container spacing={3}>
//                     <Grid item xs={12} className="flex justify-center">
//                       <Avatar
//                         src={formData.profilePic || ""}
//                         sx={{ width: 80, height: 80 }}
//                       />
//                     </Grid>

//                     <Grid item xs={12} md={6}>
//                       <TextField
//                         fullWidth
//                         label="Full Name"
//                         name="name"
//                         value={formData.name || ""}
//                         onChange={handleChange}
//                         required
//                       />
//                     </Grid>

//                     <Grid item xs={12} md={6}>
//                       <TextField
//                         fullWidth
//                         label="Email Address"
//                         name="email"
//                         value={formData.email || ""}
//                         onChange={handleChange}
//                         required
//                       />
//                     </Grid>

//                     <Grid item xs={12} md={6}>
//                       <TextField
//                         fullWidth
//                         label="Mobile Number"
//                         name="mobile"
//                         value={formData.mobile || ""}
//                         onChange={handleChange}
//                         required
//                       />
//                     </Grid>

//                     {/* Password intentionally removed in edit */}

//                     <Grid item xs={12}>
//                       <TextField
//                         fullWidth
//                         label="Permanent Address"
//                         name="address"
//                         multiline
//                         rows={2}
//                         value={formData.address || ""}
//                         onChange={handleChange}
//                       />
//                     </Grid>
//                   </Grid>
//                 </CardContent>
//               </Card>
//             </Grid>

//             {/* ================= RIGHT ================= */}
//             <Grid item xs={12} md={5}>
//               <Card className="h-full">
//                 <CardContent className="p-6">
//                   <div className="flex items-center gap-2 mb-4">
//                     <DirectionsBike className="text-orange-500" />
//                     <Typography variant="h6">
//                       Work Assignment
//                     </Typography>
//                   </div>

//                   <div className="space-y-4">

//                     {/* RESTAURANT */}
//                     <TextField
//                       select
//                       fullWidth
//                       label="Restaurant"
//                       name="restaurant"
//                       value={formData.restaurant || ""}
//                       onChange={handleChange}
//                       disabled={rLoading}
//                     >
//                       {restaurants?.map((r) => (
//                         <MenuItem key={r._id} value={r._id}>
//                           {r.name}
//                         </MenuItem>
//                       ))}
//                     </TextField>

//                     {/* CITY */}
//                     <TextField
//                       select
//                       fullWidth
//                       label="Working City"
//                       name="workCity"
//                       value={formData.workCity || ""}
//                       onChange={handleChange}
//                       disabled={cLoading}
//                     >
//                       {cities?.map((city) => (
//                         <MenuItem key={city._id} value={city._id}>
//                           {city.name}
//                         </MenuItem>
//                       ))}
//                     </TextField>

//                     {/* ZONE */}
//                     <TextField
//                       select
//                       fullWidth
//                       label="Assigned Zone"
//                       name="workZone"
//                       value={formData.workZone || ""}
//                       onChange={handleChange}
//                       disabled={zLoading}
//                     >
//                       {zones?.map((zone) => (
//                         <MenuItem key={zone._id} value={zone._id}>
//                           {zone?.name}
//                         </MenuItem>
//                       ))}
//                     </TextField>

//                     <Divider>Vehicle Details</Divider>

//                     {/* VEHICLE TYPE */}
//                     <TextField
//                       select
//                       fullWidth
//                       label="Vehicle Type"
//                       value={formData.vehicle?.type || "bike"}
//                       onChange={(e) =>
//                         handleNestedChange(
//                           "vehicle",
//                           "type",
//                           e.target.value
//                         )
//                       }
//                     >
//                       <MenuItem value="bike">Bike / Scooter</MenuItem>
//                       <MenuItem value="cycle">Bicycle</MenuItem>
//                       <MenuItem value="car">Car</MenuItem>
//                     </TextField>

//                     {/* VEHICLE MODEL */}
//                     <TextField
//                       fullWidth
//                       label="Vehicle Model"
//                       value={formData.vehicle?.model || ""}
//                       onChange={(e) =>
//                         handleNestedChange(
//                           "vehicle",
//                           "model",
//                           e.target.value
//                         )
//                       }
//                     />

//                     {/* VEHICLE NUMBER */}
//                     <TextField
//                       fullWidth
//                       label="Vehicle Number"
//                       value={formData.vehicle?.number || ""}
//                       onChange={(e) =>
//                         handleNestedChange(
//                           "vehicle",
//                           "number",
//                           e.target.value
//                         )
//                       }
//                     />
//                   </div>
//                 </CardContent>
//               </Card>
//             </Grid>

//             {/* ================= ACTION ================= */}
//             <Grid item xs={12} className="flex justify-end">
//               <Button
//                 type="submit"
//                 variant="contained"
//                 className="bg-slate-900 hover:bg-black px-12 py-3 rounded-lg"
//               >
//                 Next
//               </Button>
//             </Grid>

//           </Grid>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default EditRiderForm;

import React from "react";
import {
  TextField,
  Button,
  Grid,
  Typography,
  MenuItem,
  Divider,
  Avatar,
  Card,
  CardContent,
  Box
} from "@mui/material";
import { Person, DirectionsBike } from "@mui/icons-material";

import { useRestaurantNameList } from "../../api/restaurant";
import { useCities } from "../../api/city";
import { useZones } from "../../api/zone";

// BRAND CONSTANTS
const BRAND_MAIN = "#ed2026";
const BRAND_BG_LIGHT = "#FFF5F2";

const EditRiderForm = ({
  formData,
  handleChange,
  handleNestedChange,
  nextStep,
}) => {
  const { restaurants = [], loading: rLoading, error: rError } = useRestaurantNameList();
  const { cities = [], loading: cLoading, error: cError } = useCities();
  const { zones = [], loading: zLoading, error: zError } = useZones();

  if (!formData) return null;

  // Custom SX for TextFields to match brand
  const fieldSx = {
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: BRAND_MAIN },
    "& .MuiInputLabel-root.Mui-focused": { color: BRAND_MAIN },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-l-4 pl-4" style={{ borderColor: BRAND_MAIN }}>
          <Typography variant="h4" fontWeight={900} sx={{ color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: -0.5 }}>
            Edit Rider
          </Typography>
          <Typography variant="body1" className="text-slate-500">
            Update rider account and work assignment details.
          </Typography>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            nextStep();
          }}
        >
          <Grid container spacing={4}>
            {/* ================= LEFT: Account Info ================= */}
            <Grid item xs={12} md={7}>
              <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Box sx={{ p: 1, borderRadius: 1, backgroundColor: BRAND_BG_LIGHT }}>
                       <Person sx={{ color: BRAND_MAIN }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      Account Information
                    </Typography>
                  </div>

                  <Grid container spacing={3}>
                    <Grid item xs={12} className="flex justify-center mb-4">
                      <Avatar
                        src={formData.profilePic || ""}
                        sx={{ 
                          width: 100, 
                          height: 100, 
                          border: `3px solid ${BRAND_BG_LIGHT}`,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        name="name"
                        value={formData.name || ""}
                        onChange={handleChange}
                        required
                        sx={fieldSx}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        required
                        sx={fieldSx}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Mobile Number"
                        name="mobile"
                        value={formData.mobile || ""}
                        onChange={handleChange}
                        required
                        sx={fieldSx}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Permanent Address"
                        name="address"
                        multiline
                        rows={2}
                        value={formData.address || ""}
                        onChange={handleChange}
                        sx={fieldSx}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* ================= RIGHT: Work Assignment ================= */}
            <Grid item xs={12} md={5}>
              <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Box sx={{ p: 1, borderRadius: 1, backgroundColor: BRAND_BG_LIGHT }}>
                      <DirectionsBike sx={{ color: BRAND_MAIN }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      Work Assignment
                    </Typography>
                  </div>

                  <div className="space-y-5">
                    <TextField
                      select
                      fullWidth
                      label="Restaurant"
                      name="restaurant"
                      value={formData.restaurant || ""}
                      onChange={handleChange}
                      disabled={rLoading}
                      error={!!rError}
                      helperText={rError || ""}
                      sx={fieldSx}
                    >
                      {restaurants.map((r) => (
                        <MenuItem key={r._id} value={r._id}>
                          {r.name}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      fullWidth
                      label="Working City"
                      name="workCity"
                      value={formData.workCity || ""}
                      onChange={handleChange}
                      disabled={cLoading}
                      error={!!cError}
                      helperText={cError || ""}
                      sx={fieldSx}
                    >
                      {cities.map((city) => (
                        <MenuItem key={city._id} value={city._id}>
                          {city.name}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      fullWidth
                      label="Assigned Zone"
                      name="workZone"
                      value={formData.workZone || ""}
                      onChange={handleChange}
                      disabled={zLoading}
                      error={!!zError}
                      sx={fieldSx}
                      helperText={zError || (zones.length === 0 ? "No zones available" : "")}
                    >
                      {zones.map((zone) => (
                        <MenuItem key={zone._id} value={zone._id}>
                          {zone.name}
                        </MenuItem>
                      ))}
                    </TextField>

                    <Divider sx={{ my: 2 }}>
                       <Typography variant="caption" fontWeight={800} color="textSecondary" sx={{ px: 1, letterSpacing: 1 }}>
                          VEHICLE DETAILS
                       </Typography>
                    </Divider>

                    <TextField
                      select
                      fullWidth
                      label="Vehicle Type"
                      value={formData.vehicle?.type || "bike"}
                      onChange={(e) => handleNestedChange("vehicle", "type", e.target.value)}
                      sx={fieldSx}
                    >
                      <MenuItem value="bike">Bike / Scooter</MenuItem>
                      <MenuItem value="cycle">Bicycle</MenuItem>
                      <MenuItem value="car">Car</MenuItem>
                    </TextField>

                    <TextField
                      fullWidth
                      label="Vehicle Model"
                      placeholder="e.g. Honda Activa"
                      value={formData.vehicle?.model || ""}
                      onChange={(e) => handleNestedChange("vehicle", "model", e.target.value)}
                      sx={fieldSx}
                    />

                    <TextField
                      fullWidth
                      label="Vehicle Number"
                      placeholder="e.g. AB 12 CD 3456"
                      value={formData.vehicle?.number || ""}
                      onChange={(e) => handleNestedChange("vehicle", "number", e.target.value)}
                      sx={fieldSx}
                    />
                  </div>
                </CardContent>
              </Card>
            </Grid>

           {/* ================= ACTION BUTTON ================= */}
<Grid item xs={12} className="mt-8">
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' }, 
      justifyContent: 'flex-end',
      gap: 2,
      pt: 3,
      borderTop: '1px solid #e2e8f0'
    }}
  >
    {/* Optional: Add a "Cancel" or "Back" button if needed */}
    <Button
      variant="text"
      onClick={() => window.history.back()}
      sx={{ 
        color: 'gray', 
        px: 4, 
        fontWeight: 'bold',
        order: { xs: 2, sm: 1 } // Appears below Next on mobile
      }}
    >
      Cancel
    </Button>

    <Button
      type="submit"
      variant="contained"
      fullWidth={false} // We handle width via SX below
      sx={{
        backgroundColor: BRAND_MAIN,
        '&:hover': { 
          backgroundColor: '#c41a1f',
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 20px rgba(237, 32, 38, 0.3)'
        },
        transition: 'all 0.2s ease-in-out',
        px: { xs: 4, sm: 10 }, // Wider on desktop
        py: { xs: 2, sm: 1.5 }, // Taller on mobile for easy tapping
        width: { xs: '100%', sm: 'auto' }, // Full width only on mobile
        borderRadius: 2,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontSize: '0.95rem',
        order: { xs: 1, sm: 2 }
      }}
    >
      Next Step
    </Button>
  </Box>
</Grid>
          </Grid>
        </form>
      </div>
    </div>
  );
};

export default EditRiderForm;