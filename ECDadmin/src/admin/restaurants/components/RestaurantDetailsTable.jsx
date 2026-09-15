import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Person,
  PhoneOutlined,
  Star,
  CheckCircle,
  AccessTime,
  LocationOn,
  EmailOutlined,
  Storefront,
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
  // const BRAND_GRADIENT = "linear-gradient(135deg, #FF4500 0%, #FF8C00 100%)";
  const BRAND_BG_LIGHT = "#FFF5F2";

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress sx={{ color: BRAND_MAIN }} size={60} thickness={4} />
    </Box>
  );
  if (error) return <Typography color="error" p={4} variant="h6">Error: {error}</Typography>;
  if (!restaurant) return <Typography p={4}>No restaurant data found.</Typography>;

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, backgroundColor: "#fdfdfd", minHeight: "100vh" }}>
      
      {/* --- HERO HEADER --- */}
      <Paper elevation={0} sx={{ 
        p: 4, mb: 4, borderRadius: 4, 
        background:"#ed2026",
        color: "white", display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4,
        boxShadow: "0px 10px 30px rgba(255, 69, 0, 0.25)"
      }}>
        <Avatar 
          src={restaurant.image} 
          variant="rounded" 
          sx={{ width: 120, height: 120, borderRadius: 3, border: '4px solid rgba(255,255,255,0.4)', boxShadow: 3 }} 
        />
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>{restaurant.name?.en}</Typography>
            {restaurant.isActive && (
              <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.5, borderRadius: 10, bgcolor: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(5px)' }}>
                <Box sx={{ width: 8, height: 8, bgcolor: '#4caf50', borderRadius: '50%', mr: 1, animation: 'pulse 1.5s infinite' }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>LIVE</Typography>
              </Box>
            )}
          </Stack>
          <Typography variant="h6" sx={{ opacity: 0.9, mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn fontSize="small" /> {restaurant.address}, {restaurant.city}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Chip label={`⭐ ${restaurant.rating || 'N/A'}`} sx={{ bgcolor: 'white', color: BRAND_MAIN, fontWeight: 800 }} />
            <Chip label={restaurant.brand} sx={{ border: '1px solid white', color: 'white' }} variant="outlined" />
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
                  <InfoItem icon={<Person sx={{ color: BRAND_MAIN }} />} label="Owner" value={restaurant.owner?.name} subValue={restaurant.owner?.email} />
                  <InfoItem icon={<PhoneOutlined sx={{ color: BRAND_MAIN }} />} label="Contact" value={restaurant.contactNumber} subValue={restaurant.email} />
                  <InfoItem icon={<Fastfood sx={{ color: BRAND_MAIN }} />} label="Cuisine" value={Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(", ") : restaurant.cuisine} />
                  <InfoItem icon={<Payment sx={{ color: BRAND_MAIN }} />} label="Payments" value={restaurant.paymentMethods} />
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
              <MetricCard title="Total Orders" value={restaurant.totalOrders} icon={<ReceiptLong />} color="#FF5722" />
              <MetricCard title="Success Rate" value={`${((restaurant.successfulOrders / restaurant.totalOrders) * 100 || 0).toFixed(1)}%`} icon={<CheckCircle />} color="#4caf50" />
              <MetricCard title="Avg. Order" value={`₹${restaurant.averageOrderValue || 0}`} icon={<Assessment />} color="#FF9800" />
            </Grid>

            {/* MENU BROWSER */}
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#333', mt: 2 }}>Menu Portfolio</Typography>
            <Grid container spacing={2}>
              {menu && Object.entries(menu).map(([category, items]) => (
                <Grid item xs={12} md={6} key={category}>
                  <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', transition: '0.3s', '&:hover': { boxShadow: 4, borderColor: BRAND_MAIN } }}>
                    <Box sx={{ p: 2, bgcolor: BRAND_BG_LIGHT, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontWeight={700} color={BRAND_MAIN}>{category}</Typography>
                      <Typography variant="caption" sx={{ bgcolor: BRAND_MAIN, color: 'white', px: 1, py: 0.5, borderRadius: 1 }}>{items.length} Items</Typography>
                    </Box>
                    <Stack divider={<Divider />}>
                      {items.map((item, i) => (
                        <Box key={i} sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                            <Typography variant="caption" color={item.isVeg ? "success.main" : "error.main"}>{item.isVeg ? "● Veg" : "● Non-Veg"}</Typography>
                          </Box>
                          <Typography variant="subtitle2" fontWeight={800} color={BRAND_MAIN}>₹{item.basePrice}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Grid>

        {/* RIGHT COLUMN: SIDEBAR DETAILS */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={4}>
            
            {/* TIMINGS */}
            <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
              <Box sx={{ p: 2.5, bgcolor: BRAND_BG_LIGHT, borderBottom: '1px solid #eee' }}>
                <Typography fontWeight={700} color={BRAND_MAIN} display="flex" alignItems="center" gap={1}><Schedule fontSize="small" /> Weekly Schedule</Typography>
              </Box>
              <CardContent>
                {restaurant.timing && Object.entries(restaurant.timing).filter(([k]) => k !== "isHoliday").map(([day, info]) => (
                  <Box key={day} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 600, color: '#555' }}>{day}</Typography>
                    <Typography variant="body2" sx={{ 
                      fontWeight: 700, 
                      color: info.isClosed ? "error.main" : "text.primary" 
                    }}>
                      {info.isClosed ? "CLOSED" : `${info.open} — ${info.close}`}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* DOCUMENTS */}
            <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
              <Box sx={{ p: 2.5, bgcolor: BRAND_BG_LIGHT, borderBottom: '1px solid #eee' }}>
                <Typography fontWeight={700} color={BRAND_MAIN} display="flex" alignItems="center" gap={1}><AccountBalance fontSize="small" /> Legal Verification</Typography>
              </Box>
              <CardContent>
                {restaurant.documents && Object.entries(restaurant.documents).map(([key, doc]) => (
                  <Paper variant="outlined" key={key} sx={{ p: 2, mb: 2, borderRadius: 2, borderStyle: 'dashed', bgcolor: '#fff', '&:hover': { borderColor: BRAND_MAIN } }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>{key} ID</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography fontWeight={600}>{doc.number || "—"}</Typography>
                      {(doc.file || doc.url) && (
                        <Link href={doc.file || doc.url} target="_blank" sx={{ color: BRAND_MAIN, display: 'flex', alignItems: 'center', fontSize: '0.8rem', fontWeight: 800, textDecoration: 'none' }}>
                          VIEW <Launch sx={{ fontSize: 14, ml: 0.5 }} />
                        </Link>
                      )}
                    </Box>
                  </Paper>
                ))}
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



























// import React, { useMemo } from "react";
// import { useParams } from "react-router-dom";
// import {
//   Person,
//   PhoneOutlined,
//   Star,
//   CheckCircle,
//   AccessTime,
//   LocationOn,
//   EmailOutlined,
//   Storefront,
//   ReceiptLong,
//   Payment,
//   Assessment,
//   Launch,
//   AccountBalance,
//   Schedule,
//   InfoOutlined,
//   Fastfood
// } from "@mui/icons-material";
// import { 
//   Box, 
//   Typography, 
//   Grid, 
//   Paper, 
//   Chip, 
//   Divider, 
//   Avatar, 
//   Link,
//   Card,
//   CardContent,
//   CircularProgress,
//   Stack
// } from "@mui/material";
// import { useEditRestaurantProfile } from "../../api/restaurant";

// const safe = (v) => (v === null || v === undefined || v === "" ? "—" : v);

// const RestaurantDetailsTable = () => {
//   const { id } = useParams();
//   const { data, loading, error } = useEditRestaurantProfile(id);

//   const restaurant = data;
//   const menu = data?.menu;

//   const getStatusStyle = (val) => {
//     const v = String(val).toLowerCase();
//     if (["yes", "approved", "active", "true"].includes(v)) 
//       return { color: "success", bg: "#e8f5e9", text: "#2e7d32" };
//     if (["no", "temporarily closed", "rejected", "false"].includes(v)) 
//       return { color: "error", bg: "#ffebee", text: "#d32f2f" };
//     return { color: "primary", bg: "#e3f2fd", text: "#1976d2" };
//   };

//   if (loading) return (
//     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
//       <CircularProgress sx={{ color: '#008080' }} size={60} thickness={4} />
//     </Box>
//   );
//   if (error) return <Typography color="error" p={4} variant="h6">Error: {error}</Typography>;
//   if (!restaurant) return <Typography p={4}>No restaurant data found.</Typography>;

//   return (
//     <Box sx={{ p: { xs: 2, md: 5 }, backgroundColor: "#f4f7f9", minHeight: "100vh" }}>
      
//       {/* --- HERO HEADER --- */}
//       <Paper elevation={0} sx={{ 
//         p: 4, mb: 4, borderRadius: 4, 
//         background: "linear-gradient(135deg, #ee0700 0%, #ee0710 100%)",
//         color: "white", display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4,
//         boxShadow: "0px 10px 30px rgba(0, 128, 128, 0.2)"
//       }}>
//         <Avatar 
//           src={restaurant.image} 
//           variant="rounded" 
//           sx={{ width: 120, height: 120, borderRadius: 3, border: '4px solid rgba(255,255,255,0.3)', boxShadow: 3 }} 
//         />
//         <Box sx={{ flex: 1 }}>
//           <Stack direction="row" alignItems="center" spacing={2}>
//             <Typography variant="h3" sx={{ fontWeight: 800 }}>{restaurant.name?.en}</Typography>
//             {restaurant.isActive && (
//               <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.5, borderRadius: 10, bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(5px)' }}>
//                 <Box sx={{ width: 8, height: 8, bgcolor: '#4caf50', borderRadius: '50%', mr: 1, animation: 'pulse 1.5s infinite' }} />
//                 <Typography variant="caption" sx={{ fontWeight: 700 }}>LIVE</Typography>
//               </Box>
//             )}
//           </Stack>
//           <Typography variant="h6" sx={{ opacity: 0.9, mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
//             <LocationOn fontSize="small" /> {restaurant.address}, {restaurant.city}
//           </Typography>
//           <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
//             <Chip label={`⭐ ${restaurant.rating || 'N/A'}`} sx={{ bgcolor: 'white', color: '#008080', fontWeight: 800 }} />
//             <Chip label={restaurant.brand} sx={{ border: '1px solid white', color: 'white' }} variant="outlined" />
//           </Box>
//         </Box>
//       </Paper>

//       <Grid container spacing={4}>
        
//         {/* LEFT COLUMN: CORE INFO */}
//         <Grid item xs={12} lg={8}>
//           <Stack spacing={4}>
            
//             {/* INFORMATION GRID */}
//             <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: 'none' }}>
//               <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                 <InfoOutlined sx={{ color: '#008080' }} />
//                 <Typography variant="h6" fontWeight={700}>Primary Information</Typography>
//               </Box>
//               <CardContent sx={{ p: 4 }}>
//                 <Grid container spacing={3}>
//                   <InfoItem icon={<Person color="disabled" />} label="Owner" value={restaurant.owner?.name} subValue={restaurant.owner?.email} />
//                   <InfoItem icon={<PhoneOutlined color="disabled" />} label="Contact" value={restaurant.contactNumber} subValue={restaurant.email} />
//                   <InfoItem icon={<Fastfood color="disabled" />} label="Cuisine" value={Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(", ") : restaurant.cuisine} />
//                   <InfoItem icon={<Payment color="disabled" />} label="Payments" value={restaurant.paymentMethods} />
//                 </Grid>
//                 <Divider sx={{ my: 3 }} />
//                 <Grid container spacing={3}>
//                   <StatusItem label="Platform Active" val={restaurant.isActive} />
//                   <StatusItem label="Approved" val={restaurant.restaurantApproved} />
//                   <StatusItem label="Menu Status" val={restaurant.menuApproved} />
//                   <StatusItem label="Verification" val={restaurant.verificationStatus} />
//                 </Grid>
//               </CardContent>
//             </Card>

//             {/* PERFORMANCE METRICS */}
//             <Grid container spacing={3}>
//               <MetricCard title="Total Orders" value={restaurant.totalOrders} icon={<ReceiptLong />} color="#2196f3" />
//               <MetricCard title="Success Rate" value={`${((restaurant.successfulOrders / restaurant.totalOrders) * 100 || 0).toFixed(1)}%`} icon={<CheckCircle />} color="#4caf50" />
//               <MetricCard title="Avg. Order" value={`₹${restaurant.averageOrderValue || 0}`} icon={<Assessment />} color="#ff9800" />
//             </Grid>

//             {/* MENU BROWSER */}
//             <Typography variant="h5" sx={{ fontWeight: 800, color: '#333', mt: 2 }}>Menu Portfolio</Typography>
//             <Grid container spacing={2}>
//               {menu && Object.entries(menu).map(([category, items]) => (
//                 <Grid item xs={12} md={6} key={category}>
//                   <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', transition: '0.3s', '&:hover': { boxShadow: 4 } }}>
//                     <Box sx={{ p: 2, bgcolor: '#f8fafd', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
//                       <Typography fontWeight={700} color="#008080">{category}</Typography>
//                       <Typography variant="caption" sx={{ bgcolor: '#008080', color: 'white', px: 1, borderRadius: 1 }}>{items.length} Items</Typography>
//                     </Box>
//                     <Stack divider={<Divider />}>
//                       {items.map((item, i) => (
//                         <Box key={i} sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
//                           <Box>
//                             <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
//                             <Typography variant="caption" color={item.isVeg ? "success.main" : "error.main"}>{item.isVeg ? "● Veg" : "● Non-Veg"}</Typography>
//                           </Box>
//                           <Typography variant="subtitle2" fontWeight={800}>₹{item.basePrice}</Typography>
//                         </Box>
//                       ))}
//                     </Stack>
//                   </Paper>
//                 </Grid>
//               ))}
//             </Grid>
//           </Stack>
//         </Grid>

//         {/* RIGHT COLUMN: SIDEBAR DETAILS */}
//         <Grid item xs={12} lg={4}>
//           <Stack spacing={4}>
            
//             {/* TIMINGS */}
//             <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
//               <Box sx={{ p: 2.5, bgcolor: '#fafafa', borderBottom: '1px solid #eee' }}>
//                 <Typography fontWeight={700} display="flex" alignItems="center" gap={1}><Schedule color="action" /> Weekly Schedule</Typography>
//               </Box>
//               <CardContent>
//                 {restaurant.timing && Object.entries(restaurant.timing).filter(([k]) => k !== "isHoliday").map(([day, info]) => (
//                   <Box key={day} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
//                     <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 600, color: '#555' }}>{day}</Typography>
//                     <Typography variant="body2" sx={{ 
//                       fontWeight: 700, 
//                       color: info.isClosed ? "error.main" : "text.primary" 
//                     }}>
//                       {info.isClosed ? "CLOSED" : `${info.open} — ${info.close}`}
//                     </Typography>
//                   </Box>
//                 ))}
//               </CardContent>
//             </Card>

//             {/* DOCUMENTS */}
//             <Card sx={{ borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
//               <Box sx={{ p: 2.5, bgcolor: '#fafafa', borderBottom: '1px solid #eee' }}>
//                 <Typography fontWeight={700} display="flex" alignItems="center" gap={1}><AccountBalance color="action" /> Legal Verification</Typography>
//               </Box>
//               <CardContent>
//                 {restaurant.documents && Object.entries(restaurant.documents).map(([key, doc]) => (
//                   <Paper variant="outlined" key={key} sx={{ p: 2, mb: 2, borderRadius: 2, borderStyle: 'dashed', bgcolor: '#fcfdfe' }}>
//                     <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#888' }}>{key} ID</Typography>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
//                       <Typography fontWeight={600}>{doc.number || "—"}</Typography>
//                       {(doc.file || doc.url) && (
//                         <Link href={doc.file || doc.url} target="_blank" sx={{ color: '#008080', display: 'flex', alignItems: 'center', fontSize: '0.8rem', fontWeight: 800 }}>
//                           OPEN <Launch sx={{ fontSize: 14, ml: 0.5 }} />
//                         </Link>
//                       )}
//                     </Box>
//                   </Paper>
//                 ))}
//               </CardContent>
//             </Card>

//           </Stack>
//         </Grid>
//       </Grid>
      
//       {/* Pulse Animation Style */}
//       <style>{`
//         @keyframes pulse {
//           0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
//           70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(76, 175, 80, 0); }
//           100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
//         }
//       `}</style>
//     </Box>
//   );
// };

// // --- SUB-COMPONENTS ---

// const InfoItem = ({ icon, label, value, subValue }) => (
//   <Grid item xs={12} sm={6}>
//     <Stack direction="row" spacing={2}>
//       <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 2, height: 40, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//         {icon}
//       </Box>
//       <Box>
//         <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
//         <Typography variant="body2" fontWeight={700}>{safe(value)}</Typography>
//         {subValue && <Typography variant="caption" color="text.secondary" display="block">{subValue}</Typography>}
//       </Box>
//     </Stack>
//   </Grid>
// );

// const StatusItem = ({ label, val }) => {
//   const isStringStatus = typeof val === 'string';
//   const displayVal = isStringStatus ? val : (val ? "Yes" : "No");
  
//   const v = String(displayVal).toLowerCase();
//   let color = "#1976d2"; let bg = "#e3f2fd";
//   if (["yes", "approved", "active", "true"].includes(v)) { color = "#2e7d32"; bg = "#e8f5e9"; }
//   else if (["no", "temporarily closed", "rejected", "false"].includes(v)) { color = "#d32f2f"; bg = "#ffebee"; }

//   return (
//     <Grid item xs={6} md={3}>
//       <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>{label}</Typography>
//       <Chip label={displayVal} size="small" sx={{ fontWeight: 800, bgcolor: bg, color: color, borderRadius: 1 }} />
//     </Grid>
//   );
// };

// const MetricCard = ({ title, value, icon, color }) => (
//   <Grid item xs={12} sm={4}>
//     <Card sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2, position: 'relative', overflow: 'hidden' }}>
//       <Box sx={{ p: 1.5, bgcolor: `${color}15`, color: color, borderRadius: 3 }}>
//         {React.cloneElement(icon, { fontSize: 'large' })}
//       </Box>
//       <Box>
//         <Typography variant="h5" fontWeight={800}>{value}</Typography>
//         <Typography variant="caption" color="text.secondary" fontWeight={600}>{title}</Typography>
//       </Box>
//       <Box sx={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.05 }}>
//         {React.cloneElement(icon, { sx: { fontSize: 80 } })}
//       </Box>
//     </Card>
//   </Grid>
// );

// export default RestaurantDetailsTable;









// import React, { useMemo } from "react";
// import { useParams } from "react-router-dom";
// import {
//   Person,
//   PhoneOutlined,
//   StarBorder,
//   OutlinedFlag,
//   Check,
//   AccessTime,
//   LocationOn,
// } from "@mui/icons-material";
// import { useEditRestaurantProfile } from "../../api/restaurant";

// const safe = (v) => (v === null || v === undefined || v === "" ? "—" : v);

// const RestaurantDetailsTable = () => {
//   const { id } = useParams();
//   const { data, loading, error } = useEditRestaurantProfile(id);

//   const restaurant = data;
//   const menu = data?.menu;


//   // ---------------- BASIC DETAILS ----------------
//   const basicDetails = useMemo(() => {
//     if (!restaurant) return [];
//     return [
//       { label: "Restaurant Name", value: restaurant.name?.en },
//       { label: "Brand", value: restaurant.brand },
//       { label: "Email", value: restaurant.email },
//       { label: "Phone", value: restaurant.contactNumber },
//       { label: "Owner Name", value: restaurant.owner?.name },
//       { label: "Owner Email", value: restaurant.owner?.email },
//       { label: "Owner Phone", value: restaurant.owner?.mobile },
//       { label: "City", value: restaurant.city },
//       { label: "Area", value: restaurant.area },
//       { label: "Address", value: restaurant.address },
//       { label: "Cuisine", value: restaurant.cuisine?.join(", ") },
//       { label: "Delivery Type", value: restaurant.deliveryType?.join(", ") },
//       { label: "Payment Method", value: restaurant.paymentMethods },
//     ];
//   }, [restaurant]);

//   // ---------------- STATUS & METRICS ----------------
//   const statusDetails = useMemo(() => {
//     if (!restaurant) return [];
//     return [
//       { label: "Active", value: restaurant.isActive ? "Yes" : "No" },
//       {
//         label: "Temporarily Closed",
//         value: restaurant.isTemporarilyClosed ? "Yes" : "No",
//       },
//       { label: "Restaurant Approved", value: restaurant.restaurantApproved ? "Yes" : "No" },
//       { label: "Menu Approved", value: restaurant.menuApproved ? "Yes" : "No" },
//       { label: "Verification Status", value: restaurant.verificationStatus },
//       { label: "Rating", value: restaurant.rating },
//       { label: "Total Orders", value: restaurant.totalOrders },
//       { label: "Successful Orders", value: restaurant.successfulOrders },
//       { label: "Average Order Value", value: restaurant.averageOrderValue },
//     ];
//   }, [restaurant]);

//   // ---------------- CHARGES ----------------
//   const chargeDetails = useMemo(() => {
//     if (!restaurant) return [];
//     return [
//       { label: "Packaging Charge", value: restaurant.packagingCharge },
//       { label: "Platform Fee", value: data?.platformFee },
//       { label: "Surge Fee", value: data?.surgeFee },
//       { label: "Free Delivery", value: restaurant.isFreeDelivery ? "Yes" : "No" },
//       { label: "Free Delivery Contribution", value: restaurant.freeDeliveryContribution },
//       { label: "Total Free Delivery Spend", value: restaurant.totalFreeDeliverySpend },
//       { label: "GST %", value: restaurant.taxConfig?.gstPercent },
//       { label: "Min Order Value", value: restaurant.minOrderValue },
//       { label: "Estimated Preparation Time", value: restaurant.estimatedPreparationTime },
//     ];
//   }, [restaurant, data]);

//   // ---------------- TIMINGS ----------------
//   const timingDetails = useMemo(() => {
//     if (!restaurant?.timing) return [];
//     return Object.entries(restaurant.timing)
//       .filter(([key]) => key !== "isHoliday")
//       .map(([day, info]) => ({
//         label: day.charAt(0).toUpperCase() + day.slice(1),
//         value: info.isClosed
//           ? "Closed"
//           : `${info.open || "—"} - ${info.close || "—"}`,
//       }));
//   }, [restaurant]);

//   // ---------------- MENU ----------------
//   const menuSections = useMemo(() => {
//     if (!menu) return [];
//     return Object.entries(menu).map(([category, items]) => ({
//       category,
//       items,
//     }));
//   }, [menu]);

//   if (loading) return <div className="p-6">Loading…</div>;
//   if (error) return <div className="p-6 text-red-500">{error}</div>;
//   if (!restaurant) return <div className="p-6">No data</div>;

//   const Section = ({ title, rows }) => (
//     <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
//       <h2 className="p-4 text-gray-700 text-lg">{title}</h2>
//       {rows.map((r, i) => (
//         <div key={i} className={`flex flex-col sm:flex-row border-t`}>
//           <div className="sm:w-1/3 bg-gray-100 p-3 text-sm font-medium text-gray-600">
//             {r.label}
//           </div>
//           <div className="sm:w-2/3 p-3 text-sm text-gray-700">{safe(r.value)}</div>
//         </div>
//       ))}
//     </div>
//   );

//   return (
//     <div className="p-4 sm:p-6 bg-blue-50/30 min-h-screen space-y-6">
//       {/* Restaurant Basic Info */}
//       <Section title="Restaurant Details" rows={basicDetails} />

//       {/* Status and Performance */}
//       <Section title="Status & Performance" rows={statusDetails} />

//       {/* Charges & Configuration */}
//       <Section title="Charges & Configuration" rows={chargeDetails} />

//       {/* Restaurant Timings */}
//       <Section title="Operating Timings" rows={timingDetails} />

//       {/* Restaurant Menu */}
//       {menuSections.map((section, idx) => (
//         <div key={idx} className="bg-white rounded-lg shadow-sm border overflow-hidden">
//           <h2 className="p-4 text-gray-700 text-lg">{section.category}</h2>
//           {section.items.map((item) => (
//             <div
//               key={item._id}
//               className="flex flex-col sm:flex-row border-t"
//             >
//               <div className="sm:w-1/3 bg-gray-100 p-3 text-sm font-medium text-gray-600">
//                 {item.name} {item.isVeg ? "(Veg)" : "(Non-Veg)"}
//               </div>
//               <div className="sm:w-2/3 p-3 text-sm text-gray-700">
//                 {item.description} — ₹{item.basePrice}
//               </div>
//             </div>
//           ))}
//         </div>
//       ))}

//       {/* Restaurant Image */}
//       {restaurant.image && (
//         <div className="bg-white rounded-lg shadow-sm border p-4">
//           <h2 className="text-gray-700 text-lg mb-2">Restaurant Image</h2>
//           <img
//             src={restaurant.image}
//             alt={restaurant.name?.en}
//             className="w-64 h-64 object-cover rounded"
//           />
//         </div>
//       )}

//       {/* Location */}
//       {restaurant.location?.coordinates && (
//         <div className="bg-white rounded-lg shadow-sm border p-4">
//           <h2 className="text-gray-700 text-lg mb-2">Location</h2>
//           <p>
//             <LocationOn className="inline mr-1" />
//             Lat: {restaurant.location.coordinates[1]}, Lng: {restaurant.location.coordinates[0]}
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default RestaurantDetailsTable;



