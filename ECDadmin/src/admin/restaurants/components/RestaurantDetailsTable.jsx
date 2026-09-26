import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Person,
  PhoneOutlined,
  CheckCircle,
  LocationOn,
  EmailOutlined,
  ReceiptLong,
  Payment,
  Assessment,
  Launch,
  AccountBalance,
  Schedule,
  InfoOutlined,
  Fastfood,
  Close,
  Collections,
  Lock,
  VerifiedUser,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Divider,
  Avatar,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Button,
} from "@mui/material";
import { useEditRestaurantProfile } from "../../api/restaurant";

const safe = (v) => (v === null || v === undefined || v === "" ? "—" : v);

const RestaurantDetailsTable = () => {
  const { id } = useParams();
  const { data, loading, error } = useEditRestaurantProfile(id);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const restaurant = data;
  const menu = data?.menu;

  // BRAND COLOR CONSTANTS
  const BRAND_MAIN = "#ed2026";
  const BRAND_BG_LIGHT = "#FFF5F2";

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress sx={{ color: BRAND_MAIN }} size={50} thickness={4} />
      </Box>
    );
  }
  if (error) {
    return <Typography color="error" p={4} variant="h6">Error: {error}</Typography>;
  }
  if (!restaurant) {
    return <Typography p={4}>No restaurant data found.</Typography>;
  }

  const displayTitle = typeof restaurant.name === 'object'
    ? (restaurant.name?.en || Object.values(restaurant.name)[0] || "Restaurant Details")
    : (restaurant.name || "Restaurant Details");

  const ownerName = restaurant.owner?.name || restaurant.ownerName || restaurant.ownerId || displayTitle;
  const ownerEmail = restaurant.owner?.email || restaurant.ownerEmail || restaurant.email || "—";
  const contactNo = restaurant.phone || restaurant.contactNumber || restaurant.contact || (restaurant.owner ? restaurant.owner.mobile : "—") || "—";
  const displayEmail = restaurant.email || (restaurant.owner ? restaurant.owner.email : "—") || "—";
  const displayCuisine = Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(", ") : (Array.isArray(restaurant.categories) ? restaurant.categories.join(", ") : (restaurant.cuisine || "Restaurant"));
  const displayPayments = Array.isArray(restaurant.paymentMethods) ? restaurant.paymentMethods.join(", ") : (restaurant.paymentMethods || (restaurant.upi ? `UPI (${restaurant.upi}), Cash` : "Online, COD"));
  const displayAddress = restaurant.address || "Selected from map";
  const displayCity = restaurant.city || "Sohna";
  const displayArea = restaurant.area || "";
  const displayBrand = restaurant.brand || displayTitle;
  const displayRating = typeof restaurant.rating === 'object' ? (restaurant.rating?.average ?? restaurant.avgRating ?? restaurant.adminRating ?? 0) : (restaurant.rating ?? restaurant.avgRating ?? 0);
  const displayPin = restaurant.pin || restaurant.ownerPin || (restaurant.owner ? restaurant.owner.pin : "1234") || "1234";

  // Gallery Photos
  const galleryImages = Array.isArray(restaurant.restaurantImages) && restaurant.restaurantImages.length > 0
    ? restaurant.restaurantImages
    : (Array.isArray(restaurant.images) && restaurant.images.length > 0
      ? restaurant.images
      : (restaurant.image ? [restaurant.image] : []));

  // Effective Menu
  const effectiveMenu = (menu && Object.keys(menu).length > 0) ? menu : (restaurant.menu && typeof restaurant.menu === 'object' && !Array.isArray(restaurant.menu) ? restaurant.menu : {});

  // Timings Schedule
  const defaultSchedule = {
    monday: { open: "09:00 AM", close: "05:30 PM", isClosed: false },
    tuesday: { open: "09:00 AM", close: "05:30 PM", isClosed: false },
    wednesday: { open: "09:00 AM", close: "05:30 PM", isClosed: false },
    thursday: { open: "09:00 AM", close: "05:30 PM", isClosed: false },
    friday: { open: "09:00 AM", close: "05:30 PM", isClosed: false },
    saturday: { open: "Closed", close: "Closed", isClosed: true },
    sunday: { open: "Closed", close: "Closed", isClosed: true },
  };
  const effectiveTiming = restaurant.timing && Object.keys(restaurant.timing).length > 0 ? restaurant.timing : defaultSchedule;

  // Documents
  const rawDocs = restaurant.documents || {};
  const licenseDoc = rawDocs.license || {};
  const gstDoc = rawDocs.gst || {};
  const panDoc = rawDocs.pan || {};

  // Bank Details
  const bankInfo = restaurant.bankDetails || {};

  const restaurantName = typeof restaurant.name === 'object' 
    ? (restaurant.name?.en || restaurant.name?.de || 'Restaurant') 
    : (restaurant.name || 'Restaurant');

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#fbfcfd", minHeight: "100vh" }}>
      
      {/* --- HERO HEADER --- */}
      <Paper elevation={0} sx={{ 
        p: 4, mb: 4, borderRadius: 4, 
        background: "linear-gradient(135deg, #ed2026 0%, #b31217 100%)",
        color: "white", display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4,
        boxShadow: "0px 10px 30px rgba(237, 32, 38, 0.25)"
      }}>
        <Avatar 
          src={restaurant.logo || restaurant.image || (galleryImages.length > 0 ? galleryImages[0] : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80")} 
          variant="rounded" 
          sx={{ width: 110, height: 110, borderRadius: 3, border: '4px solid rgba(255,255,255,0.4)', boxShadow: 3, bgcolor: '#ffffff', cursor: 'pointer' }}
          onClick={() => {
            const url = restaurant.logo || restaurant.image || (galleryImages.length > 0 ? galleryImages[0] : null);
            if (url) {
              setPreviewImage(url);
              setPreviewTitle(displayTitle);
            }
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
            <Typography variant="h4" sx={{ fontWeight: 800 }}>{displayTitle}</Typography>
            {restaurant.restaurantApproved ? (
              <Chip label="APPROVED PARTNER" color="success" size="small" sx={{ fontWeight: 800, bgcolor: '#ffffff', color: '#2e7d32' }} />
            ) : (
              <Chip label="PENDING APPROVAL" size="small" sx={{ fontWeight: 800, bgcolor: '#fff3e0', color: '#e65100' }} />
            )}
            <Chip 
              icon={<Lock sx={{ fontSize: 14, color: '#ed2026 !important' }} />}
              label={`4-Digit PIN: ${displayPin}`} 
              sx={{ bgcolor: 'white', color: '#ed2026', fontWeight: 800 }} 
            />
          </Stack>
          <Typography variant="body1" sx={{ opacity: 0.95, mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn fontSize="small" /> {displayAddress}{displayArea ? `, ${displayArea}` : ''}{displayCity ? `, ${displayCity}` : ''}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
            <Chip label={`⭐ ${displayRating}`} sx={{ bgcolor: 'white', color: BRAND_MAIN, fontWeight: 800 }} />
            <Chip label={displayBrand} sx={{ border: '1px solid white', color: 'white' }} variant="outlined" />
            <Chip label={`Phone: ${contactNo}`} sx={{ border: '1px solid rgba(255,255,255,0.7)', color: 'white' }} variant="outlined" />
            <Chip label={`Type: ${restaurant.restaurantType || 'Both (Veg & Non-Veg)'}`} sx={{ border: '1px solid rgba(255,255,255,0.7)', color: 'white' }} variant="outlined" />
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={4}>
        
        {/* LEFT COLUMN: PRIMARY INFO, GALLERY, AND MENU */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={4}>
            
            {/* PRIMARY INFORMATION */}
            <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: '1px solid #f0f0f0' }}>
              <Box sx={{ p: 2.5, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <InfoOutlined sx={{ color: BRAND_MAIN }} />
                <Typography variant="h6" fontWeight={700}>Restaurant & Owner Information</Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <InfoItem icon={<Person sx={{ color: BRAND_MAIN }} />} label="Owner Name" value={ownerName} subValue={ownerEmail !== "—" ? ownerEmail : ""} />
                  <InfoItem icon={<PhoneOutlined sx={{ color: BRAND_MAIN }} />} label="Contact / Registered Phone" value={contactNo} subValue={displayEmail !== "—" ? displayEmail : ""} />
                  <InfoItem icon={<Fastfood sx={{ color: BRAND_MAIN }} />} label="Cuisine & Categories" value={displayCuisine} />
                  <InfoItem icon={<Payment sx={{ color: BRAND_MAIN }} />} label="Payment Modes" value={displayPayments} />
                </Grid>
                <Divider sx={{ my: 2.5 }} />
                <Grid container spacing={2}>
                  <StatusItem label="Account Status" val={restaurant.isActive !== false ? "Active" : "Inactive"} />
                  <StatusItem label="Verification" val={restaurant.verificationStatus || (restaurant.restaurantApproved ? "Verified" : "Pending")} />
                  <StatusItem label="Commission" val={`${restaurant.adminCommission || 10}%`} />
                  <StatusItem label="4-Digit PIN" val={displayPin} />
                </Grid>
              </CardContent>
            </Card>

            {/* RESTAURANT GALLERY & PHOTOS (IMAGEKIT CDN) */}
            <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: '1px solid #f0f0f0' }}>
              <Box sx={{ p: 2.5, bgcolor: BRAND_BG_LIGHT, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontWeight={700} color={BRAND_MAIN} display="flex" alignItems="center" gap={1}>
                  <Collections fontSize="small" /> Restaurant Ambience & Gallery Photos
                </Typography>
                <Typography variant="caption" sx={{ bgcolor: BRAND_MAIN, color: 'white', px: 1.5, py: 0.5, borderRadius: 1, fontWeight: 700 }}>
                  {galleryImages.length} Photos
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                {galleryImages.length === 0 ? (
                  <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2, color: 'text.secondary' }}>
                    <Typography variant="body2">No gallery images uploaded during onboarding.</Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={2}>
                    {galleryImages.map((imgUrl, idx) => (
                      <Grid item xs={6} sm={4} md={3} key={idx}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            borderRadius: 2.5, 
                            overflow: 'hidden', 
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': { transform: 'scale(1.03)', boxShadow: 3, borderColor: BRAND_MAIN }
                          }}
                          onClick={() => {
                            setPreviewImage(imgUrl);
                            setPreviewTitle(`Restaurant Photo ${idx + 1}`);
                          }}
                        >
                          <Box 
                            component="img" 
                            src={imgUrl} 
                            alt={`Restaurant Photo ${idx + 1}`}
                            sx={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                          />
                          <Box sx={{ p: 1, bgcolor: '#fafafa', textAlign: 'center' }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                              Photo #{idx + 1}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>

            {/* MENU ITEMS & PRICES PORTFOLIO */}
            <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: '1px solid #f0f0f0' }}>
              <Box sx={{ p: 2.5, bgcolor: BRAND_BG_LIGHT, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontWeight={700} color={BRAND_MAIN} display="flex" alignItems="center" gap={1}>
                  <Fastfood fontSize="small" /> Menu Items & Price List
                </Typography>
                <Typography variant="caption" sx={{ bgcolor: BRAND_MAIN, color: 'white', px: 1.5, py: 0.5, borderRadius: 1, fontWeight: 700 }}>
                  {Object.values(effectiveMenu).reduce((acc, cat) => acc + (Array.isArray(cat) ? cat.length : (cat?.items?.length || 0)), 0)} Items
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                {Object.keys(effectiveMenu).length === 0 ? (
                  <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3, color: 'text.secondary' }}>
                    <Typography>No menu items recorded for this restaurant in database.</Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={2}>
                    {Object.entries(effectiveMenu).map(([category, catData]) => {
                      const items = Array.isArray(catData) ? catData : (catData?.items || []);
                      return (
                        <Grid item xs={12} md={6} key={category}>
                          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #eee', transition: '0.3s', '&:hover': { boxShadow: 4, borderColor: BRAND_MAIN } }}>
                            <Box sx={{ p: 1.5, bgcolor: '#fbfcfd', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography fontWeight={700} color={BRAND_MAIN}>{category}</Typography>
                              <Typography variant="caption" sx={{ bgcolor: BRAND_MAIN, color: 'white', px: 1, py: 0.3, borderRadius: 1 }}>{items.length} Items</Typography>
                            </Box>
                            <Stack divider={<Divider />}>
                              {items.map((item, i) => (
                                <Box key={i} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    {item.image ? (
                                      <Avatar 
                                        src={item.image} 
                                        variant="rounded" 
                                        sx={{ width: 48, height: 48, borderRadius: 1.5, cursor: 'pointer' }}
                                        onClick={() => {
                                          setPreviewImage(item.image);
                                          setPreviewTitle(item.name || `Item ${i + 1}`);
                                        }}
                                      />
                                    ) : (
                                      <Box sx={{ width: 48, height: 48, borderRadius: 1.5, bgcolor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Fastfood sx={{ color: '#aaa', fontSize: 20 }} />
                                      </Box>
                                    )}
                                    <Box>
                                      <Typography variant="body2" fontWeight={700}>{item.name}</Typography>
                                      <Typography variant="caption" color={item.isVeg ? "success.main" : "error.main"} fontWeight={600}>
                                        {item.isVeg ? "● Veg" : "● Non-Veg"}
                                      </Typography>
                                      {item.description && (
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ maxWidth: 200 }} noWrap>
                                          {item.description}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                  <Typography variant="subtitle1" fontWeight={800} color={BRAND_MAIN}>
                                    ₹{item.basePrice || item.price || 0}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </CardContent>
            </Card>

          </Stack>
        </Grid>

        {/* RIGHT COLUMN: DOCUMENTS, BANK DETAILS & OPERATIONAL HOURS */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={4}>
            
            {/* LEGAL KYC DOCUMENTS */}
            <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: '1px solid #f0f0f0' }}>
              <Box sx={{ p: 2.5, bgcolor: BRAND_BG_LIGHT, borderBottom: '1px solid #eee' }}>
                <Typography fontWeight={700} color={BRAND_MAIN} display="flex" alignItems="center" gap={1}>
                  <VerifiedUser fontSize="small" /> Legal Documents & KYC
                </Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                {/* Food License */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2.5, borderStyle: 'dashed', bgcolor: '#fff', '&:hover': { borderColor: BRAND_MAIN } }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>
                    Food Safety / FSSAI License
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                    <Typography fontWeight={700} fontSize="0.95rem">
                      {licenseDoc.number || "Not Provided"}
                    </Typography>
                    {(licenseDoc.file || licenseDoc.url) && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Launch sx={{ fontSize: 13 }} />}
                        onClick={() => {
                          setPreviewImage(licenseDoc.file || licenseDoc.url);
                          setPreviewTitle('FSSAI Food License Document');
                        }}
                        sx={{ color: BRAND_MAIN, borderColor: BRAND_MAIN, fontSize: '0.75rem', fontWeight: 800, textTransform: 'none', py: 0.2 }}
                      >
                        View Doc
                      </Button>
                    )}
                  </Box>
                </Paper>

                {/* GST Certificate */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2.5, borderStyle: 'dashed', bgcolor: '#fff', '&:hover': { borderColor: BRAND_MAIN } }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>
                    GST Registration Certificate
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                    <Typography fontWeight={700} fontSize="0.95rem">
                      {gstDoc.number || "Not Provided"}
                    </Typography>
                    {(gstDoc.file || gstDoc.url) && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Launch sx={{ fontSize: 13 }} />}
                        onClick={() => {
                          setPreviewImage(gstDoc.file || gstDoc.url);
                          setPreviewTitle('GST Certificate Document');
                        }}
                        sx={{ color: BRAND_MAIN, borderColor: BRAND_MAIN, fontSize: '0.75rem', fontWeight: 800, textTransform: 'none', py: 0.2 }}
                      >
                        View Doc
                      </Button>
                    )}
                  </Box>
                </Paper>

                {/* PAN Document (if any) */}
                {panDoc.number && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderStyle: 'dashed', bgcolor: '#fff', '&:hover': { borderColor: BRAND_MAIN } }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>
                      PAN Card Details
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                      <Typography fontWeight={700} fontSize="0.95rem">{panDoc.number}</Typography>
                      {(panDoc.file || panDoc.url) && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Launch sx={{ fontSize: 13 }} />}
                          onClick={() => {
                            setPreviewImage(panDoc.file || panDoc.url);
                            setPreviewTitle('PAN Document');
                          }}
                          sx={{ color: BRAND_MAIN, borderColor: BRAND_MAIN, fontSize: '0.75rem', fontWeight: 800, textTransform: 'none', py: 0.2 }}
                        >
                          View Doc
                        </Button>
                      )}
                    </Box>
                  </Paper>
                )}
              </CardContent>
            </Card>

            {/* BANK DETAILS & PAYOUT INFO */}
            <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: '1px solid #f0f0f0' }}>
              <Box sx={{ p: 2.5, bgcolor: BRAND_BG_LIGHT, borderBottom: '1px solid #eee' }}>
                <Typography fontWeight={700} color={BRAND_MAIN} display="flex" alignItems="center" gap={1}>
                  <AccountBalance fontSize="small" /> Bank Account & Payouts
                </Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Holder Name</Typography>
                    <Typography variant="body2" fontWeight={700}>{safe(bankInfo.accountHolder || bankInfo.accountName || bankInfo.holderName || ownerName)}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Bank Name</Typography>
                    <Typography variant="body2" fontWeight={700}>{safe(bankInfo.bankName || "HDFC Bank")}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Account Number</Typography>
                    <Typography variant="body2" fontWeight={700}>{safe(bankInfo.accountNumber || "—")}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>IFSC Code</Typography>
                    <Typography variant="body2" fontWeight={700}>{safe(bankInfo.ifscCode || bankInfo.swiftCode || "—")}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>UPI ID</Typography>
                    <Typography variant="body2" fontWeight={700} color={BRAND_MAIN}>{safe(bankInfo.upiId || bankInfo.upi || restaurant.upi || "—")}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* OPERATIONAL HOURS / TIMINGS */}
            <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: '1px solid #f0f0f0' }}>
              <Box sx={{ p: 2.5, bgcolor: BRAND_BG_LIGHT, borderBottom: '1px solid #eee' }}>
                <Typography fontWeight={700} color={BRAND_MAIN} display="flex" alignItems="center" gap={1}>
                  <Schedule fontSize="small" /> Operating Hours Schedule
                </Typography>
              </Box>
              <CardContent sx={{ p: 2.5 }}>
                {Object.entries(effectiveTiming).filter(([k]) => k !== "isHoliday").map(([day, info]) => (
                  <Box key={day} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.2 }}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 600, color: '#555' }}>{day}</Typography>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 700, 
                      color: (info?.isClosed || info?.open === 'Closed') ? "error.main" : "text.primary" 
                    }}>
                      {(info?.isClosed || info?.open === 'Closed') ? "CLOSED" : `${info?.open || info?.from || "09:00 AM"} — ${info?.close || info?.to || "05:30 PM"}`}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>

          </Stack>
        </Grid>
      </Grid>

      {/* --- IMAGE VIEW / ZOOM POPUP MODAL --- */}
      <Dialog 
        open={Boolean(previewImage)} 
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: BRAND_BG_LIGHT, p: 2 }}>
          <Typography variant="h6" fontWeight={700} color={BRAND_MAIN}>
            {previewTitle || "Image Preview"}
          </Typography>
          <IconButton size="small" onClick={() => setPreviewImage(null)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#111' }}>
          {previewImage && (
            <Box 
              component="img" 
              src={previewImage} 
              alt="Preview"
              sx={{ 
                maxWidth: '100%', 
                maxHeight: '75vh', 
                borderRadius: 2, 
                objectFit: 'contain',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
      
    </Box>
  );
};

// --- SUB-COMPONENTS ---

const InfoItem = ({ icon, label, value, subValue }) => (
  <Grid item xs={12} sm={6}>
    <Stack direction="row" spacing={2}>
      <Box sx={{ p: 1, bgcolor: '#FFF5F2', borderRadius: 2, height: 40, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
        <Typography variant="body2" fontWeight={700}>{safe(value)}</Typography>
        {subValue && <Typography variant="caption" color="text.secondary" display="block">{subValue}</Typography>}
      </Box>
    </Stack>
  </Grid>
);

const StatusItem = ({ label, val }) => {
  const isStringStatus = typeof val === 'string';
  const displayVal = isStringStatus ? val : (val ? "Yes" : "No");
  
  const v = String(displayVal).toLowerCase();
  let color = "#FF4500"; let bg = "#FFF5F2";
  if (["yes", "approved", "active", "true", "verified"].includes(v)) { color = "#2e7d32"; bg = "#e8f5e9"; }
  else if (["no", "temporarily closed", "rejected", "false"].includes(v)) { color = "#d32f2f"; bg = "#ffebee"; }

  return (
    <Grid item xs={6} md={3}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>{label}</Typography>
      <Chip label={displayVal} size="small" sx={{ fontWeight: 800, bgcolor: bg, color: color, borderRadius: 1 }} />
    </Grid>
  );
};

export default RestaurantDetailsTable;
