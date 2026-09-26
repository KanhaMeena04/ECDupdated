import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Storefront,
  PersonOutline,
  LocationOn,
  Collections,
  VerifiedUser,
  AccountBalance,
  Schedule,
  Fastfood,
  CloudUpload,
  Delete,
  AddCircleOutline,
  Lock,
  GpsFixed,
  CheckCircle,
  PhotoCamera,
  InsertDriveFile,
} from "@mui/icons-material";

import { API_BASE_URL } from "../../../utils/utils";
const BRAND_MAIN = "#ed2026";
const BRAND_HOVER = "#c8161b";
const BRAND_LIGHT = "#FFF5F4";

const AddRestaurantForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  // 1. Restaurant Details (Step 1 of App)
  const [name, setName] = useState("");
  const [restaurantType, setRestaurantType] = useState("Both (Veg & Non-Veg)");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState("4.5");
  const [restaurantImages, setRestaurantImages] = useState([]);

  // 2. Owner & PIN (Step 2 of App)
  const [ownerName, setOwnerName] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPin, setOwnerPin] = useState("1234");

  // 3. Location & GPS (Step 3 of App)
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("Subhash Chowk");
  const [city, setCity] = useState("Sohna");
  const [latitude, setLatitude] = useState("28.2478");
  const [longitude, setLongitude] = useState("77.0624");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // 4. KYC Documents (Step 4 of App: FSSAI & GST)
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [fssaiDoc, setFssaiDoc] = useState(null);
  const [gstNumber, setGstNumber] = useState("");
  const [gstDoc, setGstDoc] = useState(null);

  // 5. Bank Account Details (Step 5 of App)
  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("HDFC Bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");

  // 6. Operational Schedule (Step 6 of App)
  const [weeklySchedule, setWeeklySchedule] = useState({
    monday: { open: "09:00 AM", close: "11:00 PM", isClosed: false },
    tuesday: { open: "09:00 AM", close: "11:00 PM", isClosed: false },
    wednesday: { open: "09:00 AM", close: "11:00 PM", isClosed: false },
    thursday: { open: "09:00 AM", close: "11:00 PM", isClosed: false },
    friday: { open: "09:00 AM", close: "11:00 PM", isClosed: false },
    saturday: { open: "Closed", close: "Closed", isClosed: true },
    sunday: { open: "Closed", close: "Closed", isClosed: true },
  });

  // 7. Initial Menu Items (Step 7 of App)
  const [menuItems, setMenuItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Main Course");
  const [newItemFoodType, setNewItemFoodType] = useState("Veg");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemImage, setNewItemImage] = useState(null);

  // File to base64 helper
  const handleFileRead = (file, callback) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => callback(e.target.result);
    reader.readAsDataURL(file);
  };

  // Multiple files to base64 helper
  const handleMultipleFilesRead = (files) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setRestaurantImages((prev) => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Auto Detect GPS Location
  const handleAutoDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLatitude(pos.coords.latitude.toFixed(6));
            setLongitude(pos.coords.longitude.toFixed(6));
            setIsDetectingLocation(false);
          },
          async () => {
            await fetchIpLocation();
          },
          { timeout: 8000 }
        );
      } else {
        await fetchIpLocation();
      }
    } catch {
      fetchIpLocation();
    }
  };

  const fetchIpLocation = async () => {
    try {
      const res = await axios.get("https://ipapi.co/json/").catch(() => null);
      if (res && res.data) {
        setLatitude(String(res.data.latitude || "28.2478"));
        setLongitude(String(res.data.longitude || "77.0624"));
        if (res.data.city) setCity(res.data.city);
        if (res.data.region) setArea(res.data.region);
        if (!address) setAddress(`${res.data.city || "Sohna"}, ${res.data.region || "Haryana"}`);
      } else {
        setLatitude("28.2478");
        setLongitude("77.0624");
      }
    } catch {
      setLatitude("28.2478");
      setLongitude("77.0624");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Add Menu Item
  const handleAddMenuItem = () => {
    if (!newItemName.trim() || !newItemPrice.trim()) {
      alert("Please enter Item Name and Price");
      return;
    }
    const itemObj = {
      name: newItemName.trim(),
      price: Number(newItemPrice.trim()),
      basePrice: Number(newItemPrice.trim()),
      category: newItemCategory,
      foodType: newItemFoodType,
      isVeg: newItemFoodType === "Veg",
      description: newItemDesc.trim(),
      image: newItemImage || "",
    };
    setMenuItems([...menuItems, itemObj]);
    setNewItemName("");
    setNewItemPrice("");
    setNewItemDesc("");
    setNewItemImage(null);
  };

  const handleRemoveMenuItem = (idx) => {
    setMenuItems(menuItems.filter((_, i) => i !== idx));
  };

  const handleToggleDay = (day) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        isClosed: !prev[day].isClosed,
        open: !prev[day].isClosed ? "Closed" : "09:00 AM",
        close: !prev[day].isClosed ? "Closed" : "11:00 PM",
      },
    }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatus({ type: "error", msg: "Please enter Restaurant Trade Name" });
      return;
    }
    const cleanMobile = ownerMobile.replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length < 10) {
      setStatus({ type: "error", msg: "Please enter a valid 10-digit Owner Mobile Number" });
      return;
    }
    const cleanPin = ownerPin.trim();
    if (!cleanPin || cleanPin.length !== 4) {
      setStatus({ type: "error", msg: "Please set a valid 4-digit Login PIN" });
      return;
    }

    setLoading(true);
    setStatus({ type: "", msg: "" });

    const payload = {
      name: { en: name.trim() },
      description: { en: description.trim() },
      restaurantType,
      rating: Number(rating) || 4.5,
      adminRating: Number(rating) || 4.5,
      avgRating: Number(rating) || 4.5,
      cuisine: [restaurantType, "North Indian", "Fast Food"],
      brand: name.trim(),
      ownerName: ownerName.trim() || `${name.trim()} Owner`,
      ownerEmail: ownerEmail.trim() || `vendor_${cleanMobile}@ecdkart.com`,
      ownerMobile: cleanMobile,
      contactNumber: cleanMobile,
      email: ownerEmail.trim() || `vendor_${cleanMobile}@ecdkart.com`,
      ownerPassword: cleanPin,
      ownerPin: cleanPin,
      pin: cleanPin,
      address: address.trim() || `${area}, ${city}`,
      city: city.trim() || "Sohna",
      area: area.trim() || "Subhash Chowk",
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude || "77.0624"), parseFloat(latitude || "28.2478")],
      },
      image: restaurantImages.length > 0 ? restaurantImages[0] : null,
      bannerImage: restaurantImages.length > 0 ? restaurantImages[0] : null,
      restaurantImages: restaurantImages,
      images: restaurantImages,
      documents: {
        license: { number: fssaiNumber.trim(), file: fssaiDoc || "" },
        gst: { number: gstNumber.trim(), file: gstDoc || "" },
      },
      bankDetails: {
        accountHolder: accountHolder.trim() || ownerName.trim(),
        bankName: bankName.trim() || "HDFC Bank",
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
        upiId: upiId.trim(),
      },
      deliveryTime: 30,
      packagingCharge: 0,
      adminCommission: 10,
      paymentMethods: "Both",
      deliveryType: ["Home Delivery", "Pickup"],
      timing: weeklySchedule,
      menu: menuItems,
      menuItems: menuItems,
      restaurantApproved: true,
      isActive: true,
      verificationStatus: "verified",
    };

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let res;
      try {
        res = await axios.post(`${API_BASE_URL}/api/restaurants/admin/create`, payload, {
          headers,
          withCredentials: true,
        });
      } catch (adminErr) {
        console.warn("admin/create endpoint notice:", adminErr?.response?.data || adminErr.message);
        res = await axios.post(`${API_BASE_URL}/api/restaurants/apply`, payload, {
          headers,
          withCredentials: true,
        });
      }

      setStatus({
        type: "success",
        msg: `Restaurant "${name.trim()}" created & verified successfully! Login Phone: +91 ${cleanMobile} | PIN: ${cleanPin}`,
      });

      setTimeout(() => {
        navigate("/restaurants");
      }, 2500);
    } catch (err) {
      console.error("Add restaurant error:", err);
      setStatus({
        type: "error",
        msg: err.response?.data?.message || "Failed to create restaurant. Please check details and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 1000,
        mx: "auto",
        my: 2,
        pb: 10,
        px: { xs: 1.5, sm: 3 },
      }}
    >
      {/* Alert Notice */}
      {status.msg && (
        <Alert
          severity={status.type}
          sx={{
            mb: 3,
            borderRadius: 3,
            fontSize: "0.95rem",
            fontWeight: 600,
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          {status.msg}
        </Alert>
      )}

      {/* SECTION 1: RESTAURANT BASIC DETAILS */}
      <FormSectionCard
        step="1"
        title="Restaurant Details"
        subtitle="Basic profile and trade information as requested during partner registration"
        icon={Storefront}
      >
        <Grid item xs={12} sm={5}>
          <TextField
            label="Restaurant Trade Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            size="medium"
            placeholder="e.g. Shikha ka Dhaba / Royal Rasoi"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="medium">
            <InputLabel>Restaurant Food Type *</InputLabel>
            <Select
              value={restaurantType}
              label="Restaurant Food Type *"
              onChange={(e) => setRestaurantType(e.target.value)}
            >
              <MenuItem value="Both (Veg & Non-Veg)">Both (Veg & Non-Veg)</MenuItem>
              <MenuItem value="Pure Veg">Pure Veg (100% Vegetarian)</MenuItem>
              <MenuItem value="Non-Veg">Non-Veg Specialty</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="Initial Rating (1.0 - 5.0) *"
            type="number"
            inputProps={{ min: 1, max: 5, step: 0.1 }}
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            fullWidth
            required
            size="medium"
            placeholder="4.5"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="About Restaurant / Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2.5}
            placeholder="Describe food specialties, cuisine types, hygiene standards, and dining experience..."
          />
        </Grid>
        <Grid item xs={12}>
          <Box
            sx={{
              p: 2.5,
              border: "1.5px dashed #E2E8F0",
              borderRadius: 3,
              bgcolor: "#FAFAFA",
              textAlign: "center",
              transition: "all 0.2s ease",
              "&:hover": { borderColor: BRAND_MAIN, bgcolor: BRAND_LIGHT },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Collections sx={{ color: BRAND_MAIN, fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700} color="#1E293B">
                  Restaurant Photos ({restaurantImages.length})
                </Typography>
              </Box>
              <Button
                component="label"
                size="small"
                variant="contained"
                startIcon={<PhotoCamera fontSize="small" />}
                sx={{
                  bgcolor: BRAND_MAIN,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2,
                  "&:hover": { bgcolor: BRAND_HOVER },
                }}
              >
                Add Photos
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={(e) => handleMultipleFilesRead(e.target.files)}
                />
              </Button>
            </Box>

            {restaurantImages.length === 0 ? (
              <Typography variant="caption" color="text.secondary" display="block">
                Upload facade, dining area, or kitchen photos (JPEG, PNG).
              </Typography>
            ) : (
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                {restaurantImages.map((img, idx) => (
                  <Grid item xs={4} sm={3} md={2} key={idx}>
                    <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden", border: "1px solid #E2E8F0" }}>
                      <Box component="img" src={img} sx={{ width: "100%", height: 70, objectFit: "cover" }} />
                      <IconButton
                        size="small"
                        onClick={() => setRestaurantImages(restaurantImages.filter((_, i) => i !== idx))}
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          bgcolor: "rgba(0,0,0,0.6)",
                          color: "white",
                          p: 0.4,
                          "&:hover": { bgcolor: "red" },
                        }}
                      >
                        <Delete sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Grid>
      </FormSectionCard>

      {/* SECTION 2: OWNER CREDENTIALS & 4-DIGIT PIN */}
      <FormSectionCard
        step="2"
        title="Owner Profile & 4-Digit Login PIN"
        subtitle="Used by partner to sign in on the Restaurant Partner App (Mobile + PIN or OTP)"
        icon={PersonOutline}
      >
        <Grid item xs={12} sm={6}>
          <TextField
            label="Owner Full Name *"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            fullWidth
            required
            placeholder="e.g. Shikha Sharma"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Owner Mobile Number (10 Digits) *"
            value={ownerMobile}
            onChange={(e) => setOwnerMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            fullWidth
            required
            placeholder="e.g. 9876543210"
            helperText="Primary number used for Restaurant App authentication & OTP"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Owner Email Address"
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            fullWidth
            placeholder="owner@example.com"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="4-Digit Login PIN *"
            value={ownerPin}
            onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            fullWidth
            required
            placeholder="1234"
            InputProps={{
              startAdornment: <Lock sx={{ color: BRAND_MAIN, mr: 1, fontSize: 18 }} />,
            }}
            helperText="Partner can log in immediately using their Mobile Number + this 4-Digit PIN"
          />
        </Grid>
      </FormSectionCard>

      {/* SECTION 3: LOCATION & GPS */}
      <FormSectionCard
        step="3"
        title="Restaurant Location & GPS"
        subtitle="Exact physical address and coordinates for customer ordering & rider dispatch"
        icon={LocationOn}
        actionButton={
          <Button
            size="small"
            variant="outlined"
            startIcon={isDetectingLocation ? <CircularProgress size={14} color="inherit" /> : <GpsFixed fontSize="small" />}
            onClick={handleAutoDetectLocation}
            disabled={isDetectingLocation}
            sx={{
              borderColor: "#CBD5E1",
              color: "#334155",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              "&:hover": { borderColor: BRAND_MAIN, color: BRAND_MAIN, bgcolor: BRAND_LIGHT },
            }}
          >
            {isDetectingLocation ? "Detecting..." : "Auto Detect GPS"}
          </Button>
        }
      >
        <Grid item xs={12}>
          <TextField
            label="Complete Street Address *"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            fullWidth
            required
            placeholder="e.g. Shop No. 12, Main Market Road, Near Clock Tower"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Area / Locality *"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            fullWidth
            required
            placeholder="e.g. Subhash Chowk"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="City *"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            fullWidth
            required
            placeholder="e.g. Sohna / Gurugram"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Latitude (°N)"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            fullWidth
            placeholder="e.g. 28.2478"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Longitude (°E)"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            fullWidth
            placeholder="e.g. 77.0624"
          />
        </Grid>
      </FormSectionCard>

      {/* SECTION 4: FSSAI & GST KYC DOCUMENTS */}
      <FormSectionCard
        step="4"
        title="FSSAI & GST Documents"
        subtitle="Government licenses and regulatory certificates"
        icon={VerifiedUser}
      >
        {/* FSSAI */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="FSSAI Food License Number"
            value={fssaiNumber}
            onChange={(e) => setFssaiNumber(e.target.value)}
            fullWidth
            placeholder="e.g. 10821005000123"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocumentUploadBox
            label="FSSAI Certificate Document"
            file={fssaiDoc}
            onUpload={(fileData) => setFssaiDoc(fileData)}
            onRemove={() => setFssaiDoc(null)}
            onFileRead={handleFileRead}
          />
        </Grid>

        {/* GST */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="GST Registration Number"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            fullWidth
            placeholder="e.g. 06ABCDE1234F1Z5"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DocumentUploadBox
            label="GST Certificate Document"
            file={gstDoc}
            onUpload={(fileData) => setGstDoc(fileData)}
            onRemove={() => setGstDoc(null)}
            onFileRead={handleFileRead}
          />
        </Grid>
      </FormSectionCard>

      {/* SECTION 5: BANK DETAILS */}
      <FormSectionCard
        step="5"
        title="Bank Account & Payouts"
        subtitle="Settlement bank account details for order payouts"
        icon={AccountBalance}
      >
        <Grid item xs={12} sm={6}>
          <TextField
            label="Account Holder Name"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            fullWidth
            placeholder="As per Bank Passbook"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Bank Name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            fullWidth
            placeholder="e.g. HDFC Bank, SBI, ICICI"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Account Number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            fullWidth
            placeholder="e.g. 50100234567890"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="IFSC Code"
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value)}
            fullWidth
            placeholder="e.g. HDFC0001234"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="UPI ID / VPA (Optional)"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            fullWidth
            placeholder="e.g. shikhafoods@okaxis"
          />
        </Grid>
      </FormSectionCard>

      {/* SECTION 6: OPERATIONAL TIMINGS */}
      <FormSectionCard
        step="6"
        title="Weekly Operating Timings"
        subtitle="Working days and opening / closing schedule"
        icon={Schedule}
      >
        <Grid item xs={12}>
          <Box sx={{ border: "1px solid #E2E8F0", borderRadius: 2.5, overflow: "hidden" }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Day</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Opening Time</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Closing Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(weeklySchedule).map((dayKey) => {
                  const schedule = weeklySchedule[dayKey];
                  const dayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
                  return (
                    <TableRow key={dayKey} hover>
                      <TableCell sx={{ fontWeight: 600, color: "#1E293B" }}>{dayName}</TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={!schedule.isClosed}
                              onChange={() => handleToggleDay(dayKey)}
                              sx={{
                                "& .MuiSwitch-switchBase.Mui-checked": { color: BRAND_MAIN },
                                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: BRAND_MAIN },
                              }}
                            />
                          }
                          label={
                            <Typography variant="caption" fontWeight={600} color={!schedule.isClosed ? "success.main" : "text.secondary"}>
                              {!schedule.isClosed ? "Open" : "Closed"}
                            </Typography>
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={schedule.isClosed ? "text.secondary" : "text.primary"}>
                          {schedule.open}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={schedule.isClosed ? "text.secondary" : "text.primary"}>
                          {schedule.close}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Grid>
      </FormSectionCard>

      {/* SECTION 7: INITIAL MENU ITEMS */}
      <FormSectionCard
        step="7"
        title="Initial Menu Items (Optional)"
        subtitle="Add starter dishes to show immediately on the restaurant menu"
        icon={Fastfood}
      >
        <Grid item xs={12} sm={4}>
          <TextField
            label="Dish Name"
            size="small"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            fullWidth
            placeholder="e.g. Paneer Butter Masala"
          />
        </Grid>
        <Grid item xs={12} sm={2.5}>
          <TextField
            label="Price (₹)"
            size="small"
            type="number"
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value)}
            fullWidth
            placeholder="240"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              value={newItemCategory}
              label="Category"
              onChange={(e) => setNewItemCategory(e.target.value)}
            >
              <MenuItem value="Main Course">Main Course</MenuItem>
              <MenuItem value="Starters & Snacks">Starters & Snacks</MenuItem>
              <MenuItem value="Breads & Rice">Breads & Rice</MenuItem>
              <MenuItem value="Beverages & Shakes">Beverages & Shakes</MenuItem>
              <MenuItem value="Desserts">Desserts</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2.5}>
          <FormControl fullWidth size="small">
            <InputLabel>Food Type</InputLabel>
            <Select
              value={newItemFoodType}
              label="Food Type"
              onChange={(e) => setNewItemFoodType(e.target.value)}
            >
              <MenuItem value="Veg">Veg (Green)</MenuItem>
              <MenuItem value="Non-Veg">Non-Veg (Red)</MenuItem>
              <MenuItem value="Egg">Egg (Yellow)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={7}>
          <TextField
            label="Short Description"
            size="small"
            value={newItemDesc}
            onChange={(e) => setNewItemDesc(e.target.value)}
            fullWidth
            placeholder="Rich gravy with authentic Indian spices and fresh cottage cheese"
          />
        </Grid>
        <Grid item xs={12} sm={5}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              component="label"
              size="small"
              variant="outlined"
              sx={{
                borderColor: newItemImage ? "#22C55E" : "#CBD5E1",
                color: newItemImage ? "#16A34A" : "#475569",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                flex: 1,
              }}
            >
              {newItemImage ? "Photo ✓" : "Dish Photo"}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => handleFileRead(e.target.files[0], setNewItemImage)}
              />
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddCircleOutline />}
              onClick={handleAddMenuItem}
              sx={{
                bgcolor: BRAND_MAIN,
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                px: 2.5,
                "&:hover": { bgcolor: BRAND_HOVER },
              }}
            >
              Add Item
            </Button>
          </Box>
        </Grid>

        {/* Menu Items Table */}
        {menuItems.length > 0 && (
          <Grid item xs={12}>
            <Box sx={{ border: "1px solid #E2E8F0", borderRadius: 2.5, overflow: "hidden", mt: 1 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Dish</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {menuItems.map((item, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {item.image && (
                          <Box
                            component="img"
                            src={item.image}
                            sx={{ width: 30, height: 30, borderRadius: 1, objectFit: "cover" }}
                          />
                        )}
                        <Typography variant="body2" fontWeight={600} color="#1E293B">
                          {item.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.foodType}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            height: 22,
                            bgcolor: item.isVeg ? "#DCFCE7" : "#FEE2E2",
                            color: item.isVeg ? "#15803D" : "#B91C1C",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: BRAND_MAIN }}>₹{item.price}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleRemoveMenuItem(idx)} color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Grid>
        )}
      </FormSectionCard>

      {/* SUBMIT BUTTON BAR */}
      <Paper
        elevation={3}
        sx={{
          position: "sticky",
          bottom: 16,
          zIndex: 10,
          p: 2.5,
          borderRadius: 3,
          bgcolor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <Box>
          <Typography variant="subtitle2" fontWeight={800} color="#1E293B">
            Ready to Onboard Restaurant?
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Account will be auto-approved and ready for instant Partner App login.
          </Typography>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            bgcolor: BRAND_MAIN,
            px: 4.5,
            py: 1.4,
            fontSize: "1rem",
            fontWeight: 800,
            textTransform: "none",
            borderRadius: 2.5,
            boxShadow: "0 4px 14px rgba(237, 32, 38, 0.4)",
            "&:hover": { bgcolor: BRAND_HOVER },
          }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : "Create & Onboard Restaurant Partner"}
        </Button>
      </Paper>
    </Box>
  );
};

// Clean Form Section Card Component
const FormSectionCard = ({ step, title, subtitle, icon: Icon, actionButton, children }) => (
  <Paper
    variant="outlined"
    sx={{
      p: { xs: 2.5, sm: 3.5 },
      mb: 3.5,
      borderRadius: 3.5,
      borderColor: "#E2E8F0",
      backgroundColor: "#FFFFFF",
      boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 10px 25px -5px rgba(0,0,0,0.02)",
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2.5,
            bgcolor: BRAND_LIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: BRAND_MAIN,
          }}
        >
          <Icon sx={{ fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: "#64748B", display: "block", mt: 0.3 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {actionButton}
    </Box>

    <Grid container spacing={2.5}>
      {children}
    </Grid>
  </Paper>
);

// Clean Document Upload Box
const DocumentUploadBox = ({ label, file, onUpload, onRemove, onFileRead }) => (
  <Box
    sx={{
      p: 1.5,
      border: "1px solid",
      borderColor: file ? "#BBF7D0" : "#E2E8F0",
      borderRadius: 2.5,
      bgcolor: file ? "#F0FDF4" : "#F8FAFC",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 56,
      transition: "all 0.2s ease",
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, overflow: "hidden" }}>
      {file ? (
        <CheckCircle sx={{ color: "#16A34A", fontSize: 20 }} />
      ) : (
        <InsertDriveFile sx={{ color: "#94A3B8", fontSize: 20 }} />
      )}
      <Box sx={{ overflow: "hidden" }}>
        <Typography variant="body2" fontWeight={600} color={file ? "#166534" : "#475569"} noWrap>
          {label}
        </Typography>
        <Typography variant="caption" color={file ? "#15803D" : "#94A3B8"} display="block">
          {file ? "Document Uploaded ✓" : "PDF or Image (Max 5MB)"}
        </Typography>
      </Box>
    </Box>

    {file ? (
      <IconButton size="small" onClick={onRemove} sx={{ color: "#DC2626", "&:hover": { bgcolor: "#FEE2E2" } }}>
        <Delete fontSize="small" />
      </IconButton>
    ) : (
      <Button
        component="label"
        size="small"
        variant="outlined"
        startIcon={<CloudUpload fontSize="small" />}
        sx={{
          borderColor: "#CBD5E1",
          color: "#334155",
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 2,
          fontSize: "0.8rem",
          "&:hover": { borderColor: BRAND_MAIN, color: BRAND_MAIN, bgcolor: BRAND_LIGHT },
        }}
      >
        Upload
        <input
          type="file"
          hidden
          accept="image/*,application/pdf"
          onChange={(e) => onFileRead(e.target.files[0], onUpload)}
        />
      </Button>
    )}
  </Box>
);

export default AddRestaurantForm;
