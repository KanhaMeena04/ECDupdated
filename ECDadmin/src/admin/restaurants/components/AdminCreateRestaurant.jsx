import React from "react";
import {
  TextField,
  Button,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Box,
  Typography,
  Paper,
  Divider,
  InputAdornment,
} from "@mui/material";
// Icons for professional look
import {
  PersonOutline,
  Storefront,
  LocationOn,
  SettingsSuggest,
  AccountBalanceWallet,
  Schedule,
  Description,
} from "@mui/icons-material";
import { useAdminCreateRestaurantForm } from "../../api/restaurant";

// BRAND CONSTANTS
const BRAND_MAIN = "#ed2026";
const BRAND_BG_LIGHT = "#FFF5F2";

const brandButtonStyle = { 
  backgroundColor: BRAND_MAIN, 
  color: "#fff",
  padding: "12px",
  fontWeight: "bold",
  fontSize: "1rem",
  borderRadius: "8px",
  textTransform: "none",
  boxShadow: "0 4px 14px 0 rgba(237, 32, 38, 0.39)",
  "&:hover": {
    backgroundColor: "#c41a1f",
    boxShadow: "0 6px 20px rgba(237, 32, 38, 0.23)",
  },
  "&:disabled": {
    backgroundColor: "#f5a5a7",
  }
};

