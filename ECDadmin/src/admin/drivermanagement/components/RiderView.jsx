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
 * Handles the display and linking of rider documents with ImageKit support
 */
const DocumentItem = ({ label, doc, url }) => {
  const docUrl = url || doc?.frontImage || doc?.image || doc?.url || (typeof doc === 'string' && doc.startsWith('http') ? doc : null);
  const docNumber = doc?.number || doc?.licenseNumber || doc?.panNumber || doc?.aadhaarNumber;
  const expiry = doc?.expiryDate || doc?.expiry;

  return (
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
        <Box>
          <Typography variant="body2" fontWeight={600} color="textPrimary">{label}</Typography>
          {docNumber && (
            <Typography variant="caption" sx={{ color: '#666', display: 'block', fontSize: '0.72rem' }}>
              No: <strong>{docNumber}</strong> {expiry ? `(Exp: ${expiry})` : ''}
            </Typography>
          )}
        </Box>
      </Box>
      {docUrl ? (
        <Link 
          href={docUrl} 
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
            textTransform: 'uppercase',
            bgcolor: '#FFF0F0',
            px: 1.5,
            py: 0.5,
            borderRadius: '6px',
            border: '1px solid #ffcdd2',
            '&:hover': { bgcolor: '#ffebee' }
          }}
        >
          View <Visibility sx={{ fontSize: 14 }} />
        </Link>
      ) : (
        <Typography variant="caption" color="textDisabled">
          {docNumber ? 'Verified (No File)' : 'Not Uploaded'}
        </Typography>
      )}
    </Box>
  );
};

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
  if (!rider) return <p className="p-4 text-gray-500">No rider details found.</p>;

  const getStatusColor = (status) => {
    if (status === "approved" || status === "verified") return "#10b981";
    if (status === "pending") return "#f59e0b";
    return BRAND_MAIN;
  };

  const name = rider.user?.name || rider.name || "Driver Partner";
  const email = rider.user?.email || rider.email || "Not Provided";
  const phone = rider.user?.mobile || rider.user?.phone || rider.mobile || rider.phone || "Not Provided";
  const profilePic = rider.user?.profilePic || rider.profilePic;

  const addressText = typeof rider.address === 'string' 
    ? rider.address 
    : [rider.address?.addressLine || rider.address?.street, rider.address?.city, rider.address?.state, rider.address?.zipCode].filter(Boolean).join(', ') || rider.workCity || "Not Provided";

  const vehicleName = [rider.vehicle?.brand, rider.vehicle?.model].filter(Boolean).join(' ') || rider.vehicle?.type || "Not Provided";
  const vehicleNumber = rider.vehicle?.number || rider.vehicle?.regNumber || "Not Provided";

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
              src={profilePic}
              sx={{ width: 120, height: 120, mx: "auto", mb: 2, border: `4px solid ${BRAND_BG_LIGHT}`, fontSize: '2.5rem', bgcolor: BRAND_MAIN }}
            >
              {name ? name.charAt(0).toUpperCase() : 'R'}
            </Avatar>
            <Typography variant="h6" fontWeight={800}>{name}</Typography>
            <Chip 
              label={(rider.verificationStatus || "pending").toUpperCase()} 
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
                <Typography variant="body2" fontWeight={600}>{email}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" className="text-gray-400 font-bold block uppercase">Mobile</Typography>
                <Typography variant="body2" fontWeight={600}>{phone}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" className="text-gray-400 font-bold block uppercase">Address</Typography>
                <Typography variant="body2" className="leading-tight">
                  {addressText}
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
                <Typography variant="body2" fontWeight={700}>{rider.workCity || rider.address?.city || "Not Provided"}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" className="text-gray-400 font-bold block">ZONE</Typography>
                <Typography variant="body2" fontWeight={700}>{rider.workZone || "Not Provided"}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" className="text-gray-400 font-bold block">VEHICLE</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {vehicleName}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" className="text-gray-400 font-bold block">PLATE NO</Typography>
                <Typography variant="body2" fontWeight={700}>{vehicleNumber}</Typography>
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
                <DocumentItem 
                  label={`License (${rider.documents?.license?.number || 'DL'})`} 
                  doc={rider.documents?.license} 
                  url={rider.documents?.license?.frontImage || rider.documents?.license?.image} 
                />
                <DocumentItem 
                  label={`PAN Card (${rider.documents?.panCard?.number || 'PAN'})`} 
                  doc={rider.documents?.panCard} 
                  url={rider.documents?.panCard?.image} 
                />
                <DocumentItem 
                  label={`Aadhaar (${rider.documents?.aadharCard?.number || 'UID'})`} 
                  doc={rider.documents?.aadharCard} 
                  url={rider.documents?.aadharCard?.image || rider.documents?.aadharCard?.frontImage} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DocumentItem 
                  label={`Registration RC (${rider.documents?.rc?.number || 'RC'})`} 
                  doc={rider.documents?.rc} 
                  url={rider.documents?.rc?.image} 
                />
                <DocumentItem 
                  label="Insurance Policy" 
                  doc={rider.documents?.insurance} 
                  url={rider.documents?.insurance?.image} 
                />
                <DocumentItem 
                  label="Medical / Other" 
                  doc={rider.documents?.medicalCertificate || rider.documents?.gst} 
                  url={rider.documents?.medicalCertificate || rider.documents?.gst} 
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Bank Details */}
          <Paper elevation={0} className="p-6 border border-gray-100 rounded-2xl shadow-sm" sx={{ bgcolor: BRAND_BG_LIGHT }}>
            <Typography variant="subtitle1" fontWeight={800} className="flex items-center gap-2 mb-4" sx={{ color: BRAND_MAIN }}>
              <AccountBalance fontSize="small" /> SETTLEMENT BANK & UPI DETAILS
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                 <Typography variant="caption" className="text-gray-400 font-bold block">ACCOUNT NAME</Typography>
                 <Typography variant="body2" fontWeight={700}>{rider.bankDetails?.accountHolderName || rider.bankDetails?.accountName || name || "Not Provided"}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                 <Typography variant="caption" className="text-gray-400 font-bold block">ACCOUNT NO</Typography>
                 <Typography variant="body2" fontWeight={700}>{rider.bankDetails?.accountNumber || "Not Provided"}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                 <Typography variant="caption" className="text-gray-400 font-bold block">BANK NAME</Typography>
                 <Typography variant="body2" fontWeight={600}>{rider.bankDetails?.bankName || "Not Provided"}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                 <Typography variant="caption" className="text-gray-400 font-bold block">IFSC CODE</Typography>
                 <Typography variant="body2" fontWeight={600}>{rider.bankDetails?.ifscCode || rider.bankDetails?.routingNumber || "Not Provided"}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                 <Typography variant="caption" className="text-gray-400 font-bold block">UPI ID</Typography>
                 <Typography variant="body2" fontWeight={600}>{rider.bankDetails?.upiId || rider.bankDetails?.upi || "Not Provided"}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default RiderView;