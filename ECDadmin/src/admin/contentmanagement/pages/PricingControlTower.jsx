import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Switch,
  Button,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import {
  LocalShipping,
  TrendingUp,
  Percent,
  ReceiptLong,
  Calculate,
  Add,
  Edit,
  Delete,
  Refresh,
  CheckCircle,
  HelpOutline,
  Layers,
} from "@mui/icons-material";
import api from "../../../utils/api";

const PRIMARY_COLOR = "#248C70";
const ACCENT_COLOR = "#E89D1E";

export default function PricingControlTower() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "", severity: "success" });

  // Config State
  const [deliveryConfig, setDeliveryConfig] = useState({
    enabled: true,
    baseFee: 30,
    baseDistanceKm: 3,
    maxDeliveryRadiusKm: 12,
    isFreeDeliveryEnabled: true,
    freeDeliveryThreshold: 500,
    slabs: [],
  });

  const [surgeConfig, setSurgeConfig] = useState({
    peakHour: { enabled: false, fee: 15, startTime: "12:00", endTime: "15:00" },
    nightCharge: { enabled: false, fee: 25, startTime: "23:00", endTime: "06:00" },
    rainCharge: { enabled: false, fee: 20 },
    highDemandCharge: { enabled: false, fee: 15 },
  });

  const [commissionConfig, setCommissionConfig] = useState({
    globalCommissionPercent: 20,
    categoryCommissions: [],
  });

  const [platformFeeConfig, setPlatformFeeConfig] = useState({ enabled: true, type: "fixed", fee: 5, minFee: 5, maxFee: 20 });
  const [packagingFeeConfig, setPackagingFeeConfig] = useState({ enabled: true, globalPackagingFee: 10 });

  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);

  // Modals
  const [slabModal, setSlabModal] = useState({ open: false, index: null });
  const [slabForm, setSlabForm] = useState({ minDistanceKm: 0, maxDistanceKm: 3, fee: 30, perKmFee: 0, isActive: true });

  const [restaurantCommModal, setRestaurantCommModal] = useState({ open: false, restaurant: null });
  const [restaurantCommValue, setRestaurantCommValue] = useState(20);

  // Calculator Preview State
  const [previewInput, setPreviewInput] = useState({
    restaurantId: "",
    deliveryDistance: 3,
    itemTotal: 350,
    orderType: "delivery",
    couponCode: "",
  });
  const [previewResult, setPreviewResult] = useState(null);

  const showAlert = (message, severity = "success") => {
    setAlertInfo({ show: true, message, severity });
    setTimeout(() => setAlertInfo({ show: false, message: "", severity: "success" }), 4000);
  };

  const fetchPricingConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/pricing/config");
      const c = res.data.config;
      if (c.deliveryFeeConfig) setDeliveryConfig(c.deliveryFeeConfig);
      if (c.surgeConfig) setSurgeConfig(c.surgeConfig);
      if (c.commissionConfig) setCommissionConfig(c.commissionConfig);
      if (c.platformFeeConfig) setPlatformFeeConfig(c.platformFeeConfig);
      if (c.packagingFeeConfig) setPackagingFeeConfig(c.packagingFeeConfig);

      setRestaurants(res.data.restaurants || []);
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load pricing configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingConfig();
  }, []);

  // Save Delivery Config
  const handleSaveDeliveryConfig = async () => {
    try {
      setLoading(true);
      await api.put("/api/pricing/delivery-config", {
        ...deliveryConfig,
        reason: "Admin updated delivery fees & slabs",
      });
      showAlert("Delivery configuration saved successfully!");
      fetchPricingConfig();
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to save delivery config", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add / Edit Slab
  const handleSaveSlab = () => {
    const min = Number(slabForm.minDistanceKm);
    const max = Number(slabForm.maxDistanceKm);
    const fee = Number(slabForm.fee);

    if (min < 0 || max < 0 || fee < 0) {
      return showAlert("Distances and fees must be non-negative", "error");
    }
    if (min >= max) {
      return showAlert("Min distance must be strictly less than Max distance", "error");
    }

    const newSlabs = [...(deliveryConfig.slabs || [])];
    if (slabModal.index !== null) {
      newSlabs[slabModal.index] = slabForm;
    } else {
      newSlabs.push(slabForm);
    }

    setDeliveryConfig({ ...deliveryConfig, slabs: newSlabs });
    setSlabModal({ open: false, index: null });
    showAlert("Slab updated in form. Click 'Save Delivery Settings' to persist.");
  };

  const handleDeleteSlab = (index) => {
    const newSlabs = deliveryConfig.slabs.filter((_, i) => i !== index);
    setDeliveryConfig({ ...deliveryConfig, slabs: newSlabs });
  };

  // Save Surge Config
  const handleSaveSurgeConfig = async () => {
    try {
      setLoading(true);
      await api.put("/api/pricing/surge-config", {
        ...surgeConfig,
        reason: "Admin updated surge pricing charges",
      });
      showAlert("Surge pricing saved successfully!");
      fetchPricingConfig();
    } catch (err) {
      showAlert("Failed to save surge pricing", "error");
    } finally {
      setLoading(false);
    }
  };

  // Save Commission Config
  const handleSaveCommissionConfig = async () => {
    try {
      setLoading(true);
      await api.put("/api/pricing/commission-config", {
        ...commissionConfig,
        reason: "Admin updated central commission settings",
      });
      showAlert("Commission settings saved successfully!");
      fetchPricingConfig();
    } catch (err) {
      showAlert("Failed to save commission settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRestaurantCommission = async () => {
    try {
      await api.put("/api/pricing/commission-config", {
        restaurantOverrides: [{
          restaurantId: restaurantCommModal.restaurant._id,
          commissionPercent: Number(restaurantCommValue),
        }],
        reason: `Admin updated ${restaurantCommModal.restaurant.name} commission to ${restaurantCommValue}%`,
      });
      showAlert("Restaurant commission updated!");
      setRestaurantCommModal({ open: false, restaurant: null });
      fetchPricingConfig();
    } catch (err) {
      showAlert("Failed to update restaurant commission", "error");
    }
  };

  // Save Fee Config
  const handleSaveFeeConfig = async () => {
    try {
      setLoading(true);
      await api.put("/api/pricing/fee-config", {
        platformFeeConfig,
        packagingFeeConfig,
        reason: "Admin updated platform & packaging fees",
      });
      showAlert("Platform & Packaging fees saved successfully!");
      fetchPricingConfig();
    } catch (err) {
      showAlert("Failed to save fee settings", "error");
    } finally {
      setLoading(false);
    }
  };

  // Run Preview Simulation
  const handleRunPreview = async () => {
    try {
      if (!previewInput.restaurantId && restaurants.length > 0) {
        previewInput.restaurantId = restaurants[0]._id;
      }
      const res = await api.post("/api/pricing/preview", previewInput);
      setPreviewResult(res.data);
      showAlert("Live pricing calculated!");
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to calculate preview", "error");
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#F4F7F6", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1F2937" }}>
            Central Pricing, Commission & Fee Control Tower
          </Typography>
          <Typography variant="body2" sx={{ color: "#6B7280" }}>
            Centralized Backend Pricing Engine for Delivery Charges, Distance Slabs, Surge Fees, Commissions & Live Simulator
          </Typography>
        </Box>
        <Chip label="LOCAL DEV ONLY — SAFE MODE" color="success" size="small" sx={{ fontWeight: 700 }} />
      </Box>

      {alertInfo.show && (
        <Alert severity={alertInfo.severity} sx={{ mb: 3 }}>
          {alertInfo.message}
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            px: 2,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: "0.92rem" },
            "& .Mui-selected": { color: PRIMARY_COLOR },
          }}
        >
          <Tab icon={<LocalShipping />} iconPosition="start" label="Delivery Charges & Distance Slabs" />
          <Tab icon={<TrendingUp />} iconPosition="start" label="Surge & Extra Charges" />
          <Tab icon={<Percent />} iconPosition="start" label="Commission Control" />
          <Tab icon={<ReceiptLong />} iconPosition="start" label="Platform & Packaging Fees" />
          <Tab icon={<Calculate />} iconPosition="start" label="Live Pricing Simulator" />
        </Tabs>
      </Card>

      {/* ------------------------------------------------------------- */}
      {/* TAB 0: DELIVERY CHARGES & DISTANCE SLABS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3, p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Global Delivery Base Settings
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Base Delivery Fee (₹)</Typography>
                <TextField
                  fullWidth size="small" type="number"
                  value={deliveryConfig.baseFee}
                  onChange={(e) => setDeliveryConfig({ ...deliveryConfig, baseFee: e.target.value })}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Base Distance Included (KM)</Typography>
                <TextField
                  fullWidth size="small" type="number"
                  value={deliveryConfig.baseDistanceKm}
                  onChange={(e) => setDeliveryConfig({ ...deliveryConfig, baseDistanceKm: e.target.value })}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Max Allowed Delivery Radius (KM)</Typography>
                <TextField
                  fullWidth size="small" type="number"
                  value={deliveryConfig.maxDeliveryRadiusKm}
                  onChange={(e) => setDeliveryConfig({ ...deliveryConfig, maxDeliveryRadiusKm: e.target.value })}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Enable Free Delivery Threshold</Typography>
                <Switch
                  checked={deliveryConfig.isFreeDeliveryEnabled}
                  onChange={(e) => setDeliveryConfig({ ...deliveryConfig, isFreeDeliveryEnabled: e.target.checked })}
                  color="success"
                />
              </Box>

              {deliveryConfig.isFreeDeliveryEnabled && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Free Delivery Minimum Order Amount (₹)</Typography>
                  <TextField
                    fullWidth size="small" type="number"
                    value={deliveryConfig.freeDeliveryThreshold}
                    onChange={(e) => setDeliveryConfig({ ...deliveryConfig, freeDeliveryThreshold: e.target.value })}
                  />
                </Box>
              )}

              <Button
                variant="contained"
                fullWidth
                sx={{ bgcolor: PRIMARY_COLOR, mt: 2, fontWeight: 700 }}
                onClick={handleSaveDeliveryConfig}
                disabled={loading}
              >
                Save Delivery Settings
              </Button>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 3, p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Distance Slab Builder
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
                  onClick={() => {
                    setSlabForm({ minDistanceKm: 0, maxDistanceKm: 3, fee: 30, perKmFee: 0, isActive: true });
                    setSlabModal({ open: true, index: null });
                  }}
                >
                  Add Distance Slab
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "none", border: "1px solid #E5E7EB" }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#F9FAFB" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Distance Range</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Flat Fee (₹)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Per-KM Fee (₹)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(deliveryConfig.slabs || []).map((slab, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontWeight: 600 }}>{slab.minDistanceKm} – {slab.maxDistanceKm} KM</TableCell>
                        <TableCell>₹{slab.fee}</TableCell>
                        <TableCell>{slab.perKmFee > 0 ? `+ ₹${slab.perKmFee}/km` : "None"}</TableCell>
                        <TableCell>
                          <Chip label={slab.isActive !== false ? "Active" : "Disabled"} size="small" color={slab.isActive !== false ? "success" : "default"} />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSlabForm(slab);
                              setSlabModal({ open: true, index: idx });
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteSlab(idx)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: SURGE & EXTRA CHARGES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Peak Hour Charge</Typography>
                <Switch
                  checked={surgeConfig.peakHour?.enabled || false}
                  onChange={(e) => setSurgeConfig({
                    ...surgeConfig,
                    peakHour: { ...surgeConfig.peakHour, enabled: e.target.checked }
                  })}
                  color="success"
                />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Extra charge added to delivery fee during lunch/dinner peak hours
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField fullWidth size="small" label="Fee (₹)" type="number" value={surgeConfig.peakHour?.fee || 15} onChange={(e) => setSurgeConfig({ ...surgeConfig, peakHour: { ...surgeConfig.peakHour, fee: e.target.value } })} />
                </Grid>
                <Grid item xs={4}>
                  <TextField fullWidth size="small" label="Start Time" value={surgeConfig.peakHour?.startTime || "12:00"} onChange={(e) => setSurgeConfig({ ...surgeConfig, peakHour: { ...surgeConfig.peakHour, startTime: e.target.value } })} />
                </Grid>
                <Grid item xs={4}>
                  <TextField fullWidth size="small" label="End Time" value={surgeConfig.peakHour?.endTime || "15:00"} onChange={(e) => setSurgeConfig({ ...surgeConfig, peakHour: { ...surgeConfig.peakHour, endTime: e.target.value } })} />
                </Grid>
              </Grid>
            </Card>

            <Card sx={{ borderRadius: 3, p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Night Charge</Typography>
                <Switch
                  checked={surgeConfig.nightCharge?.enabled || false}
                  onChange={(e) => setSurgeConfig({
                    ...surgeConfig,
                    nightCharge: { ...surgeConfig.nightCharge, enabled: e.target.checked }
                  })}
                  color="success"
                />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Late-night operational charge
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField fullWidth size="small" label="Fee (₹)" type="number" value={surgeConfig.nightCharge?.fee || 25} onChange={(e) => setSurgeConfig({ ...surgeConfig, nightCharge: { ...surgeConfig.nightCharge, fee: e.target.value } })} />
                </Grid>
                <Grid item xs={4}>
                  <TextField fullWidth size="small" label="Start Time" value={surgeConfig.nightCharge?.startTime || "23:00"} onChange={(e) => setSurgeConfig({ ...surgeConfig, nightCharge: { ...surgeConfig.nightCharge, startTime: e.target.value } })} />
                </Grid>
                <Grid item xs={4}>
                  <TextField fullWidth size="small" label="End Time" value={surgeConfig.nightCharge?.endTime || "06:00"} onChange={(e) => setSurgeConfig({ ...surgeConfig, nightCharge: { ...surgeConfig.nightCharge, endTime: e.target.value } })} />
                </Grid>
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Rain / Bad Weather Charge</Typography>
                <Switch
                  checked={surgeConfig.rainCharge?.enabled || false}
                  onChange={(e) => setSurgeConfig({
                    ...surgeConfig,
                    rainCharge: { ...surgeConfig.rainCharge, enabled: e.target.checked }
                  })}
                  color="success"
                />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Special rain delivery incentive charge
              </Typography>
              <TextField fullWidth size="small" label="Rain Fee (₹)" type="number" value={surgeConfig.rainCharge?.fee || 20} onChange={(e) => setSurgeConfig({ ...surgeConfig, rainCharge: { ...surgeConfig.rainCharge, fee: e.target.value } })} />
            </Card>

            <Card sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>High Demand Surge</Typography>
                <Switch
                  checked={surgeConfig.highDemandCharge?.enabled || false}
                  onChange={(e) => setSurgeConfig({
                    ...surgeConfig,
                    highDemandCharge: { ...surgeConfig.highDemandCharge, enabled: e.target.checked }
                  })}
                  color="success"
                />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Applied during sudden order surges
              </Typography>
              <TextField fullWidth size="small" label="Surge Fee (₹)" type="number" value={surgeConfig.highDemandCharge?.fee || 15} onChange={(e) => setSurgeConfig({ ...surgeConfig, highDemandCharge: { ...surgeConfig.highDemandCharge, fee: e.target.value } })} />
            </Card>

            <Button variant="contained" fullWidth sx={{ bgcolor: PRIMARY_COLOR, fontWeight: 700 }} onClick={handleSaveSurgeConfig}>
              Save Surge Configuration
            </Button>
          </Grid>
        </Grid>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: COMMISSION CONTROL */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Global Default Commission</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Default platform commission applied if no restaurant or category override exists.
              </Typography>
              <TextField
                fullWidth size="small" label="Global Commission (%)" type="number"
                value={commissionConfig.globalCommissionPercent}
                onChange={(e) => setCommissionConfig({ ...commissionConfig, globalCommissionPercent: e.target.value })}
                sx={{ mb: 2 }}
              />
              <Button variant="contained" fullWidth sx={{ bgcolor: PRIMARY_COLOR, fontWeight: 700 }} onClick={handleSaveCommissionConfig}>
                Save Global Commission
              </Button>
            </Card>

            <Card sx={{ borderRadius: 3, p: 3, bgcolor: "#FFFBEB", border: `1px solid ${ACCENT_COLOR}` }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: ACCENT_COLOR, mb: 1 }}>
                Commission Precedence Rules
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                1. <strong>Restaurant Specific Override</strong> (If restaurant has custom commission set).<br />
                2. <strong>Category Specific Override</strong> (If items belong to custom category commission).<br />
                3. <strong>Global Default Commission</strong> (Fall back default 20%).
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 3, p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Restaurant Commission Directory ({restaurants.length})</Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "none", border: "1px solid #E5E7EB" }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#F9FAFB" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Restaurant</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Applied Commission</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {restaurants.map((r) => (
                      <TableRow key={r._id}>
                        <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                        <TableCell>
                          <Chip label={`${r.adminCommission}%`} color="primary" size="small" />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setRestaurantCommValue(r.adminCommission);
                              setRestaurantCommModal({ open: true, restaurant: r });
                            }}
                          >
                            Edit Commission
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: PLATFORM & PACKAGING FEES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Platform Fee Control</Typography>
                <Switch
                  checked={platformFeeConfig.enabled}
                  onChange={(e) => setPlatformFeeConfig({ ...platformFeeConfig, enabled: e.target.checked })}
                  color="success"
                />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Configurable customer platform fee charged on checkout
              </Typography>

              <TextField
                fullWidth size="small" label="Platform Fee Amount (₹)" type="number"
                value={platformFeeConfig.fee}
                onChange={(e) => setPlatformFeeConfig({ ...platformFeeConfig, fee: e.target.value })}
                sx={{ mb: 2 }}
              />

              <Button variant="contained" fullWidth sx={{ bgcolor: PRIMARY_COLOR, fontWeight: 700 }} onClick={handleSaveFeeConfig}>
                Save Platform Fee
              </Button>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Packaging Fee Control</Typography>
                <Switch
                  checked={packagingFeeConfig.enabled}
                  onChange={(e) => setPackagingFeeConfig({ ...packagingFeeConfig, enabled: e.target.checked })}
                  color="success"
                />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Global container/packaging fee (restaurant specific packaging charge takes precedence if set)
              </Typography>

              <TextField
                fullWidth size="small" label="Global Packaging Fee (₹)" type="number"
                value={packagingFeeConfig.globalPackagingFee}
                onChange={(e) => setPackagingFeeConfig({ ...packagingFeeConfig, globalPackagingFee: e.target.value })}
                sx={{ mb: 2 }}
              />

              <Button variant="contained" fullWidth sx={{ bgcolor: PRIMARY_COLOR, fontWeight: 700 }} onClick={handleSaveFeeConfig}>
                Save Packaging Fee
              </Button>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: LIVE PRICING SIMULATOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3, p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Live Pricing Calculation Simulator
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Simulate exact User App checkout bill & commission breakdown without placing orders.
              </Typography>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Select Restaurant</InputLabel>
                <Select
                  value={previewInput.restaurantId}
                  label="Select Restaurant"
                  onChange={(e) => setPreviewInput({ ...previewInput, restaurantId: e.target.value })}
                >
                  {restaurants.map((r) => (
                    <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth size="small" label="Delivery Distance (KM)" type="number"
                value={previewInput.deliveryDistance}
                onChange={(e) => setPreviewInput({ ...previewInput, deliveryDistance: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth size="small" label="Food Items Total (₹)" type="number"
                value={previewInput.itemTotal}
                onChange={(e) => setPreviewInput({ ...previewInput, itemTotal: e.target.value })}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Order Type</InputLabel>
                <Select
                  value={previewInput.orderType}
                  label="Order Type"
                  onChange={(e) => setPreviewInput({ ...previewInput, orderType: e.target.value })}
                >
                  <MenuItem value="delivery">Home Delivery</MenuItem>
                  <MenuItem value="self_pickup">Self Pickup</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                fullWidth
                startIcon={<Calculate />}
                sx={{ bgcolor: PRIMARY_COLOR, fontWeight: 700 }}
                onClick={handleRunPreview}
              >
                Run Pricing Simulation
              </Button>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 3, p: 3, bgcolor: "#FFFFFF" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Simulation Results Breakdown
              </Typography>

              {previewResult ? (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Card sx={{ p: 2, bgcolor: "#F9FAFB" }}>
                        <Typography variant="caption" color="textSecondary">Customer Payable</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: PRIMARY_COLOR }}>
                          ₹{previewResult.preview?.totalAmount}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card sx={{ p: 2, bgcolor: "#FFFBEB" }}>
                        <Typography variant="caption" color="textSecondary">Net Restaurant Payout</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: ACCENT_COLOR }}>
                          ₹{previewResult.preview?.restaurantNetPayable}
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "none", border: "1px solid #E5E7EB", mb: 2 }}>
                    <Table size="small">
                      <TableBody>
                        <TableRow><TableCell sx={{ fontWeight: 600 }}>Item Total</TableCell><TableCell align="right">₹{previewResult.preview?.itemTotal}</TableCell></TableRow>
                        <TableRow><TableCell sx={{ fontWeight: 600 }}>Taxes (GST)</TableCell><TableCell align="right">₹{previewResult.preview?.tax}</TableCell></TableRow>
                        <TableRow><TableCell sx={{ fontWeight: 600 }}>Packaging Fee</TableCell><TableCell align="right">₹{previewResult.preview?.packaging}</TableCell></TableRow>
                        <TableRow><TableCell sx={{ fontWeight: 600 }}>Base Delivery Fee</TableCell><TableCell align="right">₹{previewResult.preview?.deliveryFee}</TableCell></TableRow>
                        <TableRow><TableCell sx={{ fontWeight: 600 }}>Extra Surge Charges</TableCell><TableCell align="right">₹{previewResult.preview?.extraDeliveryCharges}</TableCell></TableRow>
                        <TableRow><TableCell sx={{ fontWeight: 600 }}>Platform Fee</TableCell><TableCell align="right">₹{previewResult.preview?.platformFee}</TableCell></TableRow>
                        <TableRow><TableCell sx={{ fontWeight: 600, color: "green" }}>Discounts Applied</TableCell><TableCell align="right" sx={{ color: "green" }}>- ₹{previewResult.preview?.discount}</TableCell></TableRow>
                        <TableRow sx={{ bgcolor: "#F3F4F6" }}><TableCell sx={{ fontWeight: 800 }}>Total Customer Amount</TableCell><TableCell align="right" sx={{ fontWeight: 800 }}>₹{previewResult.preview?.totalAmount}</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ p: 2, bgcolor: "#ECFDF5", borderRadius: 2, border: "1px solid #A7F3D0" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: PRIMARY_COLOR, mb: 0.5 }}>
                      Audit & Rule Traceability
                    </Typography>
                    <Typography variant="body2">
                      • <strong>Delivery Rule Applied:</strong> {previewResult.sources?.deliveryRule}<br />
                      • <strong>Commission Rule Applied:</strong> {previewResult.sources?.commissionRule}<br />
                      • <strong>Calculated Admin Commission Amount:</strong> ₹{previewResult.preview?.adminCommissionAmount} ({previewResult.preview?.appliedCommissionRate}%)
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: "center", py: 5, color: "#9CA3AF" }}>
                  <Calculate sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="body2">Select parameters and click 'Run Pricing Simulation' to test live breakdown.</Typography>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DIALOG: DISTANCE SLAB FORM */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={slabModal.open} onClose={() => setSlabModal({ open: false, index: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{slabModal.index !== null ? "Edit Distance Slab" : "Add Distance Slab"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Min Distance (KM)" type="number" value={slabForm.minDistanceKm} onChange={(e) => setSlabForm({ ...slabForm, minDistanceKm: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Max Distance (KM)" type="number" value={slabForm.maxDistanceKm} onChange={(e) => setSlabForm({ ...slabForm, maxDistanceKm: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Flat Delivery Charge (₹)" type="number" value={slabForm.fee} onChange={(e) => setSlabForm({ ...slabForm, fee: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Additional Per-KM Charge (₹, Optional)" type="number" value={slabForm.perKmFee} onChange={(e) => setSlabForm({ ...slabForm, perKmFee: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSlabModal({ open: false, index: null })}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: PRIMARY_COLOR }} onClick={handleSaveSlab}>Save Slab</Button>
        </DialogActions>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* DIALOG: RESTAURANT COMMISSION */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={restaurantCommModal.open} onClose={() => setRestaurantCommModal({ open: false, restaurant: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Restaurant Commission</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2, mt: 1 }}>
            Set custom commission percentage for {restaurantCommModal.restaurant?.name}. Overrides global commission.
          </Typography>
          <TextField
            fullWidth size="small" label="Commission (%)" type="number"
            value={restaurantCommValue}
            onChange={(e) => setRestaurantCommValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRestaurantCommModal({ open: false, restaurant: null })}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: PRIMARY_COLOR }} onClick={handleSaveRestaurantCommission}>
            Save Commission
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