const FormSection = ({ title, icon: Icon, children }) => (
  <Paper 
    variant="outlined" 
    sx={{ 
      p: 3, 
      mb: 4, 
      borderRadius: 3, 
      borderColor: "#f0f0f0",
      backgroundColor: "#ffffff",
      transition: "0.3s",
      "&:hover": { borderColor: BRAND_MAIN } 
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
      <Box sx={{ 
        bgcolor: BRAND_BG_LIGHT, 
        p: 1, 
        borderRadius: 2, 
        mr: 2, 
        display: "flex" 
      }}>
        <Icon sx={{ color: BRAND_MAIN, fontSize: "1.8rem" }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 800, color: "#222", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {title}
      </Typography>
    </Box>
    <Grid container spacing={3}>
      {children}
    </Grid>
  </Paper>
);

const AdminCreateRestaurantForm = () => {
  const {
    formData,
    setFormData,
    loading,
    handleChange,
    handleSubmit,
  } = useAdminCreateRestaurantForm();

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        maxWidth: 1100, 
        margin: "40px auto", 
        px: { xs: 2, md: 0 },
        backgroundColor: "#fafafa",
        minHeight: "100vh",
        pb: 10
      }}
    >
      <Box sx={{ mb: 5, borderLeft: `6px solid ${BRAND_MAIN}`, pl: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: "#333" }}>
          Create New Restaurant
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Register a new partner on the platform
        </Typography>
      </Box>

      {/* 1. OWNER INFO */}
      <FormSection title="Owner Information" icon={PersonOutline}>
        <Grid item xs={12} md={6}>
          <TextField label="Owner Name" name="ownerName" fullWidth onChange={handleChange} value={formData.ownerName || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Owner Email" name="ownerEmail" fullWidth onChange={handleChange} value={formData.ownerEmail || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Owner Mobile" name="ownerMobile" fullWidth onChange={handleChange} value={formData.ownerMobile || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Password" type="password" name="ownerPassword" fullWidth onChange={handleChange} value={formData.ownerPassword || ""} />
        </Grid>
      </FormSection>

      {/* 2. RESTAURANT INFO */}
      <FormSection title="Restaurant Details" icon={Storefront}>
        <Grid item xs={12} md={6}>
          <TextField label="Restaurant Name (EN)" name="name.en" fullWidth onChange={handleChange} value={formData.name?.en || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Restaurant Name (DE)" name="name.de" fullWidth onChange={handleChange} value={formData.name?.de || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Description (EN)" name="description.en" fullWidth multiline rows={2} onChange={handleChange} value={formData.description?.en || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Description (DE)" name="description.de" fullWidth multiline rows={2} onChange={handleChange} value={formData.description?.de || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Brand" name="brand" fullWidth onChange={handleChange} value={formData.brand || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField 
            label="Cuisine" 
            placeholder="Separate with commas"
            fullWidth 
            onChange={(e) => setFormData(prev => ({ ...prev, cuisine: e.target.value.split(",").map(c => c.trim()) }))}
            value={Array.isArray(formData.cuisine) ? formData.cuisine.join(", ") : ""} 
          />
        </Grid>
      </FormSection>

      {/* 3. CONTACT & LOCATION */}
      <FormSection title="Contact & Location" icon={LocationOn}>
        <Grid item xs={12} md={6}>
          <TextField label="Business Email" name="email" fullWidth onChange={handleChange} value={formData.email || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Contact Number" name="contactNumber" fullWidth onChange={handleChange} value={formData.contactNumber || ""} />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Full Address" name="address" fullWidth onChange={handleChange} value={formData.address || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="City" name="city" fullWidth onChange={handleChange} value={formData.city || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Area" name="area" fullWidth onChange={handleChange} value={formData.area || ""} />
        </Grid>
      </FormSection>

      {/* 4. SETTINGS */}
      <FormSection title="Service Settings" icon={SettingsSuggest}>
        <Grid item xs={12} md={4}>
          <TextField label="Delivery Time" name="deliveryTime" type="number" fullWidth InputProps={{ endAdornment: <InputAdornment position="end">Mins</InputAdornment> }} onChange={handleChange} value={formData.deliveryTime || ""} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField label="Geofence Radius" name="geofenceRadius" type="number" fullWidth InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }} onChange={handleChange} value={formData.geofenceRadius || ""} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField label="Packaging Charge" name="packagingCharge" type="number" fullWidth onChange={handleChange} value={formData.packagingCharge || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField select label="Delivery Type" name="deliveryType" fullWidth value={formData.deliveryType || ""} onChange={handleChange}>
            <MenuItem value="Dining">Online Dining</MenuItem>
            <MenuItem value="Pickup">Pickup</MenuItem>
            <MenuItem value="Home Delivery">Home Delivery</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField select label="Payment Method" name="paymentMethods" fullWidth value={formData.paymentMethods || ""} onChange={handleChange}>
            <MenuItem value="COD">COD</MenuItem>
            <MenuItem value="ONLINE">ONLINE</MenuItem>
            <MenuItem value="Both">Both</MenuItem>
          </TextField>
        </Grid>
      </FormSection>

      {/* 5. BANK DETAILS */}
      <FormSection title="Bank Details" icon={AccountBalanceWallet}>
        <Grid item xs={12} md={6}>
          <TextField label="Account Holder" name="bankDetails.accountName" fullWidth onChange={handleChange} value={formData.bankDetails?.accountName || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Account Number" name="bankDetails.accountNumber" fullWidth onChange={handleChange} value={formData.bankDetails?.accountNumber || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="Bank Name" name="bankDetails.bankName" fullWidth onChange={handleChange} value={formData.bankDetails?.bankName || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField label="IFSC Code / Routing" name="bankDetails.swiftCode" fullWidth onChange={handleChange} value={formData.bankDetails?.swiftCode || ""} />
        </Grid>
      </FormSection>

      {/* 6. TIMINGS & STATUS */}
      <FormSection title="Timings & Status" icon={Schedule}>
        <Grid item xs={12} md={6}>
          <TextField type="time" label="Open Time" name="timing.monday.open" fullWidth InputLabelProps={{ shrink: true }} onChange={handleChange} value={formData.timing?.monday?.open || ""} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField type="time" label="Close Time" name="timing.monday.close" fullWidth InputLabelProps={{ shrink: true }} onChange={handleChange} value={formData.timing?.monday?.close || ""} />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <FormControlLabel 
              control={<Checkbox 
                sx={{ color: BRAND_MAIN, '&.Mui-checked': { color: BRAND_MAIN } }}
                checked={formData.isFreeDelivery || false} 
                onChange={(e) => setFormData(prev => ({ ...prev, isFreeDelivery: e.target.checked }))} 
              />} 
              label="Free Delivery" 
            />
            <FormControlLabel 
              control={<Checkbox 
                sx={{ color: BRAND_MAIN, '&.Mui-checked': { color: BRAND_MAIN } }}
                checked={formData.isTemporarilyClosed || false} 
                onChange={(e) => setFormData(prev => ({ ...prev, isTemporarilyClosed: e.target.checked }))} 
              />} 
              label="Temporarily Closed" 
            />
          </Box>
        </Grid>
      </FormSection>

      {/* 7. DOCUMENTS */}
      <FormSection title="Legal Documents" icon={Description}>
        {["license", "pan", "gst"].map((doc) => (
          <Grid item xs={12} md={4} key={doc}>
            <Box sx={{ p: 2, border: "2px dashed #eee", borderRadius: 3, textAlign: "center", bgcolor: "#fff", transition: "0.3s", "&:hover": { bgcolor: BRAND_BG_LIGHT, borderColor: BRAND_MAIN } }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800, color: "#555" }}>{doc.toUpperCase()}</Typography>
              <Button 
                variant="outlined" 
                component="label" 
                fullWidth 
                size="small" 
                sx={{ 
                  color: BRAND_MAIN, 
                  borderColor: BRAND_MAIN, 
                  mb: 1,
                  fontWeight: 'bold',
                  "&:hover": { borderColor: "#c41a1f", bgcolor: BRAND_BG_LIGHT }
                }}
              >
                Upload File
                <input type="file" hidden accept=".pdf,.jpg,.png" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) setFormData(prev => ({ ...prev, documents: { ...prev.documents, [doc]: { ...prev.documents?.[doc], file } } }));
                }} />
              </Button>
              {formData.documents?.[doc]?.file && <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }} display="block">✓ {formData.documents[doc].file.name}</Typography>}
              {["pan", "gst"].includes(doc) && (
                <TextField label="ID Number" name={`documents.${doc}.number`} fullWidth size="small" sx={{ mt: 1 }} onChange={handleChange} value={formData.documents?.[doc]?.number || ""} />
              )}
            </Box>
          </Grid>
        ))}
      </FormSection>

      {/* SUBMIT BUTTON */}
      <Box sx={{ mt: 6 }}>
        <Button 
          type="submit" 
          variant="contained" 
          fullWidth 
          disabled={loading}
          sx={brandButtonStyle}
        >
          {loading ? "Registering Restaurant..." : "Register Restaurant"}
        </Button>
      </Box>

    </Box>
  );
};

export default AdminCreateRestaurantForm;








// import React from "react";
// import {
//   TextField,
//   Button,
//   MenuItem,
//   Checkbox,
//   FormControlLabel,
//   Grid,
//   Box,
//   Typography,
// } from "@mui/material";
// import { useAdminCreateRestaurantForm } from "../../api/restaurant";

// const tealButtonStyle = { backgroundColor: "#008080", color: "#fff" };

// const AdminCreateRestaurantForm = () => {
//   const {
//     formData,
//     setFormData,
//     loading,
//     handleChange,
//     handleSubmit,
//   } = useAdminCreateRestaurantForm();

//   // Safe helper for nested values
//   const safeValue = (path, fallback = "") => {
//     return path?.reduce((acc, key) => (acc && acc[key] ? acc[key] : undefined), formData) ?? fallback;
//   };

//   return (
//     <Box component="form" onSubmit={handleSubmit} p={3} sx={{ maxWidth: 1200, margin: "auto" }}>
//       <Grid container spacing={2}>

//         {/* OWNER INFO */}
//         <Typography variant="h6" gutterBottom>Owner Info</Typography>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="Owner Name"
//             name="ownerName"
//             fullWidth
//             onChange={handleChange}
//             value={formData.ownerName || ""}
//           />
//         </Grid>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="Owner Email"
//             name="ownerEmail"
//             fullWidth
//             onChange={handleChange}
//             value={formData.ownerEmail || ""}
//           />
//         </Grid>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="Owner Mobile"
//             name="ownerMobile"
//             fullWidth
//             onChange={handleChange}
//             value={formData.ownerMobile || ""}
//           />
//         </Grid>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="Password"
//             type="password"
//             name="ownerPassword"
//             fullWidth
//             onChange={handleChange}
//             value={formData.ownerPassword || ""}
//           />
//         </Grid>

//         {/* RESTAURANT INFO */}
//         <Typography variant="h6" gutterBottom>Restaurant Info</Typography>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="Restaurant Name (EN)"
//             name="name.en"
//             fullWidth
//             onChange={handleChange}
//             value={formData.name?.en || ""}
//           />
//         </Grid>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="Restaurant Name (DE)"
//             name="name.de"
//             fullWidth
//             onChange={handleChange}
//             value={formData.name?.de || ""}
//           />
//         </Grid>
//         <Grid item xs={12}>
//           <TextField
//             label="Description (EN)"
//             name="description.en"
//             fullWidth
//             onChange={handleChange}
//             value={formData.description?.en || ""}
//           />
//         </Grid>
//         <Grid item xs={12}>
//           <TextField
//             label="Description (DE)"
//             name="description.de"
//             fullWidth
//             onChange={handleChange}
//             value={formData.description?.de || ""}
//           />
//         </Grid>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="Brand"
//             name="brand"
//             fullWidth
//             onChange={handleChange}
//             value={formData.brand || ""}
//           />
//         </Grid>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="Cuisine (comma separated)"
//             name="cuisine"
//             fullWidth
//             onChange={(e) =>
//               setFormData((prev) => ({
//                 ...prev,
//                 cuisine: e.target.value ? e.target.value.split(",").map((c) => c.trim()) : [],
//               }))
//             }
//             value={Array.isArray(formData.cuisine) ? formData.cuisine.join(", ") : ""}
//           />
//         </Grid>

//         {/* CONTACT & LOCATION */}
//         <Typography variant="h6" gutterBottom>Contact & Location</Typography>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="Email"
//             name="email"
//             fullWidth
//             onChange={handleChange}
//             value={formData.email || ""}
//           />
//         </Grid>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="Contact Number"
//             name="contactNumber"
//             fullWidth
//             onChange={handleChange}
//             value={formData.contactNumber || ""}
//           />
//         </Grid>
//         <Grid item xs={12}>
//           <TextField
//             label="Address"
//             name="address"
//             fullWidth
//             onChange={handleChange}
//             value={formData.address || ""}
//           />
//         </Grid>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="City"
//             name="city"
//             fullWidth
//             onChange={handleChange}
//             value={formData.city || ""}
//           />
//         </Grid>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="Area"
//             name="area"
//             fullWidth
//             onChange={handleChange}
//             value={formData.area || ""}
//           />
//         </Grid>

//         {/* SETTINGS */}
//         <Typography variant="h6" gutterBottom>Settings</Typography>
//         <Grid item xs={12} md={4}>
//           <TextField
//             label="Delivery Time (Mins)"
//             name="deliveryTime"
//             type="number"
//             fullWidth
//             onChange={handleChange}
//             value={formData.deliveryTime || ""}
//           />
//         </Grid>
//         <Grid item xs={12} md={4}>
//           <TextField
//             label="Geofence Radius (km)"
//             name="geofenceRadius"
//             type="number"
//             fullWidth
//             onChange={handleChange}
//             value={formData.geofenceRadius || ""}
//           />
//         </Grid>
//         <Grid item xs={12} md={4}>
//           <TextField
//             label="Packaging Charge"
//             name="packagingCharge"
//             type="number"
//             fullWidth
//             onChange={handleChange}
//             value={formData.packagingCharge || ""}
//           />
//         </Grid>

//         <Grid item xs={12} md={6}>
//           <TextField
//             select
//             label="Delivery Type"
//             name="deliveryType"
//             fullWidth
//             value={formData.deliveryType || ""}
//             onChange={handleChange}
//           >
//             <MenuItem value="Dining">Online Dining</MenuItem>
//             <MenuItem value="Pickup">Pickup</MenuItem>
//             <MenuItem value="Home Delivery">Home Delivery</MenuItem>
//           </TextField>
//         </Grid>
//         <Grid item xs={12} md={6}>
//           <TextField
//             select
//             label="Payment Method"
//             name="paymentMethods"
//             fullWidth
//             value={formData.paymentMethods || ""}
//             onChange={handleChange}
//           >
//             <MenuItem value="COD">COD</MenuItem>
//             <MenuItem value="ONLINE">ONLINE</MenuItem>
//             <MenuItem value="Both">Both</MenuItem>
//           </TextField>
//         </Grid>

//         {/* BANK DETAILS */}
//         <Typography variant="h6" gutterBottom>Bank Details</Typography>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="Account Holder"
//             name="bankDetails.accountName"
//             fullWidth
//             onChange={handleChange}
//             value={formData.bankDetails?.accountName || ""}
//           />
//         </Grid>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="Account Number"
//             name="bankDetails.accountNumber"
//             fullWidth
//             onChange={handleChange}
//             value={formData.bankDetails?.accountNumber || ""}
//           />
//         </Grid>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="Bank Name"
//             name="bankDetails.bankName"
//             fullWidth
//             onChange={handleChange}
//             value={formData.bankDetails?.bankName || ""}
//           />
//         </Grid>
//         <Grid item xs={12} md={6}>
//           <TextField
//             label="IFSC Code / Routing"
//             name="bankDetails.swiftCode"
//             fullWidth
//             onChange={handleChange}
//             value={formData.bankDetails?.swiftCode || ""}
//           />
//         </Grid>

//         {/* TIMINGS */}
//         <Typography variant="h6" gutterBottom>Timings</Typography>
//         <Grid item xs={12} md={6}>
//           <TextField
//             type="time"
//             label="Open Time"
//             name="timing.monday.open"
//             fullWidth
//             onChange={handleChange}
//             value={formData.timing?.monday?.open || ""}
//           />
//         </Grid>
//         <Grid item xs={12} md={6}>
//           <TextField
//             type="time"
//             label="Close Time"
//             name="timing.monday.close"
//             fullWidth
//             onChange={handleChange}
//             value={formData.timing?.monday?.close || ""}
//           />
//         </Grid>

//         <Grid item xs={12}>
//           <FormControlLabel
//             control={
//               <Checkbox
//                 checked={formData.isFreeDelivery || false}
//                 onChange={(e) => setFormData(prev => ({ ...prev, isFreeDelivery: e.target.checked }))}
//               />
//             }
//             label="Free Delivery"
//           />
//         </Grid>

//         <Grid item xs={12}>
//           <FormControlLabel
//             control={
//               <Checkbox
//                 checked={formData.isTemporarilyClosed || false}
//                 onChange={(e) => setFormData(prev => ({ ...prev, isTemporarilyClosed: e.target.checked }))}
//               />
//             }
//             label="Temporarily Closed"
//           />
//         </Grid>

//         {/* DOCUMENTS */}
//         <Typography variant="h6" gutterBottom>Documents</Typography>

//         {["license", "pan", "gst"].map((doc) => (
//           <Grid item xs={12} md={4} key={doc}>
//             <Button
//               variant="contained"
//               component="label"
//               sx={tealButtonStyle}
//             >
//               Upload {doc.toUpperCase()}
//               <input
//                 type="file"
//                 hidden
//                 accept=".pdf,.jpg,.png"
//                 onChange={(e) => {
//                   const file = e.target.files[0];
//                   if (file) {
//                     setFormData(prev => ({
//                       ...prev,
//                       documents: {
//                         ...prev.documents,
//                         [doc]: { ...prev.documents?.[doc], file },
//                       },
//                     }));
//                   }
//                 }}
//               />
//             </Button>
//             {formData.documents?.[doc]?.file && (
//               <Typography variant="body2" sx={{ mt: 1 }}>
//                 Selected: {formData.documents[doc].file.name}
//               </Typography>
//             )}
//             {["pan", "gst"].includes(doc) && (
//               <TextField
//                 label={`${doc.toUpperCase()} Number`}
//                 name={`documents.${doc}.number`}
//                 fullWidth
//                 onChange={handleChange}
//                 value={formData.documents?.[doc]?.number || ""}
//                 sx={{ mt: 1 }}
//               />
//             )}
//           </Grid>
//         ))}

//         {/* SUBMIT BUTTON */}
//         <Grid item xs={12}>
//           <Button type="submit" variant="contained" sx={tealButtonStyle}>
//             {loading ? "Creating..." : "Create Restaurant"}
//           </Button>
//         </Grid>

//       </Grid>
//     </Box>
//   );
// };

// export default AdminCreateRestaurantForm;
