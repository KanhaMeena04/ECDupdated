import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRiderDetails } from "../../api/driver";
import {
  Paper,
  Typography,
  Grid,
  Avatar,
  CircularProgress,
  Button,
  Box,
  Divider,
  Chip,
  Link
} from "@mui/material";
import { 
  DirectionsBike, 
  AccountBalance, 
  Description,
  Visibility,
  FilePresent
} from "@mui/icons-material";

// BRAND CONSTANTS
const BRAND_MAIN = "#ed2026";
const BRAND_BG_LIGHT = "#FFF5F2";

/**
 * SUB-COMPONENT: DocumentItem
 * Handles the display and linking of rider documents
 */
const DocumentItem = ({ label, url }) => (
  <Box 
    sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      p: 1.5, 
      border: '1px solid #eee', 
      borderRadius: '8px',
      mb: 1,
      transition: '0.2s',
      '&:hover': { bgcolor: '#fafafa', borderColor: BRAND_MAIN }
    }}
  >
    <Box className="flex items-center gap-2">
      <FilePresent sx={{ color: BRAND_MAIN, fontSize: 20 }} />
      <Typography variant="body2" fontWeight={600} color="textPrimary">{label}</Typography>
    </Box>
    {url ? (
      <Link 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.5, 
          fontSize: '0.75rem', 
          fontWeight: 800, 
          color: BRAND_MAIN, 
          textDecoration: 'none',
          textTransform: 'uppercase'
        }}
      >
        View <Visibility sx={{ fontSize: 14 }} />
      </Link>
    ) : (
      <Typography variant="caption" color="textDisabled">Not Uploaded</Typography>
    )}
  </Box>
);

const RiderView = () => {
  const { id } = useParams();
  const { rider, loading, error } = useRiderDetails(id);
  const navigate = useNavigate();

  if (loading)
    return (
      <Box className="flex justify-center items-center min-h-[400px]">
        <CircularProgress sx={{ color: BRAND_MAIN }} />
      </Box>
    );

  if (error) return <p className="p-4 text-red-500 font-bold">Error: {error}</p>;
  if (!rider) return null;

  const getStatusColor = (status) => {
    if (status === "approved") return "#10b981";
    if (status === "pending") return "#f59e0b";
    return BRAND_MAIN;
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Header Section */}
      <Box className="flex justify-between items-center mb-6">
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -1, color: "#1a1a1a" }}>
            RIDER PROFILE
          </Typography>
          <Typography variant="caption" className="text-gray-500 font-bold uppercase tracking-widest">
            ID: {rider._id}
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate(`/admin/riders/edit/${id}`)}
          sx={{
            bgcolor: BRAND_MAIN,
            "&:hover": { bgcolor: "#c41a1f" },
            px: 4,
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: "bold",
          }}
        >
          Edit Profile
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* LEFT COLUMN: BASIC INFO */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} className="p-6 text-center border border-gray-100 rounded-2xl shadow-sm h-full">
            <Avatar
              src={rider.user?.profilePic}
              sx={{ width: 120, height: 120, mx: "auto", mb: 2, border: `4px solid ${BRAND_BG_LIGHT}` }}
            />
            <Typography variant="h6" fontWeight={800}>{rider.user?.name}</Typography>
            <Chip 
              label={rider.verificationStatus?.toUpperCase()} 
              size="small"
              sx={{ 
                bgcolor: getStatusColor(rider.verificationStatus), 
                color: "white", 
                fontWeight: "bold",
                mt: 1,
                mb: 2 
              }} 
            />
            
            <Divider className="my-4" />
            
            <Box className="space-y-3 text-left">
              <Box>
                <Typography variant="caption" className="text-gray-400 font-bold block uppercase">Email</Typography>
                <Typography variant="body2" fontWeight={600}>{rider.user?.email}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" className="text-gray-400 font-bold block uppercase">Mobile</Typography>
                <Typography variant="body2" fontWeight={600}>{rider.user?.mobile}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" className="text-gray-400 font-bold block uppercase">Address</Typography>
                <Typography variant="body2" className="leading-tight">
                   {rider.address?.street}, {rider.address?.city}, {rider.address?.state}, {rider.address?.zipCode}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* RIGHT COLUMN: WORK & DETAILS */}
        <Grid item xs={12} md={8} className="space-y-4">
          
          {/* Work Assignment & Vehicle */}
          <Paper elevation={0} className="p-6 border border-gray-100 rounded-2xl shadow-sm">
            <Typography variant="subtitle1" fontWeight={800} className="flex items-center gap-2 mb-4" sx={{ color: BRAND_MAIN }}>
              <DirectionsBike fontSize="small" /> WORK & VEHICLE
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" className="text-gray-400 font-bold block">CITY</Typography>
                <Typography variant="body2" fontWeight={700}>{rider.workCity}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" className="text-gray-400 font-bold block">ZONE</Typography>
                <Typography variant="body2" fontWeight={700}>{rider.workZone}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" className="text-gray-400 font-bold block">VEHICLE</Typography>
                <Typography variant="body2" fontWeight={700}>{rider.vehicle?.model} ({rider.vehicle?.type})</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" className="text-gray-400 font-bold block">PLATE NO</Typography>
                <Typography variant="body2" fontWeight={700}>{rider.vehicle?.number}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Verification & Documents */}
          <Paper elevation={0} className="p-6 border border-gray-100 rounded-2xl shadow-sm">
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: BRAND_MAIN, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Description fontSize="small" /> VERIFICATION DOCUMENTS
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DocumentItem label="License Front" url={rider.documents?.license?.frontImage} />
                <DocumentItem label="License Back" url={rider.documents?.license?.backImage} />
                <DocumentItem label="Registration (RC)" url={rider.documents?.rc?.image} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DocumentItem label="Insurance Policy" url={rider.documents?.insurance?.image} />
                <DocumentItem label="Medical Certificate" url={rider.documents?.medicalCertificate} />
                <DocumentItem label="GST Document" url={rider.documents?.gst} />
              </Grid>
            </Grid>
          </Paper>

          {/* Bank Details */}
          <Paper elevation={0} className="p-6 border border-gray-100 rounded-2xl shadow-sm" sx={{ bgcolor: BRAND_BG_LIGHT }}>
            <Typography variant="subtitle1" fontWeight={800} className="flex items-center gap-2 mb-4" sx={{ color: BRAND_MAIN }}>
              <AccountBalance fontSize="small" /> SETTLEMENT BANK DETAILS
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                 <Typography variant="caption" className="text-gray-400 font-bold block">ACCOUNT NAME</Typography>
                 <Typography variant="body2" fontWeight={700}>{rider.bankDetails?.accountName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                 <Typography variant="caption" className="text-gray-400 font-bold block">ACCOUNT NO</Typography>
                 <Typography variant="body2" fontWeight={700}>{rider.bankDetails?.accountNumber}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                 <Typography variant="caption" className="text-gray-400 font-bold block">BANK</Typography>
                 <Typography variant="body2" fontWeight={600}>{rider.bankDetails?.bankName}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                 <Typography variant="caption" className="text-gray-400 font-bold block">ROUTING / IFSC</Typography>
                 <Typography variant="body2" fontWeight={600}>{rider.bankDetails?.routingNumber || "N/A"}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                 <Typography variant="caption" className="text-gray-400 font-bold block">SWIFT CODE</Typography>
                 <Typography variant="body2" fontWeight={600}>{rider.bankDetails?.swiftCode || "N/A"}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default RiderView;