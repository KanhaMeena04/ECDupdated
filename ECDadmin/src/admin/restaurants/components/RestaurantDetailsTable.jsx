import React from "react";
import { useParams } from "react-router-dom";
import {
  Person,
  PhoneOutlined,
  CheckCircle,
  LocationOn,
  ReceiptLong,
  Payment,
  Assessment,
  Launch,
  AccountBalance,
  Schedule,
  InfoOutlined,
  Fastfood
} from "@mui/icons-material";
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Chip, 
  Divider, 
  Avatar, 
  Link,
  Card,
  CardContent,
  CircularProgress,
  Stack
} from "@mui/material";
import { useEditRestaurantProfile } from "../../api/restaurant";

const safe = (v) => (v === null || v === undefined || v === "" ? "—" : v);

const RestaurantDetailsTable = () => {
  const { id } = useParams();
  const { data, loading, error } = useEditRestaurantProfile(id);

  const restaurant = data;
  const menu = data?.menu;

  // BRAND COLOR CONSTANTS
  const BRAND_MAIN = "#ed2026"; 
  const BRAND_BG_LIGHT = "#FFF5F2";

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress sx={{ color: BRAND_MAIN }} size={60} thickness={4} />
    </Box>
  );
  if (error) return <Typography color="error" p={4} variant="h6">Error: {error}</Typography>;
  if (!restaurant) return <Typography p={4}>No restaurant data found.</Typography>;

  const restaurantName = typeof restaurant.name === 'object' 
    ? (restaurant.name?.en || restaurant.name?.de || 'Restaurant') 
    : (restaurant.name || 'Restaurant');

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, backgroundColor: "#fdfdfd", minHeight: "100vh" }}>
      
      {/* --- HERO HEADER --- */}
      <Paper elevation={0} sx={{ 
        p: 4, mb: 4, borderRadius: 4, 
        background: BRAND_MAIN,
        color: "white", display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4,
        boxShadow: "0px 10px 30px rgba(237, 32, 38, 0.25)"
      }}>
        <Avatar 
          src={restaurant.image} 
          variant="rounded" 
          sx={{ width: 120, height: 120, borderRadius: 3, border: '4px solid rgba(255,255,255,0.4)', boxShadow: 3 }} 
        />
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>{restaurantName}</Typography>
            {restaurant.isActive && (
              <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.5, borderRadius: 10, bgcolor: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(5px)' }}>
                <Box sx={{ width: 8, height: 8, bgcolor: '#4caf50', borderRadius: '50%', mr: 1, animation: 'pulse 1.5s infinite' }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>LIVE</Typography>
              </Box>
            )}
          </Stack>
          <Typography variant="h6" sx={{ opacity: 0.9, mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn fontSize="small" /> {restaurant.address || "—"}{restaurant.city ? `, ${restaurant.city}` : ""}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Chip label={`⭐ ${restaurant.rating || 'N/A'}`} sx={{ bgcolor: 'white', color: BRAND_MAIN, fontWeight: 800 }} />
            {restaurant.brand && (
              <Chip label={restaurant.brand} sx={{ border: '1px solid white', color: 'white' }} variant="outlined" />
            )}
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={4}>
        
        {/* LEFT COLUMN: CORE INFO */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={4}>
            
            {/* INFORMATION GRID */}
            <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: 'none' }}>
              <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <InfoOutlined sx={{ color: BRAND_MAIN }} />
                <Typography variant="h6" fontWeight={700}>Primary Information</Typography>
              </Box>
              <CardContent sx={{ p: 4 }}>
                <Grid container spacing={3}>
                  <InfoItem 
                    icon={<Person sx={{ color: BRAND_MAIN }} />} 
                    label="Owner" 
                    value={restaurant.owner?.name || restaurant.ownerName || "—"} 
                    subValue={restaurant.owner?.email || restaurant.ownerEmail} 
                  />
                  <InfoItem 
                    icon={<PhoneOutlined sx={{ color: BRAND_MAIN }} />} 
                    label="Contact" 
                    value={restaurant.contactNumber || restaurant.phone || "—"} 
                    subValue={restaurant.email} 
                  />
                  <InfoItem 
                    icon={<Fastfood sx={{ color: BRAND_MAIN }} />} 
                    label="Cuisine" 
                    value={Array.isArray(restaurant.cuisine) ? (restaurant.cuisine.length ? restaurant.cuisine.join(", ") : "—") : (restaurant.cuisine || "—")} 
                  />
                  <InfoItem 
                    icon={<Payment sx={{ color: BRAND_MAIN }} />} 
                    label="Payments" 
                    value={Array.isArray(restaurant.paymentMethods) ? restaurant.paymentMethods.join(", ") : (restaurant.paymentMethods || "—")} 
                  />
                </Grid>
                <Divider sx={{ my: 3 }} />
                <Grid container spacing={3}>
                  <StatusItem label="Platform Active" val={restaurant.isActive} />
                  <StatusItem label="Approved" val={restaurant.restaurantApproved} />
                  <StatusItem label="Menu Status" val={restaurant.menuApproved} />
                  <StatusItem label="Verification" val={restaurant.verificationStatus} />
                </Grid>
              </CardContent>
            </Card>

            {/* PERFORMANCE METRICS */}
            <Grid container spacing={3}>
              <MetricCard 
                title="Total Orders" 
                value={restaurant.totalOrders || 0} 
                icon={<ReceiptLong />} 
                color="#FF5722" 
              />
              <MetricCard 
                title="Success Rate" 
                value={`${restaurant.totalOrders ? ((restaurant.successfulOrders / restaurant.totalOrders) * 100).toFixed(1) : 0}%`} 
                icon={<CheckCircle />} 
                color="#4caf50" 
              />
              <MetricCard 
                title="Avg. Order" 
                value={`₹${restaurant.averageOrderValue || 0}`} 
                icon={<Assessment />} 
                color="#FF9800" 
              />
            </Grid>

            {/* MENU BROWSER */}
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#333', mt: 2 }}>Menu Portfolio</Typography>
            <Grid container spacing={2}>
              {menu && typeof menu === 'object' && Object.keys(menu).length > 0 ? (
                Object.entries(menu).map(([categoryKey, catData]) => {
                  const categoryName = typeof catData?.category?.name === 'object'
                    ? (catData?.category?.name?.en || catData?.category?.name?.de || categoryKey)
                    : (catData?.category?.name || categoryKey);
                  const items = Array.isArray(catData) ? catData : (Array.isArray(catData?.items) ? catData.items : []);
                  
                  return (
                    <Grid item xs={12} md={6} key={categoryKey}>
                      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', transition: '0.3s', '&:hover': { boxShadow: 4, borderColor: BRAND_MAIN } }}>
                        <Box sx={{ p: 2, bgcolor: BRAND_BG_LIGHT, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography fontWeight={700} color={BRAND_MAIN}>{categoryName}</Typography>
                          <Typography variant="caption" sx={{ bgcolor: BRAND_MAIN, color: 'white', px: 1, py: 0.5, borderRadius: 1 }}>
                            {items.length} Items
                          </Typography>
                        </Box>
                        {items.length > 0 ? (
                          <Stack divider={<Divider />}>
                            {items.map((item, i) => (
                              <Box key={item._id || i} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {typeof item.name === 'object' ? (item.name?.en || item.name?.de || 'Unnamed Item') : (item.name || 'Unnamed Item')}
                                  </Typography>
                                  <Typography variant="caption" color={item.isVeg ? "success.main" : "error.main"}>
                                    {item.isVeg ? "● Veg" : "● Non-Veg"}
                                  </Typography>
                                </Box>
                                <Typography variant="subtitle2" fontWeight={800} color={BRAND_MAIN}>₹{item.basePrice ?? 0}</Typography>
                              </Box>
                            ))}
                          </Stack>
                        ) : (
                          <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">No items in this category</Typography>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  );
                })
              ) : (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: 'center', bgcolor: '#fafafa' }}>
                    <Typography variant="body2" color="text.secondary">No menu items configured for this restaurant.</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Stack>
        </Grid>

        {/* RIGHT COLUMN: SIDEBAR DETAILS */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={4}>
            
            {/* TIMINGS */}
            <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
              <Box sx={{ p: 2.5, bgcolor: BRAND_BG_LIGHT, borderBottom: '1px solid #eee' }}>
                <Typography fontWeight={700} color={BRAND_MAIN} display="flex" alignItems="center" gap={1}>
                  <Schedule fontSize="small" /> Weekly Schedule
                </Typography>
              </Box>
              <CardContent>
                {restaurant.timing && typeof restaurant.timing === 'object' && Object.entries(restaurant.timing).filter(([k]) => k !== "isHoliday" && typeof restaurant.timing[k] === 'object').length > 0 ? (
                  Object.entries(restaurant.timing)
                    .filter(([k]) => k !== "isHoliday" && typeof restaurant.timing[k] === 'object')
                    .map(([day, info]) => (
                      <Box key={day} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 600, color: '#555' }}>{day}</Typography>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 700, 
                          color: info?.isClosed ? "error.main" : "text.primary" 
                        }}>
                          {info?.isClosed ? "CLOSED" : `${info?.open || '09:00'} — ${info?.close || '22:00'}`}
                        </Typography>
                      </Box>
                    ))
                ) : (
                  <Typography variant="body2" color="text.secondary">All days standard: 09:00 — 22:00</Typography>
                )}
              </CardContent>
            </Card>

            {/* DOCUMENTS */}
            <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
              <Box sx={{ p: 2.5, bgcolor: BRAND_BG_LIGHT, borderBottom: '1px solid #eee' }}>
                <Typography fontWeight={700} color={BRAND_MAIN} display="flex" alignItems="center" gap={1}>
                  <AccountBalance fontSize="small" /> Legal Verification
                </Typography>
              </Box>
              <CardContent>
                {restaurant.documents && typeof restaurant.documents === 'object' && Object.entries(restaurant.documents).length > 0 ? (
                  Object.entries(restaurant.documents).map(([key, doc]) => {
                    if (!doc || typeof doc !== 'object') return null;
                    return (
                      <Paper variant="outlined" key={key} sx={{ p: 2, mb: 2, borderRadius: 2, borderStyle: 'dashed', bgcolor: '#fff', '&:hover': { borderColor: BRAND_MAIN } }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>{key} ID</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography fontWeight={600}>{doc.number || "—"}</Typography>
                          {(doc.file || doc.url) && (
                            <Link href={doc.file || doc.url} target="_blank" rel="noopener noreferrer" sx={{ color: BRAND_MAIN, display: 'flex', alignItems: 'center', fontSize: '0.8rem', fontWeight: 800, textDecoration: 'none' }}>
                              VIEW <Launch sx={{ fontSize: 14, ml: 0.5 }} />
                            </Link>
                          )}
                        </Box>
                      </Paper>
                    );
                  })
                ) : (
                  <Typography variant="body2" color="text.secondary">No documents uploaded.</Typography>
                )}
              </CardContent>
            </Card>

          </Stack>
        </Grid>
      </Grid>
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(76, 175, 80, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
      `}</style>
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
  if (["yes", "approved", "active", "true"].includes(v)) { color = "#2e7d32"; bg = "#e8f5e9"; }
  else if (["no", "temporarily closed", "rejected", "false"].includes(v)) { color = "#d32f2f"; bg = "#ffebee"; }

  return (
    <Grid item xs={6} md={3}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>{label}</Typography>
      <Chip label={displayVal} size="small" sx={{ fontWeight: 800, bgcolor: bg, color: color, borderRadius: 1 }} />
    </Grid>
  );
};

const MetricCard = ({ title, value, icon, color }) => (
  <Grid item xs={12} sm={4}>
    <Card sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2, position: 'relative', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
      <Box sx={{ p: 1.5, bgcolor: `${color}15`, color: color, borderRadius: 3 }}>
        {React.cloneElement(icon, { fontSize: 'large' })}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={800}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>{title}</Typography>
      </Box>
      <Box sx={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.05 }}>
        {React.cloneElement(icon, { sx: { fontSize: 80 } })}
      </Box>
    </Card>
  </Grid>
);

export default RestaurantDetailsTable;
